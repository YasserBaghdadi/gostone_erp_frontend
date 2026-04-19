import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState, EmptyState } from "@/components/shared";
import type { LucideIcon } from "lucide-react";

export interface Column<T> {
  /** Unique key for the column */
  key: string;
  /** Header text */
  header: string | ReactNode;
  /** Render function for cell content */
  render: (item: T, index: number) => ReactNode;
  /** Optional className for the cell */
  className?: string;
  /** Optional width */
  width?: string;
}

export interface DataTableProps<T> {
  /** Array of data items */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Unique key extractor for each row */
  keyExtractor: (item: T) => string | number;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Empty state configuration */
  emptyState?: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
  };
  /** Click handler for row */
  onRowClick?: (item: T) => void;
  /** Custom row className */
  rowClassName?: string | ((item: T) => string);
}

/**
 * Reusable DataTable component for consistent table styling
 * 
 * @example
 * <DataTable
 *   data={customers}
 *   columns={[
 *     { key: 'name', header: 'الاسم', render: (c) => c.first_name },
 *     { key: 'phone', header: 'الهاتف', render: (c) => c.phone_number },
 *   ]}
 *   keyExtractor={(c) => c.id}
 *   isLoading={isLoading}
 *   emptyState={{ title: 'لا يوجد عملاء', icon: Users }}
 *   onRowClick={(c) => navigate(`/customers/${c.id}`)}
 * />
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  loadingMessage = "جاري التحميل...",
  emptyState,
  onRowClick,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (data.length === 0 && emptyState) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  const getRowClassName = (item: T) => {
    const baseClass = onRowClick 
      ? "cursor-pointer hover:bg-muted/50 transition-colors" 
      : "";
    
    if (typeof rowClassName === "function") {
      return `${baseClass} ${rowClassName(item)}`;
    }
    return `${baseClass} ${rowClassName || ""}`;
  };

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.className}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={keyExtractor(item)}
                className={getRowClassName(item)}
                onClick={() => onRowClick?.(item)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(item);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                aria-label={onRowClick ? `عرض تفاصيل العنصر ${index + 1}` : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
