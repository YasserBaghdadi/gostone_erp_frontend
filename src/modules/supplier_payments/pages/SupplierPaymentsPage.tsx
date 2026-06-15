import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

import {
  useCreateSupplierPayment,
  useSourceAccounts,
  useSupplierOptions,
  useSupplierPayments,
  type SupplierOption,
} from "@/hooks/useSupplierPayments";
import { useCan } from "@/hooks/usePermissions";

function supplierLabel(s: SupplierOption): string {
  return s.display_name || s.contact_name || s.first_name || `مورد #${s.id}`;
}

export default function SupplierPaymentsPage() {
  const [supplier, setSupplier] = useState("");
  const [sourceAccount, setSourceAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { can } = useCan();
  const { data: paymentsData, isLoading } = useSupplierPayments();
  const { data: suppliers = [] } = useSupplierOptions();
  const { data: sources = [] } = useSourceAccounts();
  const createMutation = useCreateSupplierPayment();

  const payments = paymentsData?.results ?? [];
  const canSubmit = supplier && sourceAccount && Number(amount) > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createMutation.mutate(
      {
        supplier: Number(supplier),
        amount,
        source_account: Number(sourceAccount),
        notes,
        file,
      },
      {
        onSuccess: () => {
          setSupplier("");
          setSourceAccount("");
          setAmount("");
          setNotes("");
          setFile(null);
        },
      },
    );
  };

  return (
    <div dir="rtl" className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">دفعة عامة للمورد</h1>
        <p className="text-muted-foreground text-sm">
          دفعة من صندوق/بنك إلى مورد، غير مرتبطة بطلب شراء معيّن — تُخصم من رصيد المورد مباشرة.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تسجيل دفعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>المورد</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {supplierLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحساب (مصدر الدفع)</Label>
              <Select value={sourceAccount} onValueChange={setSourceAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر صندوق/بنك" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>إيصال (اختياري)</Label>
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="بيان الدفعة"
              />
            </div>
          </div>
          {can("supplier_payments.create") && (
          <Button onClick={handleSubmit} disabled={!canSubmit || createMutation.isPending}>
            {createMutation.isPending ? "جارٍ الترحيل..." : "تسجيل وترحيل الدفعة"}
          </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الدفعات العامة السابقة</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">#</TableHead>
                <TableHead className="text-right">المورد</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">جارٍ التحميل...</TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    لا توجد دفعات بعد
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell className="font-medium">{p.supplier_name ?? "—"}</TableCell>
                    <TableCell>{p.amount}</TableCell>
                    <TableCell>{p.notes || "—"}</TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>
                      <Badge variant="success">مُرحّلة</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
