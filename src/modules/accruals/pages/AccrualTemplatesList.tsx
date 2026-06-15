import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  useAccrualTemplates,
  useCreateAccrualTemplate,
  type AccrualTemplatePayload,
} from "@/hooks/useAccruals";
import { ACCRUAL_KIND_LABELS, type AccrualKind } from "@/types";
import { useCan } from "@/hooks/usePermissions";

const EMPTY: AccrualTemplatePayload = {
  name: "",
  kind: "RENT",
  amount: "",
  is_taxable: false,
  start_date: "",
  end_date: "",
  is_active: true,
};

export default function AccrualTemplatesList() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AccrualTemplatePayload>(EMPTY);

  const { can } = useCan();
  const { data, isLoading } = useAccrualTemplates();
  const createMutation = useCreateAccrualTemplate();

  const templates = data?.results ?? [];

  const handleSubmit = () => {
    if (!form.name.trim() || !form.amount || !form.start_date) return;
    createMutation.mutate(
      { ...form, end_date: form.end_date || null },
      {
        onSuccess: () => {
          setForm(EMPTY);
          setOpen(false);
        },
      },
    );
  };

  return (
    <div dir="rtl" className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">قوالب الاستحقاق المتكررة</h1>
          <p className="text-muted-foreground text-sm">
            الرواتب والإيجارات التي تُستحق آخر كل شهر تلقائياً
          </p>
        </div>
        {can("accrual_templates.create") && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-1 h-4 w-4" /> قالب جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة قالب استحقاق</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: إيجار المكتب"
                />
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select
                  value={form.kind}
                  onValueChange={(v) => setForm({ ...form, kind: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACCRUAL_KIND_LABELS) as AccrualKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {ACCRUAL_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ الشهري (شامل الضريبة إن وُجدت)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>تاريخ البداية</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ النهاية (اختياري)</Label>
                  <Input
                    type="date"
                    value={form.end_date ?? ""}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label>خاضع لضريبة القيمة المضافة</Label>
                  <p className="text-muted-foreground text-xs">
                    عند الترحيل يلزم إرفاق الفاتورة الضريبية
                  </p>
                </div>
                <Switch
                  checked={form.is_taxable}
                  onCheckedChange={(v) => setForm({ ...form, is_taxable: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">الضريبة</TableHead>
                <TableHead className="text-right">من</TableHead>
                <TableHead className="text-right">إلى</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    جارٍ التحميل...
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد قوالب بعد
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{ACCRUAL_KIND_LABELS[t.kind]}</TableCell>
                    <TableCell>{t.amount}</TableCell>
                    <TableCell>
                      {t.is_taxable ? (
                        <Badge variant="info">خاضع</Badge>
                      ) : (
                        <Badge variant="outline">غير خاضع</Badge>
                      )}
                    </TableCell>
                    <TableCell>{t.start_date}</TableCell>
                    <TableCell>{t.end_date ?? "—"}</TableCell>
                    <TableCell>
                      {t.is_active ? (
                        <Badge variant="success">فعّال</Badge>
                      ) : (
                        <Badge variant="secondary">موقوف</Badge>
                      )}
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
