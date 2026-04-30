import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "./OfflinePage";

/**
 * Sticky banner shown at the top of the app when the browser is offline.
 *
 * Relies on `navigator.onLine` via the shared `useOnlineStatus` hook.
 * Stays out of the way when online (renders nothing).
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className="fixed top-0 inset-x-0 z-[100] bg-destructive text-destructive-foreground shadow-md animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>لا يوجد اتصال بالإنترنت — جاري الانتظار حتى يعود الاتصال</span>
      </div>
    </div>
  );
}
