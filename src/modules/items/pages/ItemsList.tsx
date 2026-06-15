import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Loader2, Package, MoreVertical, Eye, Edit, Check, X, Filter, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useItems } from "@/hooks/useItems";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { Pagination } from "@/components/shared";
import { ServerErrorPage, isServerError } from "@/components/common/ServerErrorPage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCan } from "@/hooks/usePermissions";

const UNIT_LABELS: Record<string, string> = {
  piece: "حبة",
  pcs: "حبة",
  meter: "متر",
  square_meter: "متر مربع",
  sqm: "متر مربع",
  linear_meter: "متر طولي",
  box: "صندوق",
  kg: "كيلو",
  liter: "لتر",
  set: "طقم",
};

const getUnitLabel = (unit: string) => UNIT_LABELS[unit] || unit;

export default function ItemsList() {
  const navigate = useNavigate();
  const { can } = useCan();

  // Use custom hooks for pagination and search
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm, clear: clearSearch } = useSearch({ debounceMs: 300 });
  
  // Additional filter states
  const [isSellable, setIsSellable] = useState<string>("all"); // "all" | "true" | "false"
  const [isPurchable, setIsPurchable] = useState<string>("all"); // "all" | "true" | "false"
  const [ordering, setOrdering] = useState<string>(""); // "", "name", "-name", "unit_price", "-unit_price"
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  const { data, isLoading, isError, error, refetch, isRefetching } = useItems({
    search: debouncedTerm,
    page,
    page_size: pageSize,
    is_sellable: isSellable !== "all" ? (isSellable === "true") : undefined,
    is_purchable: isPurchable !== "all" ? (isPurchable === "true") : undefined,
    ordering: ordering || undefined,
  });

  const items = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    clearSearch();
    setIsSellable("all");
    setIsPurchable("all");
    setOrdering("");
    resetPage();
  };

  const toggleSort = (field: string) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering("");
    } else {
      setOrdering(field);
    }
  };

  const hasActiveFilters = searchTerm || isSellable !== "all" || isPurchable !== "all" || ordering !== "";

  if (isError && isServerError(error)) {
    return <ServerErrorPage onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة المنتجات
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            قائمة بجميع المنتجات والأصناف المتاحة
          </p>
        </div>
        {can("items.create") && (
          <Link to="/items/new">
            <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
              <Plus className="ml-2 h-5 w-5" />
              منتج جديد
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        {/* Basic Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم..."
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
              {/* Sellable Filter */}
              <div className="space-y-2">
                <Label>قابل للبيع</Label>
                <Select value={isSellable} onValueChange={setIsSellable}>
                  <SelectTrigger className="w-full h-10 bg-background/50">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="true">نعم</SelectItem>
                    <SelectItem value="false">لا</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Purchasable Filter */}
              <div className="space-y-2">
                <Label>قابل للشراء</Label>
                <Select value={isPurchable} onValueChange={setIsPurchable}>
                  <SelectTrigger className="w-full h-10 bg-background/50">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="true">نعم</SelectItem>
                    <SelectItem value="false">لا</SelectItem>
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
        
        {/* Mobile View (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground min-h-[300px]">
               <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
               <p>جاري تحميل المنتجات...</p>
            </div>
          ) : isError ? (
            <div className="text-center p-8 text-destructive border rounded-xl bg-destructive/5">
              فشل تحميل البيانات
            </div>
          ) : items.length === 0 ? (
             <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">لا يوجد منتجات</p>
             </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/items/${item.id}`);
                            }}
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {can("items.edit") && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/items/${item.id}/edit`);
                              }}
                            >
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                  
                  <div className="pr-8">
                      <div className="flex items-start justify-between mb-2">
                          <div>
                              <h3 className="font-bold text-lg text-foreground mb-1">{item.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-mono">#{item.id}</span>
                                  <span>•</span>
                                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                      {getUnitLabel(item.default_unit_name)}
                                  </Badge>
                                  {item.thickness && (
                                     <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal font-mono [direction:ltr]">
                                         {item.thickness}
                                     </Badge>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="flex items-end justify-between mt-4">
                          <div>
                             <p className="text-xs text-muted-foreground mb-1">السعر</p>
                             <p className="text-xl font-bold text-primary font-mono">
                                 {parseFloat(item.unit_price).toLocaleString()} <span className="text-sm">ر.س</span>
                             </p>
                          </div>
                           <div className="text-left">
                             <p className="text-xs text-muted-foreground mb-1">المخزون</p>
                             <p className={`font-mono font-bold ${item.inventory ? (item.inventory > 0 ? "text-foreground" : "text-destructive") : "text-muted-foreground"}`}>
                                 {item.inventory ?? 0}
                             </p>
                          </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex gap-4 text-xs">
                          <div className={`flex items-center gap-1.5 ${item.is_sellable ? "text-success" : "text-muted-foreground/50"}`}>
                              {item.is_sellable ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              <span>قابل للبيع</span>
                          </div>
                          <div className={`flex items-center gap-1.5 ${item.is_purchable ? "text-info" : "text-muted-foreground/50"}`}>
                              {item.is_purchable ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                              <span>قابل للشراء</span>
                          </div>
                      </div>
                  </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] text-right whitespace-nowrap">#</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="-mr-3 h-8 data-[state=open]:bg-accent text-right"
                    onClick={() => toggleSort('name')}
                  >
                    <span>اسم المنتج</span>
                    {ordering === 'name' ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : ordering === '-name' ? (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="-mr-3 h-8 data-[state=open]:bg-accent text-right"
                    onClick={() => toggleSort('unit_price')}
                  >
                    <span>السعر</span>
                    {ordering === 'unit_price' ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : ordering === '-unit_price' ? (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">الوحدة</TableHead>
                <TableHead className="text-right whitespace-nowrap">السمك</TableHead>
                <TableHead className="text-center whitespace-nowrap">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="-mr-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('inventory')}
                  >
                    <span>المخزون</span>
                    {ordering === 'inventory' ? (
                      <ArrowUp className="ml-2 h-4 w-4" />
                    ) : ordering === '-inventory' ? (
                      <ArrowDown className="ml-2 h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
                    )}
                  </Button>
                </TableHead>
                <TableHead className="text-center whitespace-nowrap">للبيع</TableHead>
                <TableHead className="text-center whitespace-nowrap">للشراء</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">جاري التحميل...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                  <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-destructive">
                      فشل تحميل البيانات
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>لا يوجد منتجات مطابقة للبحث</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
                      {item.id}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium break-words max-w-[200px] truncate">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className="font-bold text-primary whitespace-nowrap">
                        {parseFloat(item.unit_price).toLocaleString()} ر.س
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Badge variant="outline">{getUnitLabel(item.default_unit_name)}</Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                       {item.thickness ? <span className="font-mono text-xs">{item.thickness}</span> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-center font-mono whitespace-nowrap">
                      {item.inventory ?? 0}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {item.is_sellable ? (
                        <Check className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {item.is_purchable ? (
                        <Check className="h-5 w-5 text-success mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/items/${item.id}`);
                            }}
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {can("items.edit") && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/items/${item.id}/edit`);
                              }}
                            >
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
          entityName="منتج"
        />
      </div>
    </div>
  );
}
