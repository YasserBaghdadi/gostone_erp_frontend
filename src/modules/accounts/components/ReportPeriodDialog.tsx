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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const QUARTERS = [
  { value: "1", label: "الربع الأول (يناير – مارس)" },
  { value: "2", label: "الربع الثاني (أبريل – يونيو)" },
  { value: "3", label: "الربع الثالث (يوليو – سبتمبر)" },
  { value: "4", label: "الربع الرابع (أكتوبر – ديسمبر)" },
];

/** Returns the Gregorian date range (YYYY-MM-DD) for a quarter of a year. */
function quarterRange(year: number, quarter: number): { from: string; to: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startMonth = (quarter - 1) * 3; // 0,3,6,9
  const endMonth = startMonth + 3; // 3,6,9,12
  const lastDay = new Date(year, endMonth, 0).getDate();
  return {
    from: `${year}-${pad(startMonth + 1)}-01`,
    to: `${year}-${pad(endMonth)}-${pad(lastDay)}`,
  };
}

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
  /** Pick a fiscal quarter + year instead of a from/to range (VAT summary). */
  quarterMode?: boolean;
  /** Submit button label (default «تصدير»). */
  submitLabel?: string;
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
  quarterMode = false,
  submitLabel = "تصدير",
  isPending = false,
  onGenerate,
}: ReportPeriodDialogProps) {
  const now = new Date();
  const [from, setFrom] = useState(startOfYear());
  const [to, setTo] = useState(today());
  const [openingInv, setOpeningInv] = useState("");
  const [closingInv, setClosingInv] = useState("");
  const [year, setYear] = useState(String(now.getFullYear()));
  const [quarter, setQuarter] = useState(String(Math.floor(now.getMonth() / 3) + 1));

  const submit = () => {
    let dateFrom = from;
    let dateTo = to;
    if (quarterMode) {
      const r = quarterRange(Number(year), Number(quarter));
      dateFrom = r.from;
      dateTo = r.to;
    }
    onGenerate({
      date_from: dateFrom,
      date_to: dateTo,
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
          {quarterMode ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">الربع</label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">السنة</label>
                <Input
                  type="number"
                  min="2020"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>
            </div>
          ) : singleDate ? (
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
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
