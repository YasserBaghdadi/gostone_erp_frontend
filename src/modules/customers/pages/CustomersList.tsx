import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Users,
  MoreVertical,
  Eye,
  Edit,
  CreditCard,
  UserCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { ServerErrorPage, isServerError } from "@/components/common/ServerErrorPage";
import {
  PageHeader,
  Pagination,
  SearchBar,
  LoadingState,
  EmptyState,
  OdooBadge,
} from "@/components/shared";
import { useCustomers, useSyncAllCustomersToOdoo } from "@/hooks/useCustomers";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useState } from "react";
import { AddPaymentModal } from "../components/AddPaymentModal";
import { customerAccentColor, parseBackendError } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import type { Salesman } from "@/types";
import { toast } from "sonner";

function salesmanLabel(s: Salesman): string {
  const name = `${s.first_name || ""} ${s.last_name || ""}`.trim();
  return name || s.phone_number || `مندوب #${s.id}`;
}

export default function CustomersList() {
  const navigate = useNavigate();
  const syncAllCustomersToOdooMutation = useSyncAllCustomersToOdoo();
  
  // Use custom hooks for pagination and search
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm } = useSearch({ debounceMs: 300 });
  
  const { data, isLoading, isError, error, refetch } = useCustomers({
    search: debouncedTerm, // Use debounced term for API calls
    page,
    page_size: pageSize,
    is_potential: false, // Show only actual customers; leads live on /potential-customers
  });

  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    customerId: number;
    customerName: string;
  }>({
    isOpen: false,
    customerId: 0,
    customerName: "",
  });

  const customers = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage(); // Reset to page 1 when search changes
  };

  const openPaymentModal = (id: number, name: string) => {
    setPaymentModal({
      isOpen: true,
      customerId: id,
      customerName: name,
    });
  };

  if (isError && isServerError(error)) {
    return <ServerErrorPage onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {paymentModal.isOpen && (
        <AddPaymentModal 
          customerId={paymentModal.customerId}
          customerName={paymentModal.customerName}
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
      <PageHeader
        title="إدارة العملاء"
        subtitle="قائمة بجميع العملاء المسجلين وسجل زياراتهم"
        icon={<Users className="w-7 h-7" />}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              className="rounded-xl gap-2 border-0 bg-[#875A7B] text-white hover:bg-[#714a67] shadow-sm"
              disabled={syncAllCustomersToOdooMutation.isPending}
              onClick={() => {
                syncAllCustomersToOdooMutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success("تم بدء ربط جميع العملاء مع Odoo بنجاح");
                  },
                  onError: (error) => {
                    toast.error(
                      parseBackendError(error) || "فشل ربط جميع العملاء مع Odoo",
                    );
                  },
                });
              }}
            >
              {syncAllCustomersToOdooMutation.isPending ? (
                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
              ) : (
                <OdooBadge className="ml-2" />
              )}
              ربط الكل مع Odoo
            </Button>

            <Link to="/customers/new">
              <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
                <Plus className="ml-2 h-5 w-5" />
                عميل جديد
              </Button>
            </Link>
          </div>
        }
      />

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="max-w-md"
        />

        {isLoading ? (
          <LoadingState message="جاري تحميل العملاء..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-destructive">
            <p>فشل تحميل البيانات</p>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="لا يوجد عملاء"
            description={searchTerm ? "لم يتم العثور على عملاء تطابق بحثك." : "لم يتم إضافة عملاء حالياً."}
            action={
              !searchTerm && (
                <Link to="/customers/new">
                  <Button>
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة عميل جديد
                  </Button>
                </Link>
              )
            }
          />
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex gap-0 overflow-hidden rounded-xl border bg-card shadow-sm cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <div
                    className="w-1.5 shrink-0 self-stretch min-h-16"
                    style={{
                      backgroundColor: customerAccentColor(customer.color),
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-3 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-bold text-lg">
                        {formatCustomerWithBalance(customer)}
                      </span>
                       <span className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Badge variant={customer.is_active ? "outline" : "destructive"} className={customer.is_active ? "border-success text-success bg-success-light" : ""}>
                              {customer.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground mx-2">#{customer.id}</span>
                       </span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.id}`);
                          }}
                        >
                            <Eye className="ml-2 h-4 w-4" />
                            عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/customers/${customer.id}/edit`);
                          }}
                        >
                            <Edit className="ml-2 h-4 w-4" />
                            تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentModal(
                              customer.id,
                              formatCustomerWithBalance(customer),
                            );
                          }}
                        >
                            <CreditCard className="ml-2 h-4 w-4" />
                            إضافة دفعة
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/30 p-2 rounded-lg py-2 px-3">
                          <span className="block text-xs text-muted-foreground mb-1">رقم الهاتف</span>
                          <a href={`tel:${customer.phone_number}`} className="font-mono text-sm font-medium hover:text-primary hover:underline transition-colors" dir="ltr">{customer.phone_number}</a>
                      </div>
                      <div className="bg-muted/30 p-2 rounded-lg py-2 px-3">
                        <span className="block text-xs text-muted-foreground mb-1">آخر زيارة</span>
                        <span className="font-medium">
                            {customer.last_visit ? format(new Date(customer.last_visit), "yyyy-MM-dd") : "-"}
                        </span>
                      </div>
                  </div>
                  {customer.salesmen && customer.salesmen.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">المندوب:</span>
                      <span className="text-xs font-medium truncate">
                        {customer.salesmen.map((s) => salesmanLabel(s)).join("، ")}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-2">
                       <Button
                         variant="outline"
                         className="w-full text-primary border-primary/20 hover:bg-primary/5"
                         onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/customers/${customer.id}`);
                         }}
                       >
                            عرض الملف الشخصي
                       </Button>
                  </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-2 p-0" aria-label="لون العميل" />
                    <TableHead className="w-[50px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الاسم</TableHead>
                    <TableHead className="text-right whitespace-nowrap">رقم الهاتف</TableHead>
                    <TableHead className="text-right whitespace-nowrap">المندوب</TableHead>
                    <TableHead className="hidden md:table-cell text-right whitespace-nowrap">البريد الإلكتروني</TableHead>
                    <TableHead className="hidden lg:table-cell text-right whitespace-nowrap">تاريخ الانضمام</TableHead>
                    <TableHead className="hidden lg:table-cell text-right whitespace-nowrap">آخر زيارة</TableHead>
                    <TableHead className="text-center hidden sm:table-cell whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="w-2 p-0 align-middle">
                        <div
                          className="mx-auto min-h-10 w-1.5 rounded-full"
                          style={{
                            backgroundColor: customerAccentColor(customer.color),
                          }}
                          title={customer.color || undefined}
                          aria-hidden
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
                        {customer.id}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatCustomerWithBalance(customer)}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {customer.is_active ? "نشط" : "غير نشط"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 text-sm" dir="ltr">
                           <a
                             href={`tel:${customer.phone_number}`}
                             onClick={(e) => e.stopPropagation()}
                             className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs select-all hover:bg-primary/20 transition-colors"
                           >
                             {customer.phone_number}
                           </a>
                        </div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {customer.salesmen && customer.salesmen.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {customer.salesmen.map((s) => (
                              <span key={s.id} className="text-xs font-medium flex items-center gap-1.5">
                                <UserCheck className="h-3 w-3 text-primary/60 shrink-0" />
                                {salesmanLabel(s)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm text-right whitespace-nowrap">
                        {customer.email || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm text-right whitespace-nowrap">
                         {customer.date_joined ? format(new Date(customer.date_joined), "PPP", { locale: arSA }) : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right whitespace-nowrap">
                         {customer.last_visit ? (
                          <div className="flex flex-col text-xs">
                               <span className="font-medium">{format(new Date(customer.last_visit), "PPP", { locale: arSA })}</span>
                               {customer.visit_repetition_days !== undefined && customer.visit_repetition_days > 0 && (
                                   <span className="text-muted-foreground text-[10px]">كل {customer.visit_repetition_days} يوم</span>
                               )}
                          </div>
                         ) : "-"}
                      </TableCell>
                       <TableCell className="text-center hidden sm:table-cell whitespace-nowrap">
                          <Badge variant={customer.is_active ? "outline" : "destructive"} className={customer.is_active ? "border-success text-success bg-success-light" : ""}>
                              {customer.is_active ? "نشط" : "غير نشط"}
                          </Badge>
                       </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.id}`); }}>
                              <Eye className="ml-2 h-4 w-4" />
                              عرض التفاصيل
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/customers/${customer.id}/edit`); }}>
                              <Edit className="ml-2 h-4 w-4" />
                              تعديل البيانات
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                openPaymentModal(
                                  customer.id,
                                  formatCustomerWithBalance(customer),
                                );
                              }}
                            >
                              <CreditCard className="ml-2 h-4 w-4" />
                              إضافة دفعة
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
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
              entityName="عميل"
            />
          </>
        )}
      </div>
    </div>
  );
}
