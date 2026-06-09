import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

function startOfYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}
function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface ReportPeriodParams {
  date_from: string;
  date_to: string;
  opening_inventory?: string;
  closing_inventory?: string;
}

interface ReportPeriodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Show opening/closing inventory inputs (for the income statement). */
  showInventory?: boolean;
  /** Show a single "as of" date instead of a from/to range (balance sheet). */
  singleDate?: boolean;
  isPending?: boolean;
  onGenerate: (params: ReportPeriodParams) => void;
}

export function ReportPeriodDialog({
  open,
  onOpenChange,
  title,
  description,
  showInventory = false,
  singleDate = false,
  isPending = false,
  onGenerate,
}: ReportPeriodDialogProps) {
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [openingInv, setOpeningInv] = useState("");
  const [closingInv, setClosingInv] = useState("");

  const submit = () => {
    onGenerate({
      date_from: from,
      date_to: to,
      ...(showInventory
        ? { opening_inventory: openingInv || "0", closing_inventory: closingInv || "0" }
        : {}),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4">
          {singleDate ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">كما في تاريخ</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">من تاريخ</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          )}

          {showInventory && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">مخزون أول المدة</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={openingInv}
                  onChange={(e) => setOpeningInv(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">مخزون آخر المدة</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={closingInv}
                  onChange={(e) => setClosingInv(e.target.value)}
                />
              </div>
            </div>
          )}
          {showInventory && (
            <p className="text-xs text-muted-foreground">
              اترك المخزون فارغاً لحساب التكلفة على المشتريات فقط (أقل دقة).
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={submit} disabled={isPending}>
              {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تصدير
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
