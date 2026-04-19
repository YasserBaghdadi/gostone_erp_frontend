import { useState, useEffect, useCallback, useRef } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  AlertCircle,
  Loader2,
  LogOut,
  X
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Types ---
export type ConfirmModalVariant = "default" | "destructive" | "success" | "warning" | "logout";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
  /** Additional details to show (optional) */
  details?: string[];
}

// --- Variant Configurations ---
const variantConfig: Record<ConfirmModalVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmBtnClass: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  ringColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    confirmBtnClass: "bg-success hover:bg-success-dark text-success-foreground shadow-lg shadow-success/25 border-0",
    gradientFrom: "hsl(var(--color-success))",
    gradientTo: "hsl(var(--color-success-dark))",
    glowColor: "shadow-success/15",
    ringColor: "ring-success/20",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    confirmBtnClass: "bg-warning hover:bg-warning-dark text-warning-foreground shadow-lg shadow-warning/25 border-0",
    gradientFrom: "hsl(var(--color-warning))",
    gradientTo: "hsl(var(--color-warning-dark))",
    glowColor: "shadow-warning/15",
    ringColor: "ring-warning/20",
  },
  destructive: {
    icon: AlertCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    confirmBtnClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/25 border-0",
    gradientFrom: "hsl(var(--color-destructive))",
    gradientTo: "hsl(var(--color-destructive))",
    glowColor: "shadow-destructive/15",
    ringColor: "ring-destructive/20",
  },
  default: {
    icon: Info,
    iconBg: "bg-info/10",
    iconColor: "text-info",
    confirmBtnClass: "bg-info hover:bg-info-dark text-info-foreground shadow-lg shadow-info/25 border-0",
    gradientFrom: "hsl(var(--color-info))",
    gradientTo: "hsl(var(--color-info-dark))",
    glowColor: "shadow-info/15",
    ringColor: "ring-info/20",
  },
  logout: {
    icon: LogOut,
    iconBg: "bg-muted-foreground/10",
    iconColor: "text-muted-foreground",
    confirmBtnClass: "bg-muted-foreground hover:bg-muted-foreground/90 text-background shadow-lg shadow-muted-foreground/25 border-0",
    gradientFrom: "hsl(var(--color-muted-foreground))",
    gradientTo: "hsl(var(--color-muted-foreground))",
    glowColor: "shadow-muted-foreground/15",
    ringColor: "ring-muted-foreground/20",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "default",
  isLoading = false,
  details,
}: ConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Reset confirming state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  const loading = isLoading || isConfirming;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !loading && !open && onClose()}>
      <AlertDialogContent 
        className={cn(
          "sm:max-w-[420px] p-0 overflow-hidden border-0 gap-0",
          "bg-linear-to-b from-background to-background/98",
          "backdrop-blur-xl",
          `shadow-2xl ${config.glowColor}`
        )}
        dir="rtl"
      >
        {/* Accent Gradient Bar */}
        <div 
          className="h-1.5 w-full"
          style={{
            background: `linear-gradient(90deg, ${config.gradientFrom}, ${config.gradientTo})`
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className={cn(
            "absolute left-4 top-5 z-10",
            "p-1.5 rounded-full",
            "bg-muted/50 hover:bg-muted",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 pt-8">
          {/* Icon with Animated Ring */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer Glow Ring - Animated */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-full",
                  config.iconBg,
                  "animate-ping opacity-50"
                )} 
                style={{ 
                  transform: "scale(1.3)",
                  animationDuration: "2s"
                }}
              />
              {/* Static Glow */}
              <div 
                className={cn(
                  "absolute inset-0 rounded-full",
                  config.iconBg,
                )} 
                style={{ transform: "scale(1.4)" }}
              />
              {/* Icon Container */}
              <div className={cn(
                "relative z-10",
                "w-20 h-20 rounded-full",
                "flex items-center justify-center",
                config.iconBg,
                `ring-4 ring-background ${config.ringColor}`,
                "shadow-xl",
                "animate-in zoom-in-50 duration-500"
              )}>
                <IconComponent className={cn("h-10 w-10", config.iconColor)} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3 mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed px-2">
              {description}
            </p>
          </div>

          {/* Optional Details List */}
          {details && details.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {details.map((detail, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      config.iconColor.replace("text-", "bg-")
                    )} />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={cn(
                "flex-1 h-12 text-base font-semibold",
                "rounded-xl",
                "border-border/50 hover:border-border",
                "bg-transparent hover:bg-muted/50",
                "transition-all duration-200",
                "active:scale-[0.98]"
              )}
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                "flex-1 h-12 text-base font-semibold",
                "rounded-xl",
                "transition-all duration-300",
                "hover:scale-[1.02] active:scale-[0.98]",
                "hover:shadow-xl",
                config.confirmBtnClass
              )}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// --- Hook for Promise-based Confirmation ---
interface UseConfirmOptions {
  title: string;
  description: string;
  variant?: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
  details?: string[];
}

interface ConfirmState {
  isOpen: boolean;
  options: UseConfirmOptions | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: null,
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: UseConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        isOpen: true,
        options,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    resolveRef.current = null;
    setState({ isOpen: false, options: null });
  }, []);

  const handleClose = useCallback(() => {
    resolveRef.current?.(false);
    resolveRef.current = null;
    setState({ isOpen: false, options: null });
  }, []);

  const ConfirmDialog = useCallback(() => {
    if (!state.options) return null;
    
    return (
      <ConfirmModal
        isOpen={state.isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={state.options.title}
        description={state.options.description}
        variant={state.options.variant}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        details={state.options.details}
      />
    );
  }, [state.isOpen, state.options, handleClose, handleConfirm]);

  return { confirm, ConfirmDialog };
}
