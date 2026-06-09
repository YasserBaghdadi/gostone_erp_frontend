import { useMemo, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllAccounts } from "@/hooks/useAccounts";
import { useRecordExpense, useRecentExpenses } from "@/hooks/useExpenses";
import type { Account } from "@/types";

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const fmt = (v: string | number) =>
  Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ExpensesPage() {
  const { data: accounts = [], isLoading } = useAllAccounts();
  const record = useRecordExpense();
  const { data: recent = [] } = useRecentExpenses();

  const { mainOptions, subsByMain, paymentOptions } = useMemo(() => {
    const parentIds = new Set(
      accounts.map((a) => a.parent).filter((x): x is number => x != null),
    );
    const isLeaf = (a: Account) => !parentIds.has(a.id);
    const byNum = (a: Account, b: Account) => a.number.localeCompare(b.number);

    // Main expense accounts = level-1 children of «5» (excluding COGS «501»).
    const mainOptions = accounts
      .filter((a) => a.number.length === 3 && a.number.startsWith("5") && a.number !== "501")
      .sort(byNum);
    // Sub accounts = leaf children per main.
    const subsByMain: Record<number, Account[]> = {};
    for (const m of mainOptions) {
      subsByMain[m.id] = accounts
        .filter((a) => a.parent === m.id && isLeaf(a))
        .sort(byNum);
    }

    const paymentOptions = accounts
      .filter((a) => a.number.startsWith("101") && isLeaf(a))
      .sort(byNum);

    return { mainOptions, subsByMain, paymentOptions };
  }, [accounts]);

  const [mainAccount, setMainAccount] = useState("");
  const [expenseAccount, setExpenseAccount] = useState("");
  const subOptions = mainAccount ? subsByMain[Number(mainAccount)] ?? [] : [];
  const [paymentAccount, setPaymentAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [includesVat, setIncludesVat] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [date, setDate] = useState(todayStr());
  const [description, setDescription] = useState("");

  // default the payment account to the first cash/bank option once loaded
  if (!paymentAccount && paymentOptions.length > 0) {
    setPaymentAccount(String(paymentOptions[0].id));
  }

  const amountNum = parseFloat(amount);
  const canSubmit =
    !!expenseAccount &&
    !!paymentAccount &&
    amountNum > 0 &&
    (!includesVat || !!attachment) &&
    !record.isPending;

  const submit = () => {
    if (!canSubmit) return;
    record.mutate(
      {
        expense_account: Number(expenseAccount),
        payment_account: Number(paymentAccount),
        amount,
        includes_vat: includesVat,
        date,
        description: description.trim(),
        attachment: includesVat ? attachment : null,
      },
      {
        onSuccess: () => {
          setAmount("");
          setDescription("");
          setAttachment(null);
        },
      },
    );
  };

  // VAT preview
  const net = includesVat && amountNum > 0 ? amountNum / 1.15 : amountNum;
  const vat = includesVat && amountNum > 0 ? amountNum - net : 0;

  return (
    <div className="space-y-6 p-4" dir="rtl">
      <div className="flex items-center gap-2">
        <Receipt className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">تسجيل المصروفات</h1>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">
        سجّل مصروفاً مدفوعاً نقداً أو من البنك. يُسجَّل القيد المحاسبي تلقائياً ويظهر مباشرة
        في قائمة الدخل والتقارير.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">مصروف جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>المصروف الرئيسي</Label>
              <Select
                value={mainAccount}
                onValueChange={(v) => {
                  setMainAccount(v);
                  setExpenseAccount("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر البند الرئيسي" />
                </SelectTrigger>
                <SelectContent>
                  {mainOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المصروف الفرعي</Label>
              <Select
                value={expenseAccount}
                onValueChange={setExpenseAccount}
                disabled={!mainAccount}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={mainAccount ? "اختر البند الفرعي" : "اختر الرئيسي أولاً"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {subOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>مدفوع من</Label>
              <Select value={paymentAccount} onValueChange={setPaymentAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="النقدية / البنك" />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>المبلغ (ر.س)</Label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الوصف (اختياري)</Label>
            <Input
              placeholder="مثال: إيجار شهر يونيو"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="includes-vat"
              checked={includesVat}
              onCheckedChange={(c) => {
                const on = c === true;
                setIncludesVat(on);
                if (!on) setAttachment(null);
              }}
            />
            <Label htmlFor="includes-vat" className="cursor-pointer font-normal">
              المبلغ شامل ضريبة القيمة المضافة 15% (يُحتسب لاسترداد ضريبة المدخلات)
            </Label>
          </div>

          {includesVat && amountNum > 0 && (
            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              صافي المصروف: <b>{fmt(net)}</b> ر.س · الضريبة: <b>{fmt(vat)}</b> ر.س
            </div>
          )}

          {includesVat && (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <Label>
                الفاتورة الضريبية <span className="text-destructive">(مرفق إلزامي)</span>
              </Label>
              <Input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                PDF أو صورة، ويجب أن تحتوي على رمز QR متوافق مع ZATCA — تُراجَع تلقائياً
                وتبقى «بانتظار التأكد» حتى اعتمادها.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={submit} disabled={!canSubmit} className="gap-2">
              {record.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              تسجيل المصروف
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">آخر المصروفات المسجّلة</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد مصروفات مسجّلة بعد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">نوع المصروف</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                  <TableHead className="text-right">مدفوع من</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    <TableCell>{r.expense_account}</TableCell>
                    <TableCell className="text-muted-foreground">{r.description}</TableCell>
                    <TableCell>{r.paid_from}</TableCell>
                    <TableCell className="text-left font-medium">{fmt(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
