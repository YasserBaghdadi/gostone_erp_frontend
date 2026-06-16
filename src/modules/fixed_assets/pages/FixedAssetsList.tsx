import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ASSET_CATEGORIES: { value: string; label: string }[] = [
  { value: "FURNITURE", label: "أثاث ومعدات مكتبية" },
  { value: "MACHINERY", label: "آلات ومعدات" },
  { value: "VEHICLES", label: "سيارات ووسائل نقل" },
  { value: "IMPROVEMENTS", label: "تحسينات على مباني مستأجرة" },
  { value: "COMPUTERS", label: "أجهزة حاسب آلي" },
];
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useCreateFixedAsset, useFixedAssets } from "@/hooks/useFixedAssets";
import { useCan } from "@/hooks/usePermissions";

interface AssetForm {
  name: string;
  cost: string;
  salvage_value: string;
  acquisition_date: string;
  useful_life_years: string;
  category: string;
}

const EMPTY: AssetForm = {
  name: "",
  cost: "",
  salvage_value: "0",
  acquisition_date: "",
  useful_life_years: "",
  category: "MACHINERY",
};

export default function FixedAssetsList() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<AssetForm>(EMPTY);

  const { can } = useCan();
  const { data, isLoading } = useFixedAssets();
  const createMutation = useCreateFixedAsset();

  const assets = data?.results ?? [];

  const handleSubmit = () => {
    const years = Number(form.useful_life_years);
    if (!form.name.trim() || !form.cost || !form.acquisition_date || !years) return;
    createMutation.mutate(
      {
        name: form.name,
        cost: form.cost,
        salvage_value: form.salvage_value || "0",
        acquisition_date: form.acquisition_date,
        useful_life_months: Math.round(years * 12),
        category: form.category,
      },
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
          <h1 className="text-2xl font-bold">الأصول الثابتة</h1>
          <p className="text-muted-foreground text-sm">
            يُحسب الإهلاك بالقسط الثابت ويُستحق آخر كل شهر
          </p>
        </div>
        {can("fixed_assets.create") && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-1 h-4 w-4" /> أصل جديد
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-lg">
            <DialogHeader>
              <DialogTitle>إضافة أصل ثابت</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الأصل</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: سيارة توصيل"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>التكلفة</Label>
                  <Input
                    type="number"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>قيمة الخردة (اختياري)</Label>
                  <Input
                    type="number"
                    value={form.salvage_value}
                    onChange={(e) => setForm({ ...form, salvage_value: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>تاريخ الشراء</Label>
                  <Input
                    type="date"
                    value={form.acquisition_date}
                    onChange={(e) => setForm({ ...form, acquisition_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>العمر الافتراضي (سنوات)</Label>
                  <Input
                    type="number"
                    value={form.useful_life_years}
                    onChange={(e) => setForm({ ...form, useful_life_years: e.target.value })}
                    placeholder="مثال: 5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الفئة (تحدّد حساب مجمع الإهلاك)</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
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
                <TableHead className="text-right">الأصل</TableHead>
                <TableHead className="text-right">التكلفة</TableHead>
                <TableHead className="text-right">العمر (شهر)</TableHead>
                <TableHead className="text-right">القسط الشهري</TableHead>
                <TableHead className="text-right">مجمّع الإهلاك</TableHead>
                <TableHead className="text-right">المتبقي</TableHead>
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
              ) : assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد أصول بعد
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{a.cost}</TableCell>
                    <TableCell>{a.useful_life_months}</TableCell>
                    <TableCell>{a.monthly_depreciation}</TableCell>
                    <TableCell>{a.accumulated_depreciation}</TableCell>
                    <TableCell>{a.remaining_depreciable}</TableCell>
                    <TableCell>
                      {Number(a.remaining_depreciable) <= 0 ? (
                        <Badge variant="secondary">مُهلك بالكامل</Badge>
                      ) : (
                        <Badge variant="success">نشط</Badge>
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
