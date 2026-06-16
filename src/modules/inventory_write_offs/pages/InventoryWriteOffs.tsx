import { useEffect, useState } from "react";
import { Trash2, Package, Loader2, X, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { PageHeader } from "@/components/shared";
import { useStorageAreas } from "@/hooks/useStorageAreas";
import {
  useInventoryWriteOffs,
  useCreateInventoryWriteOff,
} from "@/hooks/useInventoryWriteOffs";
import { parseBackendError, preventNegative, clampToPositive } from "@/lib/utils";
import type { Item } from "@/types";
import { useCan } from "@/hooks/usePermissions";

const REASONS = [
  { value: "DAMAGE", label: "هالك/تالف" },
  { value: "LOSS", label: "فقد" },
  { value: "EXPIRY", label: "انتهاء صلاحية" },
  { value: "OTHER", label: "أخرى" },
];

export default function InventoryWriteOffs() {
  const { can } = useCan();
  const { data: warehousesData } = useStorageAreas({ page_size: 200 });
  const warehouses = warehousesData?.results ?? [];
  const { data: writeOffsData, isLoading } = useInventoryWriteOffs();
  const writeOffs = writeOffsData?.results ?? [];
  const createMutation = useCreateInventoryWriteOff();

  const [isItemOpen, setIsItemOpen] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [storageId, setStorageId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("DAMAGE");
  const [note, setNote] = useState<string>("");

  // Default warehouse to the main one.
  useEffect(() => {
    if (!storageId && warehouses.length) {
      const def = warehouses.find((w) => w.is_default) ?? warehouses[0];
      if (def) setStorageId(String(def.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses.length]);

  const submit = () => {
    if (!item) return toast.error("اختر الصنف");
    if (!storageId) return toast.error("اختر المخزن");
    const qty = parseFloat(quantity);
    if (!Number.isFinite(qty) || qty <= 0) return toast.error("الكمية يجب أن تكون أكبر من صفر");

    createMutation.mutate(
      {
        item: item.id,
        storage_area: Number(storageId),
        quantity: String(quantity),
        reason,
        note,
      },
      {
        onSuccess: () => {
          toast.success("تم تسجيل الإهلاك وخصم الكمية من المخزون");
          setItem(null);
          setQuantity("");
          setNote("");
        },
        onError: (e) => toast.error("فشل تسجيل الإهلاك", { description: parseBackendError(e) }),
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="إهلاك المخزون"
        subtitle="إخراج صنف تالف/مفقود من المخزون وخصم كميته"
        icon={<Trash2 className="w-7 h-7" />}
      />

      {can("inventory_write_offs.create") && (
      <Card className="border-border/50 shadow-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-primary" />
            إهلاك جديد
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label>الصنف</Label>
            {item ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">{item.name}</span>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setItem(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button type="button" variant="outline" className="w-full justify-start h-11" onClick={() => setIsItemOpen(true)}>
                <Package className="ml-2 h-4 w-4" />
                اختر الصنف
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المخزن</Label>
              <Select value={storageId} onValueChange={setStorageId}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>السبب</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>الكمية</Label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={quantity}
              onKeyDown={preventNegative}
              onChange={(e) => setQuantity(clampToPositive(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>ملاحظة (اختياري)</Label>
            <Input placeholder="تفاصيل الإهلاك…" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <Button className="w-full h-11 gap-2" onClick={submit} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            تسجيل الإهلاك
          </Button>
        </CardContent>
      </Card>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>سجل الإهلاك</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : writeOffs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">لا يوجد إهلاك مسجّل بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="px-3 py-2 text-right font-medium">الصنف</th>
                    <th className="px-3 py-2 text-center font-medium">المخزن</th>
                    <th className="px-3 py-2 text-center font-medium">الكمية</th>
                    <th className="px-3 py-2 text-center font-medium">السبب</th>
                    <th className="px-3 py-2 text-center font-medium">بواسطة</th>
                  </tr>
                </thead>
                <tbody>
                  {writeOffs.map((w) => (
                    <tr key={w.id} className="border-b border-border/40">
                      <td className="px-3 py-2">{w.item_name}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{w.storage_area_name}</td>
                      <td className="px-3 py-2 text-center font-mono">{w.quantity} {w.unit_name}</td>
                      <td className="px-3 py-2 text-center">{w.reason_display}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground">{w.created_by_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductSelectionModal
        isOpen={isItemOpen}
        onClose={() => setIsItemOpen(false)}
        onSelect={(items) => { if (items[0]) setItem(items[0]); }}
      />
    </div>
  );
}
