import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PackageOpen,
  ShoppingCart,
  Filter,
  RefreshCw,
  X,
  Calendar,
  BadgeDollarSign,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader, Pagination, SearchBar, LoadingState, EmptyState } from "@/components/shared";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { useCRPaymentRequests, usePOPaymentRequests } from "@/hooks/usePaymentRequests";
import {
  customerReturnLinkLabel,
  customerReturnLinkTitle,
  formatSourceAccountLabel,
  purchaseOrderLinkLabel,
  supplierDisplayForPoPayment,
  useCustomerReturnsMapByIds,
  usePurchaseOrdersMapByIds,
} from "@/hooks/useLinkedEntitiesForPaymentRequests";
import type { CRPaymentRequest, CustomerReturnDetail, POPaymentRequest, PurchaseOrder } from "@/types";
import { formatCrPaymentCustomerLabel } from "@/lib/partyDisplay";

function statusBadgeVariant(
  status: string,
): "secondary" | "success" | "destructive" | "warning" {
  const s = (status || "").toUpperCase();
  if (s.includes("PENDING")) return "warning";
  if (s.includes("DONE") || s.includes("APPROV") || s.includes("PAID")) return "success";
  if (s.includes("REJECT") || s.includes("CANCEL")) return "destructive";
  return "secondary";
}

function statusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "قيد الانتظار";
  if (s === "DONE") return "تم التحويل";
  return status;
}

export default function PaymentRequestsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="طلبات الدفع"
        subtitle="مرتجعات العملاء وطلبات الشراء — كل قائمة منفصلة في نفس الصفحة"
        icon={<CreditCard className="w-7 h-7" />}
      />

      <CRSection />
      <Separator className="opacity-60" />
      <POSection />
    </div>
  );
}

function CRSection() {
  const navigate = useNavigate();
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({
    debounceMs: 300,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedTerm,
      status: statusFilter === "all" ? undefined : statusFilter,
      created_after: createdAfter ? `${createdAfter}T00:00:00` : undefined,
      created_before: createdBefore ? `${createdBefore}T23:59:59` : undefined,
    }),
    [page, pageSize, debouncedTerm, statusFilter, createdAfter, createdBefore],
  );

  const { data, isLoading, isError, refetch, isRefetching } = useCRPaymentRequests(queryParams);
  const rows = data?.results || [];
  const returnsMap = useCustomerReturnsMapByIds(rows.map((r) => r.customer_return));
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters =
    statusFilter !== "all" || Boolean(createdAfter) || Boolean(createdBefore);

  const handleResetFilters = () => {
    resetPage();
    clearSearch();
    setStatusFilter("all");
    setCreatedAfter("");
    setCreatedBefore("");
    setIsFiltersOpen(false);
  };

  return (
    <Card className="border shadow-sm overflow-hidden border-primary/15">
      <CardHeader className="bg-muted/30 border-b space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PackageOpen className="h-5 w-5 text-primary" />
          دفع المرتجعات
        </CardTitle>
        <CardDescription>طلبات التحويل المرتبطة بمرتجعات العملاء</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <SearchBar
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              resetPage();
            }}
            placeholder="بحث في طلبات دفع المرتجعات..."
            className="max-w-md"
          />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant={isFiltersOpen ? "secondary" : "outline"}
              className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${
                isFiltersOpen || hasActiveFilters
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : ""
              }`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              تصفية
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="mr-1 h-5 px-1.5 rounded-md bg-primary/20 text-primary border-none text-[10px]"
                >
                  1
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="rounded-xl shrink-0"
              aria-label="تحديث"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">تصفية — المرتجعات</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">الحالة</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full bg-background/50 rounded-xl">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                      <SelectItem value="DONE">تم التحويل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">من تاريخ</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={createdAfter}
                      onChange={(e) => {
                        setCreatedAfter(e.target.value);
                        setPage(1);
                      }}
                      className="pr-9 rounded-xl bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">إلى تاريخ</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={createdBefore}
                      onChange={(e) => {
                        setCreatedBefore(e.target.value);
                        setPage(1);
                      }}
                      className="pr-9 rounded-xl bg-background/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isLoading ? (
          <LoadingState message="جاري تحميل طلبات دفع المرتجعات..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-destructive space-y-3">
            <p className="font-medium">فشل تحميل بيانات المرتجعات</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl">
              إعادة المحاولة
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="لا توجد طلبات دفع"
            description={
              searchTerm || hasActiveFilters
                ? "لم يتم العثور على نتائج مطابقة في المرتجعات."
                : "لا توجد طلبات دفع مرتجعات حالياً."
            }
          />
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
              {rows.map((req) => (
                <CRCard key={req.id} req={req} returnsMap={returnsMap} />
              ))}
            </div>
            <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[70px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">العميل</TableHead>
                    <TableHead className="text-right whitespace-nowrap">المبلغ</TableHead>
                    <TableHead className="text-center whitespace-nowrap">حساب المصدر</TableHead>
                    <TableHead className="text-center whitespace-nowrap">المرتجع</TableHead>
                    <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="text-center whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="w-[110px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((req) => {
                    const retDetail = returnsMap.get(req.customer_return);
                    const returnLabel = customerReturnLinkLabel(
                      req.customer_return,
                      retDetail,
                    );
                    const returnTitle = customerReturnLinkTitle(
                      req.customer_return,
                      retDetail,
                    );
                    return (
                    <TableRow
                      key={req.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/payment-requests/cr/${req.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                        {req.id}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {formatCrPaymentCustomerLabel(req, retDetail)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-bold text-primary font-mono">
                          {parseFloat(req.amount || "0").toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground mr-1">ر.س</span>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatSourceAccountLabel(req.source_account)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap max-w-[200px]">
                        <Link
                          to={`/customer-returns/${req.customer_return}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline text-sm font-medium truncate inline-block max-w-full align-middle"
                          title={returnTitle}
                        >
                          {returnLabel}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={statusBadgeVariant(req.status)}
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        >
                          {statusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {req.created_at ? new Date(req.created_at).toLocaleString("ar-SA") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link to={`/payment-requests/cr/${req.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="rounded-lg gap-2 text-xs">
                            التفاصيل
                            <BadgeDollarSign className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
      </CardContent>
    </Card>
  );
}

function POSection() {
  const navigate = useNavigate();
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({
    debounceMs: 300,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      page,
      page_size: pageSize,
      search: debouncedTerm,
      status: statusFilter === "all" ? undefined : statusFilter,
      created_after: createdAfter ? `${createdAfter}T00:00:00` : undefined,
      created_before: createdBefore ? `${createdBefore}T23:59:59` : undefined,
    }),
    [page, pageSize, debouncedTerm, statusFilter, createdAfter, createdBefore],
  );

  const { data, isLoading, isError, refetch, isRefetching } = usePOPaymentRequests(queryParams);
  const rows = data?.results || [];
  const ordersMap = usePurchaseOrdersMapByIds(rows.map((r) => r.purchase_order));
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasActiveFilters =
    statusFilter !== "all" || Boolean(createdAfter) || Boolean(createdBefore);

  const handleResetFilters = () => {
    resetPage();
    clearSearch();
    setStatusFilter("all");
    setCreatedAfter("");
    setCreatedBefore("");
    setIsFiltersOpen(false);
  };

  return (
    <Card className="border shadow-sm overflow-hidden border-orange-500/20">
      <CardHeader className="bg-muted/30 border-b space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          دفع طلبات الشراء
        </CardTitle>
        <CardDescription>طلبات التحويل المرتبطة بطلبات الشراء والموردين</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <SearchBar
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              resetPage();
            }}
            placeholder="بحث في طلبات دفع الشراء..."
            className="max-w-md"
          />
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant={isFiltersOpen ? "secondary" : "outline"}
              className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${
                isFiltersOpen || hasActiveFilters
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : ""
              }`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              تصفية
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="mr-1 h-5 px-1.5 rounded-md bg-primary/20 text-primary border-none text-[10px]"
                >
                  1
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="rounded-xl shrink-0"
              aria-label="تحديث"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin text-primary" : ""}`}
              />
            </Button>
          </div>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">تصفية — طلبات الشراء</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">الحالة</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full bg-background/50 rounded-xl">
                      <SelectValue placeholder="الكل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                      <SelectItem value="DONE">تم التحويل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">من تاريخ</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={createdAfter}
                      onChange={(e) => {
                        setCreatedAfter(e.target.value);
                        setPage(1);
                      }}
                      className="pr-9 rounded-xl bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">إلى تاريخ</Label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="date"
                      value={createdBefore}
                      onChange={(e) => {
                        setCreatedBefore(e.target.value);
                        setPage(1);
                      }}
                      className="pr-9 rounded-xl bg-background/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg text-xs gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  إعادة تعيين
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {isLoading ? (
          <LoadingState message="جاري تحميل طلبات دفع الشراء..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[240px] text-destructive space-y-3">
            <p className="font-medium">فشل تحميل بيانات طلبات الشراء</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl">
              إعادة المحاولة
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="لا توجد طلبات دفع"
            description={
              searchTerm || hasActiveFilters
                ? "لم يتم العثور على نتائج مطابقة في طلبات الشراء."
                : "لا توجد طلبات دفع شراء حالياً."
            }
          />
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
              {rows.map((req) => (
                <POCard key={req.id} req={req} ordersMap={ordersMap} />
              ))}
            </div>
            <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[70px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">المورد</TableHead>
                    <TableHead className="text-right whitespace-nowrap">المبلغ</TableHead>
                    <TableHead className="text-center whitespace-nowrap">حساب المصدر</TableHead>
                    <TableHead className="text-center whitespace-nowrap">طلب الشراء</TableHead>
                    <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="text-center whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="w-[110px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((req) => {
                    const poDetail = ordersMap.get(req.purchase_order);
                    const supplierLabel = supplierDisplayForPoPayment(req, poDetail);
                    return (
                    <TableRow
                      key={req.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/payment-requests/po/${req.id}`)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground text-right">
                        {req.id}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">
                        {supplierLabel}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className="font-bold text-primary font-mono">
                          {parseFloat(req.amount || "0").toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground mr-1">ر.س</span>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatSourceAccountLabel(req.source_account)}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap max-w-[220px]">
                        <Link
                          to={`/purchase-orders/${req.purchase_order}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary hover:underline text-sm font-medium truncate inline-block max-w-full align-middle"
                          title={purchaseOrderLinkLabel(req.purchase_order)}
                        >
                          {purchaseOrderLinkLabel(req.purchase_order)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Badge
                          variant={statusBadgeVariant(req.status)}
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        >
                          {statusLabel(req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {req.created_at ? new Date(req.created_at).toLocaleString("ar-SA") : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link to={`/payment-requests/po/${req.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" className="rounded-lg gap-2 text-xs">
                            التفاصيل
                            <BadgeDollarSign className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
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
      </CardContent>
    </Card>
  );
}

function CRCard({
  req,
  returnsMap,
}: {
  req: CRPaymentRequest;
  returnsMap: Map<number, CustomerReturnDetail>;
}) {
  const retDetail = returnsMap.get(req.customer_return);
  const returnLabel = customerReturnLinkLabel(req.customer_return, retDetail);
  const returnTitle = customerReturnLinkTitle(req.customer_return, retDetail);
  const customerLabel = formatCrPaymentCustomerLabel(req, retDetail);
  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-bold text-lg flex items-center gap-2">
            <PackageOpen className="h-4 w-4 text-primary" /> طلب #{req.id}
          </span>
          <span className="text-xs text-muted-foreground mt-1">{customerLabel}</span>
        </div>
        <Badge variant={statusBadgeVariant(req.status)} className="text-[10px] shrink-0">
          {statusLabel(req.status)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/30 p-2 rounded-lg px-3">
          <span className="block text-xs text-muted-foreground mb-1">المبلغ</span>
          <span className="font-bold text-primary font-mono">
            {parseFloat(req.amount || "0").toLocaleString()}{" "}
            <span className="text-xs text-muted-foreground">ر.س</span>
          </span>
        </div>
        <div className="bg-muted/30 p-2 rounded-lg px-3">
          <span className="block text-xs text-muted-foreground mb-1">حساب المصدر</span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatSourceAccountLabel(req.source_account)}
          </span>
        </div>
        <div className="bg-muted/30 p-2 rounded-lg px-3 min-w-0 col-span-2">
          <span className="block text-xs text-muted-foreground mb-1">المرتجع</span>
          <Link
            to={`/customer-returns/${req.customer_return}`}
            className="text-primary hover:underline text-sm font-medium line-clamp-2"
            title={returnTitle}
          >
            {returnLabel}
          </Link>
        </div>
      </div>
      <Link to={`/payment-requests/cr/${req.id}`}>
        <Button
          variant="outline"
          className="w-full text-primary border-primary/20 hover:bg-primary/5 rounded-xl mt-1"
        >
          عرض التفاصيل
        </Button>
      </Link>
    </div>
  );
}

function POCard({
  req,
  ordersMap,
}: {
  req: POPaymentRequest;
  ordersMap: Map<number, PurchaseOrder>;
}) {
  const poDetail = ordersMap.get(req.purchase_order);
  const supplierLabel = supplierDisplayForPoPayment(req, poDetail);
  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-bold text-lg flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" /> طلب #{req.id}
          </span>
          <span className="text-xs text-muted-foreground mt-1">{supplierLabel}</span>
        </div>
        <Badge variant={statusBadgeVariant(req.status)} className="text-[10px] shrink-0">
          {statusLabel(req.status)}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/30 p-2 rounded-lg px-3">
          <span className="block text-xs text-muted-foreground mb-1">المبلغ</span>
          <span className="font-bold text-primary font-mono">
            {parseFloat(req.amount || "0").toLocaleString()}{" "}
            <span className="text-xs text-muted-foreground">ر.س</span>
          </span>
        </div>
        <div className="bg-muted/30 p-2 rounded-lg px-3">
          <span className="block text-xs text-muted-foreground mb-1">حساب المصدر</span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatSourceAccountLabel(req.source_account)}
          </span>
        </div>
        <div className="bg-muted/30 p-2 rounded-lg px-3 min-w-0 col-span-2">
          <span className="block text-xs text-muted-foreground mb-1">طلب الشراء</span>
          <Link
            to={`/purchase-orders/${req.purchase_order}`}
            className="text-primary hover:underline text-sm font-medium line-clamp-2"
            title={purchaseOrderLinkLabel(req.purchase_order)}
          >
            {purchaseOrderLinkLabel(req.purchase_order)}
          </Link>
        </div>
      </div>
      <Link to={`/payment-requests/po/${req.id}`}>
        <Button
          variant="outline"
          className="w-full text-primary border-primary/20 hover:bg-primary/5 rounded-xl mt-1"
        >
          عرض التفاصيل
        </Button>
      </Link>
    </div>
  );
}
