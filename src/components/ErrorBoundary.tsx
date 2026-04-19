import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if error is a chunk load error
    const isChunkError = error.message?.includes('Loading chunk') || 
                         error.message?.includes('Importing a module script failed');
    return { hasError: true, isChunkError };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
              <RefreshCcw className="h-12 w-12 text-primary animate-spin-slow" />
            </div>
            <h1 className="text-2xl font-bold mb-2">تحديث مطلوب</h1>
            <p className="text-muted-foreground mb-6 max-w-sm">
              تم تحديث التطبيق إلى نسخة جديدة. يرجى تحديث الصفحة للحصول على آخر التغييرات.
            </p>
            <Button onClick={this.handleReload} size="lg" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              تحديث الصفحة الآن
            </Button>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 text-center">
          <div className="bg-destructive/10 p-4 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            نعتذر، حدثت مشكلة أثناء عرض الصفحة.
          </p>
          <Button onClick={this.handleReload} variant="outline" size="lg">
            إعادة المحاولة
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
