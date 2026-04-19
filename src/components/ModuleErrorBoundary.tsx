import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModuleErrorBoundaryProps {
  children: ReactNode;
  /** Module name to display in the error message */
  moduleName?: string;
  /** Fallback path to navigate to on error */
  fallbackPath?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for individual modules/pages
 * 
 * Use this component to wrap individual routes/modules to isolate errors
 * and prevent the entire application from crashing.
 * 
 * @example
 * <Route path="customers">
 *   <ModuleErrorBoundary moduleName="العملاء" fallbackPath="/">
 *     <CustomersList />
 *   </ModuleErrorBoundary>
 * </Route>
 */
export class ModuleErrorBoundary extends Component<ModuleErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.moduleName || 'Module'}] Error:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const { moduleName = 'الصفحة', fallbackPath = '/' } = this.props;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center" dir="rtl">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          
          <h2 className="text-xl font-bold mb-2">
            حدث خطأ في تحميل {moduleName}
          </h2>
          
          <p className="text-muted-foreground mb-6 max-w-sm">
            نعتذر، حدثت مشكلة أثناء تحميل هذه الصفحة. يمكنك المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
          </p>

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
