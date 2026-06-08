import { UserPlus, UserRoundCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/shared";
import { useCustomers, useConvertToActual } from "@/hooks/useCustomers";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { useState } from "react";
import { parseBackendError } from "@/lib/utils";
import type { Customer } from "@/types";
import { toast } from "sonner";

function customerName(customer: Customer): string {
  const name = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
  return name || `عميل #${customer.id}`;
}

export default function PotentialCustomersList() {
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm, debouncedTerm, setSearchTerm } = useSearch({ debounceMs: 300 });

  const { data, isLoading, isError, error, refetch } = useCustomers({
    search: debouncedTerm,
    page,
    page_size: pageSize,
    is_potential: true,
  });

  const convertToActual = useConvertToActual();
  // Track which row is currently being converted so only its button spins.
  const [convertingId, setConvertingId] = useState<number | null>(null);

  const customers = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleConvert = (customer: Customer) => {
    setConvertingId(customer.id);
    convertToActual.mutate(customer.id, {
      onSuccess: () => {
        toast.success(`تم تحويل ${customerName(customer)} إلى عميل فعلي`);
      },
      onError: (err) => {
        toast.error(parseBackendError(err) || "فشل تحويل العميل المحتمل");
      },
      onSettled: () => {
        setConvertingId(null);
      },
    });
  };

  if (isError && isServerError(error)) {
    return <ServerErrorPage onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="العملاء المحتملون"
        subtitle="عملاء أُضيفوا عبر الفرص ولم يصدر لهم أمر بيع بعد"
        icon={<UserPlus className="w-7 h-7" />}
      />

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="max-w-md"
        />

        {isLoading ? (
          <LoadingState message="جاري تحميل العملاء المحتملين..." />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-destructive">
            <p>فشل تحميل البيانات</p>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="لا يوجد عملاء محتملون"
            description={
              searchTerm
                ? "لم يتم العثور على عملاء محتملين يطابقون بحثك."
                : "لا يوجد عملاء محتملون حالياً."
            }
          />
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:hidden">
              {customers.map((customer) => {
                const isConverting = convertingId === customer.id;
                return (
                  <div
                    key={customer.id}
                    className="overflow-hidden rounded-xl border bg-card shadow-sm"
                  >
                    <div className="space-y-3 p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-lg truncate">
                            {customerName(customer)}
                          </span>
                          <span className="text-xs font-mono text-muted-foreground mt-1">
                            #{customer.id}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-warning text-warning bg-warning-light shrink-0"
                        >
                          محتمَل
                        </Badge>
                      </div>

                      <div className="bg-muted/30 p-2 rounded-lg py-2 px-3">
                        <span className="block text-xs text-muted-foreground mb-1">
                          الجوال
                        </span>
                        <a
                          href={`tel:${customer.phone_number}`}
                          className="font-mono text-sm font-medium hover:text-primary hover:underline transition-colors"
                          dir="ltr"
                        >
                          {customer.phone_number}
                        </a>
                      </div>

                      <div className="pt-1">
                        <Button
                          className="w-full gap-2"
                          disabled={isConverting}
                          onClick={() => handleConvert(customer)}
                        >
                          {isConverting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserRoundCheck className="h-4 w-4" />
                          )}
                          تحويل إلى عميل فعلي
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden lg:block rounded-xl border bg-card overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الاسم</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الجوال</TableHead>
                    <TableHead className="text-center whitespace-nowrap">الحالة</TableHead>
                    <TableHead className="text-left whitespace-nowrap">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const isConverting = convertingId === customer.id;
                    return (
                      <TableRow
                        key={customer.id}
                        className="group hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground text-right whitespace-nowrap">
                          {customer.id}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <span className="font-medium">{customerName(customer)}</span>
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
                        <TableCell className="text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="border-warning text-warning bg-warning-light"
                          >
                            محتمَل
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left whitespace-nowrap">
                          <Button
                            size="sm"
                            className="gap-2"
                            disabled={isConverting}
                            onClick={() => handleConvert(customer)}
                          >
                            {isConverting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserRoundCheck className="h-4 w-4" />
                            )}
                            تحويل إلى عميل فعلي
                          </Button>
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
              entityName="عميل محتمل"
            />
          </>
        )}
      </div>
    </div>
  );
}
