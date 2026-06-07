import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Filter, RefreshCw, X, ChevronDown, ChevronUp, Package, ShoppingCart, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { PURCHASE_ORDER_STATUS_LABELS, type PurchaseOrderStatus } from "@/types";
import { PageHeader, Pagination, LoadingState, EmptyState } from "@/components/shared";
import { LinkedSellOrderLink } from "@/modules/purchase_orders/components/LinkedSellOrderLink";
import { formatNameWithBalance } from "@/lib/partyDisplay";

function SupplierBadge({
  supplier,
  onClick,
}: {
  supplier: { id?: number; name: string; balance?: number | string };
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const content = (
    <span className="inline-flex max-w-full items-center rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted">
      <span className="truncate">
        {formatNameWithBalance(supplier.name, supplier.balance)}
      </span>
    </span>
  );

  if (supplier.id) {
    return (
      <Link
        to={`/suppliers/${supplier.id}`}
        className="max-w-full"
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className="max-w-full" onClick={onClick}>
      {content}
    </span>
  );
}

// --- Desktop Table Row ---
function PurchaseOrderRow({ order }: { order: any }) {
  const navigate = useNavigate();
  const statusInfo = PURCHASE_ORDER_STATUS_LABELS[order.status as PurchaseOrderStatus] || { label: order.status, color: 'secondary' };
  const totalCost = parseFloat(order.total_cost || "0");
  const createdDate = order.created_at || new Date().toISOString();
  const suppliers = getSuppliersForPurchaseOrder(order);

  return (
    <tr
      className="cursor-pointer border-b border-border/40 transition-all duration-200 hover:bg-muted/50"
      onClick={() => navigate(`/purchase-orders/${order.id}`)}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-foreground">#{order.id}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-foreground">{order.customer_name || "—"}</span>
      </td>
      <td className="px-4 py-3 align-top whitespace-normal">
        <div
          className="flex items-start gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <ShoppingCart className="mt-1 h-4 w-4 text-primary shrink-0" />
          <div className="flex max-w-[420px] flex-wrap items-start gap-1.5">
            {suppliers.length > 0 ? (
              suppliers.map((s) =>
                <SupplierBadge
                  key={s.id ?? s.name}
                  supplier={s}
                  onClick={(e) => e.stopPropagation()}
                />,
              )
            ) : (
              <span className="text-sm font-semibold">
                {order.supplier_name || "—"}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {order.sell_order ? (
            <LinkedSellOrderLink
              sellOrderId={order.sell_order}
              stopPropagation
            />
          ) : (
            <span className="text-muted-foreground text-xs">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant="outline" className="font-mono text-xs">{order.item_count || 0}</Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <span className="font-bold text-primary font-mono text-sm">
            {totalCost.toLocaleString()}
          </span>
          <span className="text-[10px] font-normal text-muted-foreground">ر.س</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Badge variant={statusInfo.color as any} className="text-[10px] px-2 py-0.5 rounded-full font-semibold">
          {statusInfo.label}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center">
        <Button
          variant="default"
          size="sm"
          className="rounded-lg gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/purchase-orders/${order.id}`);
          }}
        >
          التفاصيل
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function getSuppliersForPurchaseOrder(order: any): Array<{ id?: number; name: string; balance?: number | string }> {
  const supplierList = Array.isArray(order?.supplier_list) ? order.supplier_list : [];

  const result: Array<{ id?: number; name: string; balance?: number | string }> = [];
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();

  for (const supplier of supplierList) {
    const rawId = supplier?.id;
    const id =
      typeof rawId === "number"
        ? rawId
        : rawId !== undefined && rawId !== null && rawId !== ""
          ? Number(rawId)
          : undefined;

    const name =
      supplier?.display_name ||
      (id && !Number.isNaN(id) ? `مورد #${id}` : "") ||
      "";

    const trimmed = String(name).trim();
    if (!trimmed) continue;

    if (id && !Number.isNaN(id)) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      result.push({ id, name: trimmed, balance: supplier?.balance });
      continue;
    }

    if (seenNames.has(trimmed)) continue;
    seenNames.add(trimmed);
    result.push({ name: trimmed, balance: supplier?.balance });
  }

  if (result.length > 0) return result;

  // fallback: if supplier_list is missing in response
  const fallbackId =
    typeof order?.supplier === "number" ? order.supplier : undefined;
  const fallbackName =
    order?.supplier_name ||
    (fallbackId && !Number.isNaN(fallbackId) ? `مورد #${fallbackId}` : "") ||
    "";
  const trimmedFallback = String(fallbackName).trim();
  if (!trimmedFallback) return [];

  return [
    ...(fallbackId && !Number.isNaN(fallbackId)
      ? [{ id: fallbackId, name: trimmedFallback }]
      : [{ name: trimmedFallback }]),
  ];
}

// --- Mobile Card ---
function PurchaseOrderMobileCard({ order }: { order: any }) {
  const navigate = useNavigate();
  const statusInfo = PURCHASE_ORDER_STATUS_LABELS[order.status as PurchaseOrderStatus] || { label: order.status, color: 'secondary' };
  const totalCost = parseFloat(order.total_cost || "0");
  const createdDate = order.created_at || new Date().toISOString();
  const suppliers = getSuppliersForPurchaseOrder(order);

  return (
    <Card 
      onClick={() => navigate(`/purchase-orders/${order.id}`)}
      className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden"
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant={statusInfo.color as any} className="text-[10px]">{statusInfo.label}</Badge>
          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
            #{order.id}
          </span>
        </div>
        <CardTitle className="mt-2">
          <div className="flex items-start gap-2">
            <ShoppingCart className="mt-1 h-4 w-4 text-primary shrink-0" />
            {suppliers.length > 0 ? (
              <div className="flex min-w-0 flex-wrap items-start gap-1.5">
                {suppliers.map((s) => (
                  <SupplierBadge
                    key={s.id ?? s.name}
                    supplier={s}
                    onClick={(e) => e.stopPropagation()}
                  />
                ))}
              </div>
            ) : (
              <span className="truncate">{order.supplier_name || "—"}</span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-4">
        <div className="flex items-center justify-between text-sm gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">العميل</span>
          <span className="truncate text-foreground">{order.customer_name || "—"}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">التاريخ</span>
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">عدد البنود</span>
          <Badge variant="outline" className="font-mono text-xs">{order.item_count || 0}</Badge>
        </div>

        {order.sell_order ? (
          <div className="flex items-center justify-between text-sm gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">أمر بيع مرتبط</span>
            <LinkedSellOrderLink
              sellOrderId={order.sell_order}
              stopPropagation
            />
          </div>
        ) : null}
        
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm font-medium text-foreground">الإجمالي</span>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-primary font-mono text-lg">
              {totalCost.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">ر.س</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PurchaseOrdersList() {
  
  // Use custom hooks for pagination and search
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({ debounceMs: 300 });
  const [searchParams] = useSearchParams();

  // Additional filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const initialSearch = (searchParams.get("search") || "").trim();
    if (!initialSearch) return;
    // Populate search from URL when navigating from supplier order_count.
    setSearchTerm(initialSearch);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchTerm, setPage]);

  const { 
    data, 
    isLoading, 
    isError,
    refetch,
    isRefetching
  } = usePurchaseOrders({
    search: debouncedTerm,
    page,
    page_size: pageSize,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const purchaseOrders = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    clearSearch();
    setStatusFilter("all");
    resetPage();
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="طلبات الشراء"
        subtitle="إدارة طلبات الشراء من الموردين"
        icon={<ShoppingCart className="w-7 h-7" />}
        action={
          <Link to="/purchase-orders/new">
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
              <Plus className="ml-2 h-5 w-5" />
              طلب شراء جديد
            </Button>
          </Link>
        }
      />

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        {/* Basic Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم المورد..."
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
              }}
              className="pr-9 h-11 bg-background/50 border-transparent hover:border-border focus:border-primary transition-colors"
            />
          </div>
          
          <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="sm:hidden w-full">
             <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex justify-between">
                    <span>تصفية متقدمة</span>
                    {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
             </CollapsibleTrigger>
          </Collapsible>

          <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`h-11 w-11 shrink-0 hidden sm:flex ${isFiltersOpen ? "bg-muted" : ""}`}
              title="تصفية متقدمة"
          >
              <Filter className="h-4 w-4" />
          </Button>

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

        {/* Advanced Filters */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <CollapsibleContent className="space-y-4 pt-4 border-t mt-4 border-dashed">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {/* Status Filter */}
                     <div className="space-y-2">
                        <Label>الحالة</Label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-full h-10 bg-background/50">
                              <SelectValue placeholder="الكل" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="all">الكل</SelectItem>
                              {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                  {value.label}
                              </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {hasActiveFilters && (
                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-destructive gap-2">
                            <X className="h-3 w-3" />
                            مسح التصفية
                        </Button>
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
      </div>

      {isLoading ? (
        <LoadingState message="جاري تحميل طلبات الشراء..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
            <div className="p-4 rounded-full bg-destructive/10 text-destructive">
                <Package className="h-8 w-8" /> 
            </div>
            <h3 className="text-xl font-semibold">حدث خطأ</h3>
            <p className="text-muted-foreground">فشل تحميل قائمة طلبات الشراء. يرجى المحاولة مرة أخرى.</p>
            <Button onClick={() => refetch()} variant="outline">إعادة المحاولة</Button>
        </div>
      ) : purchaseOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="لا توجد طلبات شراء"
          description={hasActiveFilters ? "لم يتم العثور على طلبات شراء تطابق معايير التصفية." : "لم يتم إضافة طلبات شراء حالياً."}
          action={
            hasActiveFilters ? (
              <Button variant="link" onClick={clearFilters}>مسح عوامل التصفية</Button>
            ) : (
              <Link to="/purchase-orders/new">
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  طلب شراء جديد
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <>
            <div className="md:hidden space-y-4">
              {purchaseOrders.map((order) => (
                <PurchaseOrderMobileCard key={order.id} order={order} />
              ))}
            </div>

            <div className="hidden md:block bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/50 text-muted-foreground">
                      <th className="px-4 py-3 text-right font-medium">رقم الطلب</th>
                      <th className="px-4 py-3 text-right font-medium">العميل</th>
                      <th className="px-4 py-3 text-right font-medium">المورد</th>
                      <th className="px-4 py-3 text-center font-medium">أمر بيع</th>
                      <th className="px-4 py-3 text-center font-medium">البنود</th>
                      <th className="px-4 py-3 text-center font-medium">الإجمالي</th>
                      <th className="px-4 py-3 text-center font-medium">تاريخ الإنشاء</th>
                      <th className="px-4 py-3 text-center font-medium">الحالة</th>
                      <th className="px-4 py-3 text-center font-medium w-28">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((order) => (
                      <PurchaseOrderRow key={order.id} order={order} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              isLoading={isLoading}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              entityName="طلب"
            />
        </>
      )}
    </div>
  );
}
