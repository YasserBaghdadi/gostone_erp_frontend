import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Package } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  icon: Icon = Package, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[300px] p-6 text-center",
      "rounded-2xl border-2 border-dashed border-muted bg-muted/5",
      "animate-in fade-in zoom-in-50 duration-300",
      className
    )}>
      <div className="bg-muted/20 p-6 rounded-full mb-4">
        <Icon className="h-12 w-12 text-muted-foreground/50" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
