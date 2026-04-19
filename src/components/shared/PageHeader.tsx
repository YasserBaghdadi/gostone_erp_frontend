import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  sticky?: boolean;
  children?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  action, 
  sticky = false,
  children 
}: PageHeaderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4",
        "bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm transition-all",
        sticky && "sticky top-4 z-10"
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
          {icon}
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {children}
        {action}
      </div>
    </div>
  );
}
