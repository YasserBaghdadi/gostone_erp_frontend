import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, WifiOff, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleErrorBoundaryProps {
  children: ReactNode;
  /** Module name to display in the error message */
  moduleName?: string;
  /** Fallback path to navigate to on error */
  fallbackPath?: string;
  /**
   * Called when the user clicks "إعادة المحاولة".
   * Useful for resetting react-query's error state so retried queries actually re-run.
   */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// How often to silently retry a failed network request while the error screen
// is visible. 5s is a good balance between responsiveness and not hammering
// the API while it's down.
const NETWORK_RETRY_INTERVAL_MS = 5000;

type ErrorKind = 'network' | 'chunk-load' | 'server' | 'generic';

/**
 * Detect Vite/webpack dynamic-import failures. These happen when
 * `lazy(() => import(...))` can't fetch its chunk — usually because the
 * network dropped, or the dev server / CDN restarted and old hashes vanished.
 *
 * `lazy()` caches the failed promise forever, so the only real fix is a
 * hard page reload — state-only retries will keep replaying the same failure.
 */
function isChunkLoadError(error: Error | null): boolean {
  if (!error) return false;
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('error loading dynamically imported module') ||
    // Vite-specific
    msg.includes('Importing a module script failed')
  );
}

function classifyError(error: Error | null): ErrorKind {
  if (isChunkLoadError(error)) return 'chunk-load';
  if (!navigator.onLine) return 'network';
  if (error instanceof AxiosError) {
    if (
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK'
    ) {
      return 'network';
    }
    if (error.response.status >= 500) return 'server';
  }
  return 'generic';
}

/**
 * Error Boundary for individual modules/pages.
 *
 * Catches:
 *   - React render errors thrown by children
 *   - react-query failures (when QueryProvider's `throwOnError` is enabled)
 *
 * Renders a contextual message based on the error type — network vs. server
 * vs. generic — so users know whether to check their connection or just retry.
 */
export class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /** Polling timer used to silently retry while a network-error screen is up. */
  private retryTimer: ReturnType<typeof setInterval> | null = null;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.moduleName || 'Module'}] Error:`, error, errorInfo);
  }

  public componentDidMount() {
    // Fast path: the browser flips to "online" (true offline → online).
    window.addEventListener('online', this.handleOnline);
    // Cover the case where we mounted directly into an error state.
    this.startNetworkRetryIfNeeded();
  }

  public componentDidUpdate(_: ModuleErrorBoundaryProps, prevState: State) {
    // (Re)start the poll whenever we enter an error state; stop it when we leave.
    if (this.state.hasError && !prevState.hasError) {
      this.startNetworkRetryIfNeeded();
    } else if (!this.state.hasError && prevState.hasError) {
      this.stopNetworkRetry();
    }
  }

  public componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    this.stopNetworkRetry();
  }

  private startNetworkRetryIfNeeded() {
    // Auto-retry only for transient kinds. Server (5xx) / generic errors might
    // recur immediately — auto-retrying those would trap the user in a
    // visible retry loop. They need a manual "إعادة المحاولة" click.
    if (!this.state.hasError) return;
    const kind = classifyError(this.state.error);
    if (kind !== 'network' && kind !== 'chunk-load') return;

    this.stopNetworkRetry();
    this.retryTimer = setInterval(this.handleRetry, NETWORK_RETRY_INTERVAL_MS);
  }

  private stopNetworkRetry() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private handleOnline = () => {
    if (!this.state.hasError) return;
    const kind = classifyError(this.state.error);
    if (kind !== 'network' && kind !== 'chunk-load') return;
    // Don't wait for the next poll tick — try immediately.
    this.handleRetry();
  };

  private handleRetry = () => {
    // Chunk-load failures are special: React's lazy() permanently caches the
    // failed promise, so resetting state alone replays the same failure. Only
    // a fresh document load can clear it. We only do this when the browser is
    // actually back online — otherwise reload would just refail and nuke any
    // unsaved page state.
    if (
      classifyError(this.state.error) === 'chunk-load' &&
      navigator.onLine
    ) {
      window.location.reload();
      return;
    }

    // Normal path: let parent (QueryErrorResetBoundary) reset its state first,
    // then clear our own so children re-render and re-run their queries.
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const { moduleName = 'الصفحة', fallbackPath = '/' } = this.props;
      const kind = classifyError(this.state.error);

      // Per-kind copy & visual. `chunk-load` shares the WiFi-off look because
      // it almost always boils down to a connectivity/restart issue.
      const config =
        kind === 'network' || kind === 'chunk-load'
          ? {
              Icon: WifiOff,
              tone: 'warning' as const,
              title: 'تعذر الاتصال بالإنترنت',
              description: `لم نستطع تحميل ${moduleName} لأن الاتصال بالإنترنت غير متوفر. يرجى التحقق من اتصالك ثم المحاولة مرة أخرى.`,
            }
          : kind === 'server'
          ? {
              Icon: AlertTriangle,
              tone: 'destructive' as const,
              title: `تعذر تحميل ${moduleName}`,
              description: 'حدثت مشكلة في الخادم. يرجى المحاولة مرة أخرى بعد قليل.',
            }
          : {
              Icon: AlertTriangle,
              tone: 'destructive' as const,
              title: `حدث خطأ في تحميل ${moduleName}`,
              description:
                'نعتذر، حدثت مشكلة أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.',
            };

      const { Icon, tone, title, description } = config;
      const toneClasses =
        tone === 'warning'
          ? 'bg-warning/10 text-warning'
          : 'bg-destructive/10 text-destructive';

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center" dir="rtl">
          <div className={`p-4 rounded-full mb-4 ${toneClasses}`}>
            <Icon className="h-10 w-10" />
          </div>

          <h2 className="text-xl font-bold mb-2">{title}</h2>

          <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>

          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="default" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              إعادة المحاولة
            </Button>

            <Link to={fallbackPath}>
              <Button variant="outline" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
