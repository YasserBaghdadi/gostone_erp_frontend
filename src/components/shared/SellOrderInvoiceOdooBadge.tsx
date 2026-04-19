import { CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SellOrderInvoiceOdooBadgeProps = {
  className?: string;
  /** عند true: مزامن، عند false: غير مزامن */
  isSynced: boolean;
};

/**
 * شارة حالة المزامنة مع Odoo لأمر البيع.
 * - مزامن: عند وجود فاتورة مرفوعة (invoice_file)
 * - غير مزامن: عند عدم وجود فاتورة
 */
export function SellOrderInvoiceOdooBadge({
  className,
  isSynced,
}: SellOrderInvoiceOdooBadgeProps) {
  const label = isSynced ? "مزامن مع Odoo" : "غير مزامن Odoo";
  const title = isSynced ? "مزامن مع Odoo" : "غير مزامن مع Odoo";
  return (
    <Badge
      variant="outline"
      className={cn(
        isSynced
          ? "gap-1 border-emerald-500/45 bg-emerald-500/10 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200 font-bold text-[11px] px-2.5 py-1 shrink-0"
          : "gap-1 border-amber-600 bg-amber-600 text-white dark:border-amber-400 dark:bg-amber-400 dark:text-amber-950 font-bold text-[11px] px-2.5 py-1 shrink-0",
        className,
      )}
      title={title}
    >
      {isSynced ? (
        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden />
      ) : (
        <Clock3 className="h-3 w-3 shrink-0" aria-hidden />
      )}
      <span>{label}</span>
    </Badge>
  );
}
