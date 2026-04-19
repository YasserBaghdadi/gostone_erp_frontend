import { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Signal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflinePageProps {
  onRetry?: () => void;
}

export function OfflinePage({ onRetry }: OfflinePageProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    
    // Check if we're back online
    if (navigator.onLine) {
      if (onRetry) {
        onRetry();
      } else {
        window.location.reload();
      }
    } else {
      // Wait a bit then reset
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsChecking(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6 animate-in fade-in zoom-in-50 duration-300" dir="rtl">
      <div className="relative">
        <div className="absolute inset-0 bg-warning/15 rounded-full blur-3xl animate-pulse" />
        <div className="relative bg-warning/10 p-6 rounded-full border border-warning/20">
          <WifiOff className="h-12 w-12 text-warning" />
        </div>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Signal className="h-6 w-6 text-warning" />
          لا يوجد اتصال بالإنترنت
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.
        </p>
      </div>

      <div className="pt-4">
        <Button 
          onClick={handleRetry} 
          variant="default" 
          className="gap-2 rounded-xl min-w-[160px]"
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? "جاري التحقق..." : "إعادة المحاولة"}
        </Button>
      </div>
      
      <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-border/50 max-w-sm">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">نصائح:</span>
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1 text-right">
          <li>• تأكد من تشغيل الواي فاي أو بيانات الجوال</li>
          <li>• حاول إعادة تشغيل جهاز الراوتر</li>
          <li>• تحقق من إعدادات الشبكة</li>
        </ul>
      </div>
    </div>
  );
}

// Hook to detect online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Helper to detect if error is network-related
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  // No response at all (network failure)
  if (!error.response && error.message) {
    return error.message.includes('Network Error') || 
           error.message.includes('Failed to fetch') ||
           error.code === 'ERR_NETWORK';
  }
  
  return false;
}
