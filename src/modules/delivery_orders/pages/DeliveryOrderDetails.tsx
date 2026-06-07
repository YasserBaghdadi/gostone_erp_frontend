import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Loader2,
  Truck,
  Package,
  CheckCircle2,
  Calendar,
  Boxes,
  User as UserIcon,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  useDeliveryOrderDetails,
  useDeliverDeliveryOrder,
} from "@/hooks/useDeliveryOrders";
import { DELIVERY_ORDER_STATUS_LABELS } from "@/types";
import { parseBackendError } from "@/lib/utils";

export default function DeliveryOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, isError, refetch } = useDeliveryOrderDetails(id!);
  const deliverMutation = useDeliverDeliveryOrder();

  const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);

  const confirmDeliver = () => {
    if (!order) return;
    deliverMutation.mutate(
      { id: order.id },
      {
        onSuccess: () => {
          toast.success("تم تسليم الأمر وإخراج المواد من المخزون");
          setIsDeliverModalOpen(false);
          refetch();
        },
        onError: (error) => {
          toast.error("فشل تسليم الأمر", {
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
        <h2 className="text-2xl font-bold mb-4">أمر التسليم غير موجود</h2>
        <Button onClick={() => navigate("/delivery-orders")}>عودة للقائمة</Button>
      </div>
    );
  }

  const statusInfo =
    DELIVERY_ORDER_STATUS_LABELS[order.status] ?? DELIVERY_ORDER_STATUS_LABELS.pending;
  const isPending = order.status === "pending";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-primary/10 text-primary ring-2 ring-primary/20">
            <Truck className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              أمر تسليم #{order.id}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.color} className="text-xs">
                {statusInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground font-mono">
                أمر بيع #{order.sell_order}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/delivery-orders">
            <Button variant="outline" className="rounded-xl gap-2 hover:bg-muted/50 transition-colors">
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
          </Link>
          {isPending && (
            <Button
              className="rounded-xl gap-2"
              onClick={() => setIsDeliverModalOpen(true)}
              disabled={deliverMutation.isPending}
            >
              {deliverMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              تسليم
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            بيانات أمر التسليم
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground">أمر البيع</span>
            <p className="font-bold text-base font-mono">#{order.sell_order}</p>
          </div>
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              العميل
            </span>
            <p className="font-bold text-base font-mono">
              {order.customer != null ? `#${order.customer}` : "—"}
            </p>
          </div>
          <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
            <span className="text-sm text-muted-foreground">الحالة</span>
            <div>
              <Badge variant={statusInfo.color} className="text-xs">
                {statusInfo.label}
              </Badge>
            </div>
          </div>
          {order.created_at && (
            <div className="space-y-1.5 p-4 rounded-xl bg-muted/20 border border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                تاريخ الإنشاء
              </span>
              <p className="font-bold text-base">
                {format(new Date(order.created_at), "yyyy/MM/dd", { locale: arSA })}
              </p>
            </div>
          )}
          {order.delivered_at && (
            <div className="space-y-1.5 p-4 rounded-xl bg-success-light border border-success/20">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                تاريخ التسليم
              </span>
              <p className="font-bold text-base">
                {format(new Date(order.delivered_at), "yyyy/MM/dd", { locale: arSA })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Boxes className="w-5 h-5 text-primary" />
            المواد ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {order.items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Boxes className="h-10 w-10 mx-auto opacity-20 mb-3" />
              <p>لا توجد مواد في هذا الأمر.</p>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.id}
                      </TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        {item.unit_name ? (
                          <Badge variant="outline">{item.unit_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={isDeliverModalOpen}
        onClose={() => setIsDeliverModalOpen(false)}
        onConfirm={confirmDeliver}
        title="تسليم الأمر"
        description="سيتم إخراج المواد من المخزون ولا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟"
        confirmText="تسليم"
        cancelText="إلغاء"
        variant="success"
        isLoading={deliverMutation.isPending}
      />
    </div>
  );
}
