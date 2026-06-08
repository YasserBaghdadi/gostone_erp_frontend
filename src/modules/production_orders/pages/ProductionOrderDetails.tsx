import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  Factory,
  Package,
  Plus,
  X,
  CheckCircle2,
  Calendar,
  CalendarClock,
  Boxes,
  Printer,
  Box,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { WashbasinDrawing } from "@/components/common/WashbasinDrawing";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  useProductionOrderDetails,
  useAddProductionMaterial,
  useCloseProductionOrder,
  usePrintProductionOrder,
  useScheduleProductionOrder,
} from "@/hooks/useProductionOrders";
import { useItemDetails } from "@/hooks/useItems";
import { PRODUCTION_ORDER_STATUS_LABELS } from "@/types";
import type { Item } from "@/types";
import { parseBackendError, preventNegative, clampToPositive } from "@/lib/utils";

/** ISO datetime → قيمة <input type="datetime-local"> بالتوقيت المحلي (YYYY-MM-DDTHH:mm) */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** قيمة <input type="datetime-local"> (محلية) → ISO datetime، أو null إذا فارغة */
function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ProductionOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, refetch } = useProductionOrderDetails(id!);
  // Materials are restricted to the finished item's linked purchasable materials.
  const { data: finishedItem } = useItemDetails(order?.finished_item ?? 0);
  const allowedMaterialIds = finishedItem?.linked_purchasable_items ?? [];
  const addMaterialMutation = useAddProductionMaterial();
  const closeMutation = useCloseProductionOrder();
  const printMutation = usePrintProductionOrder();
  const scheduleMutation = useScheduleProductionOrder();

  // Add material form state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [materialUnit, setMaterialUnit] = useState("");

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // حقل الجدولة (موعد العميل) — يُعبّأ من بيانات الأمر.
  const [scheduledAtInput, setScheduledAtInput] = useState("");

  useEffect(() => {
    if (!order) return;
    setScheduledAtInput(isoToDatetimeLocal(order.scheduled_at));
  }, [order]);

  const handleSaveSchedule = () => {
    if (!order) return;
    scheduleMutation.mutate(
      {
        id: order.id,
        scheduled_at: datetimeLocalToIso(scheduledAtInput),
      },
      {
        onSuccess: () => {
          toast.success("تم حفظ موعد العميل");
          refetch();
        },
        onError: (error) => {
          toast.error("فشل حفظ موعد العميل", {
            description: parseBackendError(error),
          });
        },
      },
    );
  };

  const handleSelectItem = (items: Item[]) => {
    const item = items[0];
    if (!item) return;
    setSelectedItem(item);
    if (!materialUnit) setMaterialUnit(item.default_unit_name);
  };

  const removeSelectedItem = () => setSelectedItem(null);

  const handleAddMaterial = () => {
    if (!order || !selectedItem) return;
    if (!materialQuantity) {
      toast.error("الكمية مطلوبة");
      return;
    }
    if (!materialUnit) {
      toast.error("الوحدة مطلوبة");
      return;
    }
    addMaterialMutation.mutate(
      {
        id: order.id,
        data: {
          item: selectedItem.id,
          quantity: materialQuantity,
          unit_name: materialUnit,
        },
      },
      {
        onSuccess: () => {
          toast.success("تمت إضافة المادة بنجاح");
          setSelectedItem(null);
          setMaterialQuantity("");
          setMaterialUnit("");
        },
        onError: (error) => {
          toast.error("فشل إضافة المادة", {
            description: parseBackendError(error),
          });
        },
      },
    );
  };

  const confirmCloseOrder = () => {
    if (!order) return;
    closeMutation.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          toast.success("تم إتمام الإنتاج وترحيل المنتج للمخزون");
          setIsCloseModalOpen(false);
        },
        onError: (error) => {
          toast.error("فشل إتمام الإنتاج", {
            description: parseBackendError(error),
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">أمر التصنيع غير موجود</h2>
        <Button onClick={() => navigate("/production-orders")}>عودة للقائمة</Button>
      </div>
    );
  }

  const statusInfo =
    PRODUCTION_ORDER_STATUS_LABELS[order.status] ?? PRODUCTION_ORDER_STATUS_LABELS.open;
  const isActive = order.status === "open" || order.status === "in_progress";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-primary/10 text-primary ring-2 ring-primary/20">
            <Factory className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              أمر تصنيع #{order.id}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.color} className="text-xs">
                {statusInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">{order.finished_item_name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/production-orders">
            <Button variant="outline" className="rounded-xl gap-2 hover:bg-muted/50 transition-colors">
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-xl gap-2 hover:bg-muted/50 transition-colors"
            disabled={printMutation.isPending}
            onClick={() => {
              printMutation.mutate(
                { id: order.id },
                {
                  onSuccess: () => toast.success("تم فتح أمر التصنيع للطباعة"),
                  onError: () => toast.error("فشل تحميل أمر التصنيع"),
                },
              );
            }}
          >
            {printMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            طباعة أمر التصنيع
          </Button>
          {isActive && (
            <Button
              className="rounded-xl gap-2"
              onClick={() => setIsCloseModalOpen(true)}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              تم الإنتاج
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            بيانات أمر التصنيع
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground">الصنف المُصنّع</span>
            <p className="font-bold text-base">{order.finished_item_name}</p>
          </div>
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground">الكمية</span>
            <p className="font-bold text-base font-mono">
              {order.quantity} <span className="text-xs font-normal">{order.unit_name}</span>
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              تاريخ الإنشاء
            </span>
            <p className="font-bold text-base">
              {format(new Date(order.created_at), "yyyy/MM/dd", { locale: arSA })}
            </p>
          </div>
          {order.closed_at && (
            <div className="space-y-1.5 p-4 rounded-xl bg-success-light border border-success/20">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                تاريخ الإقفال
              </span>
              <p className="font-bold text-base">
                {format(new Date(order.closed_at), "yyyy/MM/dd", { locale: arSA })}
              </p>
            </div>
          )}
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              موعد العميل
            </span>
            <p className="font-bold text-base">
              {order.scheduled_at
                ? format(new Date(order.scheduled_at), "yyyy/MM/dd HH:mm", { locale: arSA })
                : "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* الجدولة (موعد العميل) */}
      <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            موعد العميل
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="scheduled_at">موعد العميل</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={scheduledAtInput}
                onChange={(e) => setScheduledAtInput(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              className="rounded-xl gap-2"
              onClick={handleSaveSchedule}
              disabled={scheduleMutation.isPending}
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Washbasin 3D drawing (only when a spec is present) */}
      {order.washbasin_spec && (
        <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              مخطط المغسلة (رسم ثلاثي الأبعاد)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6" dir="rtl">
            <WashbasinDrawing spec={order.washbasin_spec} />
          </CardContent>
        </Card>
      )}

      {/* Add Material Form (when open or in progress) */}
      {isActive && (
        <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
          <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              إضافة مادة خام
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-5 space-y-2">
                <label className="text-sm font-medium">المادة الخام</label>
                {selectedItem ? (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium text-sm truncate">{selectedItem.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive shrink-0"
                      onClick={removeSelectedItem}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-10"
                    onClick={() => setIsItemModalOpen(true)}
                  >
                    <Package className="ml-2 h-4 w-4" />
                    اختر المادة
                  </Button>
                )}
                {finishedItem && allowedMaterialIds.length === 0 && (
                  <p className="text-xs text-amber-600">
                    لا توجد مواد مرتبطة بهذا الصنف. اربط المواد القابلة للشراء من صفحة المنتج أولاً.
                  </p>
                )}
              </div>
              <div className="lg:col-span-3 space-y-2">
                <label className="text-sm font-medium">الكمية</label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={materialQuantity}
                  onKeyDown={preventNegative}
                  onChange={(e) => setMaterialQuantity(clampToPositive(e.target.value))}
                  className="h-10"
                />
              </div>
              <div className="lg:col-span-2 space-y-2">
                <label className="text-sm font-medium">الوحدة</label>
                <Input
                  placeholder="مثال: piece"
                  value={materialUnit}
                  onChange={(e) => setMaterialUnit(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="lg:col-span-2">
                <Button
                  type="button"
                  className="w-full h-10 gap-2"
                  onClick={handleAddMaterial}
                  disabled={addMaterialMutation.isPending || !selectedItem}
                >
                  {addMaterialMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  إضافة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Table */}
      <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            المواد الخام ({order.materials.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.materials.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Boxes className="h-10 w-10 mx-auto opacity-20 mb-3" />
              <p>لم تتم إضافة أي مواد خام بعد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-right w-[60px]">#</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الوحدة</TableHead>
                    <TableHead className="text-center">تاريخ الإضافة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {material.id}
                      </TableCell>
                      <TableCell className="font-medium">{material.item_name}</TableCell>
                      <TableCell className="text-center font-mono">{material.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{material.unit_name}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">
                        {format(new Date(material.created_at), "yyyy/MM/dd", { locale: arSA })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ProductSelectionModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSelect={handleSelectItem}
        filterPurchable={true}
        restrictToIds={allowedMaterialIds}
      />

      <ConfirmModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={confirmCloseOrder}
        title="تم الإنتاج"
        description="تأكيد إتمام الإنتاج وترحيل المنتج للمخزون؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="تم الإنتاج"
        cancelText="إلغاء"
        variant="success"
        isLoading={closeMutation.isPending}
      />
    </div>
  );
}
