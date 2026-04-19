import { AlertTriangle, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServerErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ServerErrorPage({ 
  title = "خطأ في الخادم", 
  message = "حدث خطأ غير متوقع من الخادم. يرجى المحاولة لاحقاً.",
  onRetry 
}: ServerErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-6 animate-in fade-in zoom-in-50 duration-300" dir="rtl">
      <div className="relative">
        <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-destructive/10 p-6 rounded-full border border-destructive/20">
          <ServerCrash className="h-12 w-12 text-destructive" />
        </div>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-4">
          <Button 
            onClick={onRetry} 
            variant="default" 
            className="gap-2 rounded-xl min-w-[160px]"
          >
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground/60 mt-4">
        إذا استمرت المشكلة، يرجى التواصل مع الدعم الفني.
      </p>
    </div>
  );
}

export function isServerError(error: any): boolean {
  return error?.response?.status >= 500;
}
