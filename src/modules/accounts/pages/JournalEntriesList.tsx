import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Search, Plus, FileText, Loader2, Calendar } from "lucide-react";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { usePagination } from "@/hooks/usePagination";
import { Input } from "@/components/ui/input";
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
import { Pagination } from "@/components/shared/Pagination";
import { useCan } from "@/hooks/usePermissions";

export default function JournalEntriesList() {
  const navigate = useNavigate();
  const { can } = useCan();
  const [search, setSearch] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const { data, isLoading, isError } = useJournalEntries({
    search,
    page,
    page_size: pageSize,
  });

  const entries = data?.results || [];
  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  // Calculate totals for an entry
  const calculateTotals = (items: { debit: string; credit: string }[]) => {
    const totalDebit = items.reduce((sum, item) => sum + parseFloat(item.debit || "0"), 0);
    const totalCredit = items.reduce((sum, item) => sum + parseFloat(item.credit || "0"), 0);
    return { totalDebit, totalCredit };
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            سندات القيد
          </h1>
          <p className="text-muted-foreground mt-1">إدارة القيود المحاسبية</p>
        </div>
        {can("journal_entries.create") && (
          <Link to="/journal-entries/new">
            <Button className="gap-2 rounded-xl shadow-lg shadow-primary/20 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              قيد جديد
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث في سندات القيد..."
              className="pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="text-center py-12 text-destructive">
          <p>حدث خطأ أثناء تحميل البيانات</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && entries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="font-medium text-lg">لا توجد سندات قيد</p>
              <p className="text-muted-foreground">ابدأ بإنشاء قيد جديد</p>
            </div>
            {can("journal_entries.create") && (
              <Link to="/journal-entries/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  قيد جديد
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cards for Mobile */}
      {!isLoading && !isError && entries.length > 0 && (
        <>
          <div className="grid gap-4 lg:hidden">
            {entries.map((entry) => {
              const { totalDebit, totalCredit } = calculateTotals(entry.items);
              return (
                <Link key={entry.id} to={`/journal-entries/${entry.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          قيد #{entry.id}
                        </CardTitle>
                        <Badge variant="outline" className="font-mono">
                          {entry.items.length} بنود
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(entry.created_at), "PPP", { locale: arSA })}
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <div>
                          <span className="text-xs text-muted-foreground">مدين</span>
                          <p className="font-mono font-semibold text-success">
                            {totalDebit.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-left">
                          <span className="text-xs text-muted-foreground">دائن</span>
                          <p className="font-mono font-semibold text-destructive">
                            {totalCredit.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Table for Desktop */}
          <Card className="hidden lg:block border-border/50 shadow-sm">
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم القيد</TableHead>
                      <TableHead className="text-right">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          التاريخ
                        </div>
                      </TableHead>
                      <TableHead className="text-right">عدد البنود</TableHead>
                      <TableHead className="text-right">إجمالي المدين</TableHead>
                      <TableHead className="text-right">إجمالي الدائن</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => {
                      const { totalDebit, totalCredit } = calculateTotals(entry.items);
                      const isBalanced = totalDebit === totalCredit;
                      return (

                        <TableRow 
                          key={entry.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/journal-entries/${entry.id}`)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2 font-medium text-primary">
                              <FileText className="h-4 w-4" />
                              #{entry.id}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.created_at), "PPP", { locale: arSA })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{entry.items.length}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-success">
                            {totalDebit.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-destructive">
                            {totalCredit.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {isBalanced ? (
                              <Badge variant="default" className="bg-success-light text-success hover:bg-success-light">
                                متوازن
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                غير متوازن
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={data?.count || 0}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              entityName="سند قيد"
            />
          )}
        </>
      )}
    </div>
  );
}
