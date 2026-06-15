import { useState } from "react";
import { Link } from "react-router-dom";
import { PackageOpen, Plus, Filter, RefreshCw, X, User, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useCustomerReturns } from "@/hooks/useCustomerReturns";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { CUSTOMER_RETURN_STATUS_LABELS, type CustomerReturnStatus, type CustomerReturn } from "@/types";
import { PageHeader, Pagination, SearchBar, LoadingState, EmptyState } from "@/components/shared";
import { formatCustomerReturnPartyLabel } from "@/lib/partyDisplay";
import { useCan } from "@/hooks/usePermissions";

export default function CustomerReturnsList() {
  const { can } = useCan();
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({ debounceMs: 300 });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useCustomerReturns({
    page,
    page_size: pageSize,
    search: debouncedTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const returns = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleResetFilters = () => {
    resetPage();
    clearSearch();
    setStatusFilter("all");
    setIsFiltersOpen(false);
  };

  const hasActiveFilters = statusFilter !== "all";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="المرتجعات"
        subtitle="إدارة ومتابعة طلبات المرتجعات للعملاء"
        icon={<PackageOpen className="w-7 h-7" />}
        action={
          can("customer_returns.create") && (
            <Link to="/customer-returns/new">
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                <Plus className="ml-2 h-5 w-5" />
                إنشاء مرتجع
              </Button>
            </Link>
          )
        }
      />

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="بحث برقم المرتجع أو اسم العميل..."
            className="max-w-md"
          />

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant={isFiltersOpen ? "secondary" : "outline"}
              className={`flex-1 md:flex-none gap-2 rounded-xl transition-all ${
                isFiltersOpen || hasActiveFilters ? "bg-primary/5 border-primary/20 text-primary" : ""
              }`}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <Filter className="h-4 w-4" />
              تصفية
              {hasActiveFilters && (
                <Badge variant="secondary" className="mr-1 h-5 px-1.5 rounded-md bg-primary/20 text-primary border-none text-[10px]">
                  1
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="rounded-xl border-muted-foreground/20 hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
              aria-label="تحديث البيانات"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin text-primary" : ""}`} />
            </Button>
          </div>
        </div>

        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleContent className="animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">خيارات التصفية</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">حالة المرتجع</Label>
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
                      {Object.entries(CUSTOMER_RETURN_STATUS_LABELS).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
          <LoadingState message="جاري تحميل المرتجعات..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-destructive space-y-3">
            <p className="font-medium">فشل تحميل البيانات</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="rounded-xl">
              إعادة المحاولة
            </Button>
          </div>
        ) : returns.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="لا توجد مرتجعات"
            description={
              searchTerm || hasActiveFilters
                ? "لم يتم العثور على مرتجعات تطابق معايير البحث."
                : "لم يتم إضافة مرتجعات حالياً."
            }
            action={
              !(searchTerm || hasActiveFilters) && can("customer_returns.create") && (
                <Link to="/customer-returns/new">
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إنشاء مرتجع جديد
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
              {returns.map((returnEntity) => (
                <ReturnMobileCard key={returnEntity.id} returnEntity={returnEntity} />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[60px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">العميل</TableHead>
                    <TableHead className="text-center whitespace-nowrap">أمر البيع</TableHead>
                    <TableHead className="text-center whitespace-nowrap">البنود</TableHead>
                    <TableHead className="text-center whitespace-nowrap">الإجمالي</TableHead>
                    <TableHead className="text-center whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((returnEntity) => (
                    <ReturnTableRow key={returnEntity.id} returnEntity={returnEntity} />
                  ))}
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
              entityName="مرتجع"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ReturnTableRow({ returnEntity }: { returnEntity: CustomerReturn }) {
  const statusInfo = CUSTOMER_RETURN_STATUS_LABELS[returnEntity.status as CustomerReturnStatus] || { label: returnEntity.status, color: "secondary" };
  const totalAmount = parseFloat(returnEntity.total_amount || "0");
  const returnDate = returnEntity.return_date || new Date().toISOString();

  return (
    <TableRow className="group hover:bg-muted/30 transition-colors">
      <TableCell className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
        {returnEntity.id}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary/60 shrink-0" />
          <span className="font-medium">{formatCustomerReturnPartyLabel(returnEntity)}</span>
        </div>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        {returnEntity.sell_order ? (
          <Link
            to={`/sell-orders/${returnEntity.sell_order}`}
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge variant="outline" className="font-mono text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              #{returnEntity.sell_order}
            </Badge>
          </Link>
        ) : (
          <span className="text-muted-foreground text-xs">-</span>
        )}
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <Badge variant="outline" className="font-mono text-xs">{returnEntity.item_count || 0}</Badge>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <span className="font-bold text-primary font-mono text-sm">
          {totalAmount.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground mr-1">ر.س</span>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <span className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {format(new Date(returnDate), "yyyy/MM/dd", { locale: arSA })}
        </span>
      </TableCell>
      <TableCell className="text-center whitespace-nowrap">
        <Badge variant={statusInfo.color as any} className="text-[10px] px-2 py-0.5 rounded-full font-semibold">
          {statusInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Link to={`/customer-returns/${returnEntity.id}`}>
          <Button variant="default" size="sm" className="rounded-lg gap-1.5 text-xs">
            التفاصيل
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}

function ReturnMobileCard({ returnEntity }: { returnEntity: CustomerReturn }) {
  const statusInfo = CUSTOMER_RETURN_STATUS_LABELS[returnEntity.status as CustomerReturnStatus] || { label: returnEntity.status, color: "secondary" };
  const totalAmount = parseFloat(returnEntity.total_amount || "0");
  const returnDate = returnEntity.return_date || new Date().toISOString();

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="font-bold text-lg flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {formatCustomerReturnPartyLabel(returnEntity)}
          </span>
          <span className="text-xs font-mono text-muted-foreground mt-1">#{returnEntity.id}</span>
        </div>
        <Badge variant={statusInfo.color as any} className="text-[10px] shrink-0">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-muted/30 p-2 rounded-lg py-2 px-3">
          <span className="block text-xs text-muted-foreground mb-1">التاريخ</span>
          <span className="font-medium text-sm flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {format(new Date(returnDate), "yyyy/MM/dd", { locale: arSA })}
          </span>
        </div>
        <div className="bg-muted/30 p-2 rounded-lg py-2 px-3">
          <span className="block text-xs text-muted-foreground mb-1">عدد البنود</span>
          <span className="font-medium">{returnEntity.item_count || 0}</span>
        </div>
      </div>

      {returnEntity.sell_order && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">أمر بيع مرتبط</span>
          <Link to={`/sell-orders/${returnEntity.sell_order}`} onClick={(e) => e.stopPropagation()}>
            <Badge variant="secondary" className="font-mono text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
              #{returnEntity.sell_order}
            </Badge>
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-sm font-medium text-muted-foreground">الإجمالي</span>
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-primary font-mono text-lg">{totalAmount.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">ر.س</span>
        </div>
      </div>

      <Link to={`/customer-returns/${returnEntity.id}`}>
        <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/5 rounded-xl mt-1">
          عرض التفاصيل
        </Button>
      </Link>
    </div>
  );
}
