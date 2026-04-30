import { Suspense, type ReactNode, type ComponentType } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ModuleErrorBoundary } from '@/components/ModuleErrorBoundary';
import { Loader2 } from 'lucide-react';

interface LazyRouteProps {
  /** The lazy loaded component */
  component: ComponentType;
  /** Module name for error boundary (Arabic) */
  moduleName?: string;
  /** Fallback path when error occurs (default: "/") */
  fallbackPath?: string;
}

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">جاري التحميل...</p>
    </div>
  </div>
);

/**
 * LazyRoute - Wrapper for lazy loaded route components
 *
 * Combines:
 *   - Suspense                  → handles the lazy() chunk loading state
 *   - QueryErrorResetBoundary   → lets the retry button re-run failed queries
 *   - ModuleErrorBoundary       → renders the error screen for thrown errors,
 *                                 including react-query failures (via the
 *                                 `throwOnError: data === undefined` option set
 *                                 in QueryProvider)
 *
 * @example
 * <Route path="customers" element={<LazyRoute component={CustomersList} moduleName="العملاء" />} />
 */
export function LazyRoute({ component: Component, moduleName, fallbackPath = '/' }: LazyRouteProps): ReactNode {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ModuleErrorBoundary
          moduleName={moduleName}
          fallbackPath={fallbackPath}
          onReset={reset}
        >
          <Suspense fallback={<PageLoader />}>
            <Component />
          </Suspense>
        </ModuleErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
