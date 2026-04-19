import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingState({ 
  message = "جاري التحميل...", 
  className,
  size = "md" 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div 
      className={cn("flex items-center justify-center min-h-[300px]", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} aria-hidden="true" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

