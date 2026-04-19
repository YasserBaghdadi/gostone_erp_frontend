import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, RefreshCw, X, Target, AlertCircle, Phone, MapPin, Banknote, CheckCircle2, ArrowRight, Calendar, Percent } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";
import { useOpportunities } from "@/hooks/useOpportunities";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { INTEREST_LEVELS, STATUS_LABELS } from "@/types";
import type { Opportunity } from "@/types";
import { cn } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { PageHeader, Pagination, LoadingState, EmptyState } from "@/components/shared";

// --- Desktop Table Row ---
function OpportunityRow({ opportunity }: { opportunity: Opportunity }) {
  const navigate = useNavigate();
  const isSold = !!opportunity.have_sell_order;
  const statusKey = opportunity.status || "new";
  const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS["new"];

  const customerName = opportunity.customer
    ? formatCustomerWithBalance(opportunity.customer)
    : opportunity.clientName || "عميل غير معروف";
  const customerPhone = opportunity.customer?.phone_number || opportunity.clientPhone || "";
  const totalPrice = parseFloat(opportunity.total_price_after_tax || opportunity.totalPrice?.toString() || "0");
  const createdDate = opportunity.created_at || new Date().toISOString();
  const discount = opportunity.dis_percentage || (opportunity as any).discount_percentage || (opportunity as any).discount;
  const hasDiscount = parseFloat(String(discount || "0")) > 0;

  return (
    <tr
      className={cn(
        "cursor-pointer border-b border-border/40 transition-all duration-200",
        isSold
          ? "opacity-50 grayscale-[30%] bg-muted/20 hover:opacity-70 hover:bg-muted/30"
          : "hover:bg-muted/50"
      )}
      onClick={() => navigate(`/opportunities/${opportunity.id}`)}
    >
      {/* Customer */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-sm">{customerName}</span>
          {customerPhone && (
            <span className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
              <Phone className="h-3 w-3" />
              {customerPhone}
            </span>
          )}
        </div>
      </td>

      {/* Location */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/60" />
          {opportunity.location || "غير محدد"}
        </span>
      </td>

      {/* Salesman */}
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {opportunity.salesman
            ? `${opportunity.salesman.first_name} ${opportunity.salesman.last_name}`
            : "—"}
        </span>
      </td>

      {/* Price */}
      <td className="px-4 py-3 text-center">
        {totalPrice > 0 ? (
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-bold text-primary font-mono text-sm">
              {totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span>
            </span>
            {hasDiscount && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-green-300 bg-green-50 text-green-700 gap-0.5">
                <Percent className="h-2.5 w-2.5" />
                {discount}%
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Date */}
      <td className="px-4 py-3 text-center">
        <span className="text-xs text-muted-foreground">
          {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        {isSold ? (
          <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            تم البيع
          </Badge>
        ) : (
          <Badge
            variant={statusInfo.color as any}
            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          >
            {statusInfo.label}
          </Badge>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-center">
        <Button
          variant={isSold ? "outline" : "default"}
          size="sm"
          className="rounded-lg gap-1.5 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/opportunities/${opportunity.id}`);
          }}
        >
          التفاصيل
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

// --- Mobile Card ---
function OpportunityMobileCard({ opportunity }: { opportunity: Opportunity }) {
  const navigate = useNavigate();
  const isSold = !!opportunity.have_sell_order;
  const statusKey = opportunity.status || "new";
  const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS["new"];

  const customerName = opportunity.customer
    ? formatCustomerWithBalance(opportunity.customer)
    : opportunity.clientName || "عميل غير معروف";
  const customerPhone = opportunity.customer?.phone_number || opportunity.clientPhone || "";
  const totalPrice = parseFloat(opportunity.total_price_after_tax || opportunity.totalPrice?.toString() || "0");
  const createdDate = opportunity.created_at || new Date().toISOString();

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300",
        isSold
          ? "opacity-50 grayscale-[30%] bg-muted/30 hover:opacity-70"
          : "bg-card/50 hover:shadow-md"
      )}
      onClick={() => navigate(`/opportunities/${opportunity.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Top: Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="font-bold text-sm truncate">{customerName}</p>
            {customerPhone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1" dir="ltr">
                <Phone className="h-3 w-3 shrink-0" />
                {customerPhone}
              </p>
            )}
          </div>
          <div className="shrink-0">
            {isSold ? (
              <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                تم البيع
              </Badge>
            ) : (
              <Badge
                variant={statusInfo.color as any}
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              >
                {statusInfo.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary/60" />
            {opportunity.location || "غير محدد"}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary/60" />
            {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
          </span>
        </div>

        {/* Bottom: Price + Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          {totalPrice > 0 ? (
            <span className="font-bold text-primary font-mono text-sm flex items-center gap-1">
              <Banknote className="h-4 w-4" />
              {totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground">ر.س</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          <Button
            variant={isSold ? "outline" : "default"}
            size="sm"
            className="rounded-lg gap-1.5 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/opportunities/${opportunity.id}`);
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

// --- Main Page ---
export default function OpportunitiesList() {
  // Use custom hooks for pagination and search
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({ debounceMs: 300 });

  // Additional filters
  const [interestLevel, setInterestLevel] = useState<string>("all");
  const [hasCounterOffer, setHasCounterOffer] = useState<boolean | "all">("all");
  const [dimensionsFilter, setDimensionsFilter] = useState<string>("all");
  const [haveSellOrder, setHaveSellOrder] = useState<string>("false");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Convert dimensionsFilter to API params
  const getDimensionsParams = () => {
    switch (dimensionsFilter) {
      case "pending":
        return { need_dim_order: true, has_dimensions: false };
      case "taken":
        return { has_dimensions: true };
      case "none":
        return { need_dim_order: false };
      default:
        return {};
    }
  };

  const dimensionsParams = getDimensionsParams();

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useOpportunities({
    search: debouncedTerm,
    page,
    page_size: pageSize,
    interest_level: interestLevel !== "all" ? interestLevel : undefined,
    has_counter_offer: hasCounterOffer !== "all" ? (hasCounterOffer as boolean) : undefined,
    total_price_after_tax_min: minPrice ? Number(minPrice) : undefined,
    total_price_after_tax_max: maxPrice ? Number(maxPrice) : undefined,
    have_sell_order: haveSellOrder !== "all" ? haveSellOrder === "true" : undefined,
    ...dimensionsParams,
  });

  const opportunities = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    clearSearch();
    setInterestLevel("all");
    setHasCounterOffer("all");
    setDimensionsFilter("all");
    setHaveSellOrder("false");
    setMinPrice("");
    setMaxPrice("");
    resetPage();
  };

  const hasActiveFilters = searchTerm || interestLevel !== "all" || hasCounterOffer !== "all" || dimensionsFilter !== "all" || minPrice || maxPrice;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <PageHeader
        title="إدارة الفرص"
        subtitle="إدارة ومتابعة طلبات العملاء والفرص البيعية"
        icon={<Target className="w-7 h-7" />}
        action={
          <Link to="/opportunities/new">
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
              <Plus className="ml-2 h-5 w-5" />
              فرصة جديدة
            </Button>
          </Link>
        }
      />

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم العميل أو رقم الهاتف..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pr-9 h-11 bg-background/50 border-transparent hover:border-border focus:border-primary transition-colors"
            />
          </div>

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

        {/* Additional Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-dashed">
          <div className="space-y-2">
            <Label>مدى الاهتمام</Label>
            <Select value={interestLevel} onValueChange={setInterestLevel}>
              <SelectTrigger className="w-full h-10 bg-background/50">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(INTEREST_LEVELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>عرض مقابل</Label>
            <Select
              value={hasCounterOffer === "all" ? "all" : hasCounterOffer ? "true" : "false"}
              onValueChange={(val) => setHasCounterOffer(val === "all" ? "all" : val === "true")}
            >
              <SelectTrigger className="w-full h-10 bg-background/50">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="true">يوجد عرض مقابل</SelectItem>
                <SelectItem value="false">لا يوجد عرض مقابل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>نطاق السعر</Label>
            <div className="flex items-center gap-2">
              <Input placeholder="من" type="number" min="0" step="any" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-10 bg-background/50" />
              <span className="text-muted-foreground">-</span>
              <Input placeholder="إلى" type="number" min="0" step="any" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-10 bg-background/50" />
            </div>
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
      </div>

      {/* Tab Filters and Extra Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Measurements Tab Filter */}
        <div className="flex items-center gap-2 flex-wrap">
        {[
          { value: "all", label: "الكل" },
          { value: "pending", label: "بانتظار المقاسات" },
          { value: "taken", label: "تم أخذ المقاسات" },
          { value: "none", label: "لا تحتاج مقاسات" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setDimensionsFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
              dimensionsFilter === tab.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-background text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
        </div>

        {/* Completed Opportunities Toggle */}
        <Button
          variant={haveSellOrder === "all" ? "default" : "outline"}
          onClick={() => {
            setHaveSellOrder(prev => prev === "false" ? "all" : "false");
            setPage(1);
          }}
          className={cn(
            "gap-2", 
            haveSellOrder === "false" && "border-primary/50 text-primary hover:bg-primary/5"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {haveSellOrder === "all" ? "إخفاء الفرص المكتملة" : "إظهار الفرص مع المكتملة"}
        </Button>
      </div>

      {isLoading ? (
        <LoadingState message="جاري تحميل الفرص..." />
      ) : isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold">حدث خطأ</h3>
          <p className="text-muted-foreground">فشل تحميل قائمة الفرص. يرجى المحاولة مرة أخرى.</p>
          <Button onClick={() => refetch()} variant="outline">إعادة المحاولة</Button>
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={Target}
          title="لا يوجد فرص"
          description={hasActiveFilters ? "لم يتم العثور على فرص تطابق معايير التصفية." : "لم يتم إضافة فرص حالياً."}
          action={
            hasActiveFilters ? (
              <Button variant="link" onClick={clearFilters}>مسح عوامل التصفية</Button>
            ) : (
              <Link to="/opportunities/new">
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  فرصة جديدة
                </Button>
              </Link>
            )
          }
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
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">العميل</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">الموقع</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">مندوب المبيعات</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">القيمة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">التاريخ</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground w-[120px]">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opportunities.map((opportunity) => (
                      <OpportunityRow key={opportunity.id} opportunity={opportunity} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {opportunities.map((opportunity) => (
              <OpportunityMobileCard key={opportunity.id} opportunity={opportunity} />
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
            entityName="فرصة"
          />
        </>
      )}
    </div>
  );
}
