import { useNavigate } from "react-router-dom";
import { Truck, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useDeliveryOrders } from "@/hooks/useDeliveryOrders";
import { usePagination } from "@/hooks/usePagination";
import { DELIVERY_ORDER_STATUS_LABELS } from "@/types";
import type { DeliveryOrder } from "@/types";
import { PageHeader, Pagination, LoadingState, EmptyState } from "@/components/shared";

function StatusBadge({ status }: { status: DeliveryOrder["status"] }) {
  const info = DELIVERY_ORDER_STATUS_LABELS[status] ?? DELIVERY_ORDER_STATUS_LABELS.pending;
  return (
    <Badge variant={info.color} className="text-[10px] px-2 py-0.5 rounded-full font-semibold">
      {info.label}
    </Badge>
  );
}

function DeliveryOrderRow({ order }: { order: DeliveryOrder }) {
  const navigate = useNavigate();
  const createdDate = order.created_at || new Date().toISOString();

  return (
    <tr
      className="cursor-pointer border-b border-border/40 transition-all duration-200 hover:bg-muted/50"
      onClick={() => navigate(`/delivery-orders/${order.id}`)}
    >
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{order.id}</td>
      <td className="px-4 py-3">
        <span className="text-sm">{order.customer_name || "—"}</span>
      </td>
      <td className="px-4 py-3">
        <span className="font-semibold text-sm font-mono">#{order.sell_order}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-muted-foreground">
          {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-muted-foreground">
          {order.scheduled_at ? format(new Date(order.scheduled_at), "yyyy/MM/dd", { locale: arSA }) : "—"}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <StatusBadge status={order.status} />
      </td>
      <td className="px-4 py-3 text-center">
        <Button
          variant="default"
          size="sm"
          className="rounded-lg gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/delivery-orders/${order.id}`);
          }}
        >
          التفاصيل
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function DeliveryOrderMobileCard({ order }: { order: DeliveryOrder }) {
  const navigate = useNavigate();
  const createdDate = order.created_at || new Date().toISOString();

  return (
    <Card
      className="cursor-pointer transition-all duration-300 bg-card/50 hover:shadow-md"
      onClick={() => navigate(`/delivery-orders/${order.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="font-bold text-sm truncate">{order.customer_name || "—"}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">أمر بيع #{order.sell_order}</p>
            <p className="text-xs text-muted-foreground font-mono">#{order.id}</p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={order.status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span>{format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}</span>
          <span>موعد العميل: {order.scheduled_at ? format(new Date(order.scheduled_at), "yyyy/MM/dd", { locale: arSA }) : "—"}</span>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-border/40">
          <Button
            variant="default"
            size="sm"
            className="rounded-lg gap-1.5 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/delivery-orders/${order.id}`);
            }}
          >
            التفاصيل
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeliveryOrdersList() {
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const { data, isLoading, isError, refetch, isRefetching } = useDeliveryOrders({
    page,
    page_size: pageSize,
  });

  const orders = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="أوامر التسليم"
        subtitle="متابعة وتسليم أوامر التسليم للعملاء"
        icon={<Truck className="w-7 h-7" />}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-11 w-11 rounded-full hover:bg-muted shrink-0"
              title="تحديث"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="جاري تحميل أوامر التسليم..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold">حدث خطأ</h3>
          <p className="text-muted-foreground">فشل تحميل قائمة أوامر التسليم. يرجى المحاولة مرة أخرى.</p>
          <Button onClick={() => refetch()} variant="outline">إعادة المحاولة</Button>
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="لا يوجد أوامر تسليم"
          description="لم يتم إنشاء أوامر تسليم حالياً."
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">العميل</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">أمر البيع</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">التاريخ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">موعد العميل</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-[120px]">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <DeliveryOrderRow key={order.id} order={order} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {orders.map((order) => (
              <DeliveryOrderMobileCard key={order.id} order={order} />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            entityName="أمر تسليم"
          />
        </>
      )}
    </div>
  );
}
