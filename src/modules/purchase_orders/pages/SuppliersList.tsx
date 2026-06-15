import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Edit, 
  Phone, 
  Building2,
  ChevronLeft,
  Filter,
  X,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Users,
  User,
  MapPin
} from "lucide-react";
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
import { useSuppliers } from "@/hooks/useSuppliers";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { ServerErrorPage, isServerError } from "@/components/common/ServerErrorPage";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatSupplierWithBalance } from "@/lib/partyDisplay";
import { useCan } from "@/hooks/usePermissions";

export default function SuppliersList() {
  const navigate = useNavigate();
  const { can } = useCan();
  const [searchTerm, setSearchTerm] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [hasVat, setHasVat] = useState<string>("all");
  const [hasCr, setHasCr] = useState<string>("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isRefetching } = useSuppliers({
    search: searchTerm,
    page,
    page_size: pageSize,
    has_vat_number: hasVat !== "all" ? (hasVat === "true") : undefined,
    has_cr_number: hasCr !== "all" ? (hasCr === "true") : undefined,
  });

  const suppliers = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    setSearchTerm("");
    setHasVat("all");
    setHasCr("all");
    setPage(1);
  };

  const hasActiveFilters = searchTerm || hasVat !== "all" || hasCr !== "all";

  if (isError && isServerError(error)) {
    return <ServerErrorPage onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة الموردين
          </h1>
          <p className="text-muted-foreground text-lg">
            قائمة بجميع الموردين المسجلين في النظام
          </p>
        </div>
        {can("suppliers.create") && (
          <Link to="/suppliers/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 gap-2">
              <Plus className="h-5 w-5" />
              مورد جديد
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
                    placeholder="بحث بالاسم أو رقم الهاتف..."
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
                    {/* Has VAT Filter */}
                    <div className="space-y-2">
                        <Label>الرقم الضريبي</Label>
                        <Select
                            value={hasVat}
                            onValueChange={setHasVat}
                        >
                            <SelectTrigger className="w-full h-10 bg-background/50">
                                <SelectValue placeholder="الكل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="true">متوفر</SelectItem>
                                <SelectItem value="false">غير متوفر</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Has CR Filter */}
                    <div className="space-y-2">
                        <Label>السجل التجاري</Label>
                        <Select
                            value={hasCr}
                            onValueChange={setHasCr}
                        >
                            <SelectTrigger className="w-full h-10 bg-background/50">
                                <SelectValue placeholder="الكل" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">الكل</SelectItem>
                                <SelectItem value="true">متوفر</SelectItem>
                                <SelectItem value="false">غير متوفر</SelectItem>
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

        {/* Mobile View: Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-muted-foreground">جاري التحميل...</span>
                </div>
            ) : suppliers.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border rounded-xl bg-card border-dashed">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p>{hasActiveFilters ? "لا يوجد موردين يطابقون البحث" : "لا يوجد موردين حالياً"}</p>
                 </div>
            ) : (
                suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="bg-card border rounded-xl p-4 shadow-sm space-y-4 cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => navigate(`/suppliers/${supplier.id}`)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {supplier.display_name.substring(0,2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-base leading-tight">
                                      {formatSupplierWithBalance(supplier)}
                                    </h3>
                                    <span className="text-xs text-muted-foreground font-mono">#{supplier.id}</span>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}`)}>
                                        <Eye className="ml-2 h-4 w-4" />
                                        عرض التفاصيل
                                    </DropdownMenuItem>
                                    {can("suppliers.edit") && (
                                        <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}>
                                            <Edit className="ml-2 h-4 w-4" />
                                            تعديل
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                            {supplier.contact_name && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span>{supplier.contact_name}</span>
                                </div>
                            )}
                             <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4 shrink-0" />
                                <a href={`tel:${supplier.phone_number}`} dir="ltr" className="font-mono text-foreground hover:text-primary hover:underline transition-colors">{supplier.phone_number}</a>
                            </div>
                            {supplier.address && (
                                <div className="flex items-start gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{supplier.address}</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="pt-3 border-t flex items-center justify-between">
                             <div className="flex gap-1.5">
                                {supplier.vat_number && (
                                     <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-success-light text-success border-success/20">ضريبية</Badge>
                                )}
                                {supplier.cr_number && (
                                     <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-info-light text-info border-info/20">سجل</Badge>
                                )}
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">الطلبات</span>
                                <Badge
                                  variant="secondary"
                                  className="font-mono px-2 cursor-pointer hover:bg-muted"
                                  role="button"
                                  tabIndex={0}
                                  title="عرض طلبات الشراء لهذا المورد"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/purchase-orders?search=${encodeURIComponent(
                                        supplier.display_name,
                                      )}`,
                                    );
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      navigate(
                                        `/purchase-orders?search=${encodeURIComponent(
                                          supplier.display_name,
                                        )}`,
                                      );
                                    }
                                  }}
                                >
                                  {supplier.order_count}
                                </Badge>
                             </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/suppliers/${supplier.id}`);
                          }}
                        >
                            عـرض التفاصيـل
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                ))
            )}
        </div>

        {/* Desktop/Tablet View: Table */}
        <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px] text-right">#</TableHead>
                <TableHead className="text-right">المورد</TableHead>
                <TableHead className="text-right">جهة الاتصال</TableHead>
                <TableHead className="text-center hidden lg:table-cell">الطلبات</TableHead>
                <TableHead className="text-center hidden xl:table-cell">الأوراق</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">جاري التحميل...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 opacity-20" />
                        <p>{hasActiveFilters ? "لا يوجد موردين يطابقون البحث" : "لا يوجد موردين حالياً"}</p>
                        {hasActiveFilters && (
                            <Button variant="link" onClick={clearFilters}>مسح عوامل التصفية</Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/suppliers/${supplier.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">#{supplier.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-foreground text-base">
                          {formatSupplierWithBalance(supplier)}
                        </span>
                        {supplier.address && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{supplier.address}</span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-start gap-3">
                             <Avatar className="h-8 w-8 hidden lg:flex">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {supplier.contact_name ? supplier.contact_name.substring(0,2).toUpperCase() : <User className="h-4 w-4" />}
                                </AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col gap-0.5">
                                 <span className="text-sm font-medium">{supplier.contact_name || "غير محدد"}</span>
                                 <div className="flex flex-col text-xs text-muted-foreground">
                                     <a href={`tel:${supplier.phone_number}`} className="flex items-center gap-1 font-mono hover:text-primary hover:underline transition-colors" dir="ltr">
                                         {supplier.phone_number}
                                         <Phone className="h-3 w-3" />
                                     </a>
                                     {supplier.email && (
                                         <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 mt-0.5 hover:text-primary hover:underline transition-colors">
                                             {supplier.email}
                                         </a>
                                     )}
                                 </div>
                             </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-center hidden lg:table-cell">
                      <Badge
                        variant="secondary"
                        className="font-mono cursor-pointer hover:bg-muted"
                        role="button"
                        tabIndex={0}
                        title="عرض طلبات الشراء لهذا المورد"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            `/purchase-orders?search=${encodeURIComponent(
                              supplier.display_name,
                            )}`,
                          );
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(
                              `/purchase-orders?search=${encodeURIComponent(
                                supplier.display_name,
                              )}`,
                            );
                          }
                        }}
                      >
                        {supplier.order_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center hidden xl:table-cell">
                        <div className="flex justify-center gap-1">
                            {supplier.vat_number && (
                                <Badge variant="outline" className="text-[10px] bg-success-light text-success border-success/20">ضريبية</Badge>
                            )}
                            {supplier.cr_number && (
                                <Badge variant="outline" className="text-[10px] bg-info-light text-info border-info/20">سجل</Badge>
                            )}
                        </div>
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
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/suppliers/${supplier.id}`);
                            }}
                          >
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          {can("suppliers.edit") && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/suppliers/${supplier.id}/edit`);
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
          entityName="مورد"
        />
      </div>
    </div>
  );
}
