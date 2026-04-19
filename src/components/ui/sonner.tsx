import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/50 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.08)] group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-bold",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs font-medium mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground h-9 px-4 rounded-xl",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground h-9 px-4 rounded-xl",
          success: "group-[.toaster]:bg-success-light group-[.toaster]:text-success-dark group-[.toaster]:border-success/30",
          error: "group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/30",
          warning: "group-[.toaster]:bg-warning-light group-[.toaster]:text-warning-dark group-[.toaster]:border-warning/30",
          info: "group-[.toaster]:bg-info-light group-[.toaster]:text-info-dark group-[.toaster]:border-info/30",
        },
      }}
      position="top-right"
      dir="rtl"
      richColors
      closeButton
      {...props}
    />
  )
}

export { Toaster }
