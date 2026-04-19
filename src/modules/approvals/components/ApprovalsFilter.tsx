import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader } from "lucide-react";

export type ApprovalFilterStatus = "pending" | "in_progress" | "approved" | "rejected";

interface ApprovalsFilterProps {
  currentFilter: ApprovalFilterStatus;
  onFilterChange: (filter: ApprovalFilterStatus) => void;
  totalCount?: number;
}

export function ApprovalsFilter({ currentFilter, onFilterChange, totalCount }: ApprovalsFilterProps) {
  const filters: { id: ApprovalFilterStatus; label: string; icon: typeof Clock; color: string }[] = [
    { id: "pending", label: "قيد الانتظار", icon: Clock, color: "text-warning" },
    { id: "in_progress", label: "قيد المعالجة", icon: Loader, color: "text-info" },
    { id: "approved", label: "تمت الموافقة", icon: CheckCircle, color: "text-success" },
    { id: "rejected", label: "مرفوض", icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/20 rounded-lg">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={currentFilter === filter.id ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center gap-2 h-9 px-4 rounded-md transition-all ${
            currentFilter === filter.id 
              ? "bg-white shadow-sm hover:bg-white" 
              : "hover:bg-muted"
          }`}
        >
          <filter.icon className={`h-4 w-4 ${currentFilter === filter.id ? filter.color : "text-muted-foreground"}`} />
          <span className={currentFilter === filter.id ? "font-medium text-foreground" : "text-muted-foreground"}>
            {filter.label}
          </span>
          {currentFilter === filter.id && totalCount !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-foreground">
              {totalCount}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
