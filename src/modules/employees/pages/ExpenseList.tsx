import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, FileText, Receipt, Banknote, Calendar, Loader2, Tag } from "lucide-react";
import { useDisbursementList } from "@/hooks/useDisbursements";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

// Status logic based on approval fields
const getStatus = (request: any) => {
  if (request.rejected_by) {
    return { key: "rejected", label: "مرفوض", color: "destructive" };
  }
  if (request.accepted_by2) {
    return { key: "approved", label: "تمت الموافقة", color: "success" };
  }
  if (request.accepted_by1) {
    return { key: "partial", label: "موافقة أولى", color: "warning" };
  }
  return { key: "pending", label: "قيد المراجعة", color: "warning" };
};

export default function ExpenseList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const { data, isLoading, isError } = useDisbursementList({ page, page_size: pageSize });

  const requests = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Client-side filter (for notes/type name)
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      request.type?.name?.toLowerCase().includes(searchLower) ||
      request.notes?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-10" dir="rtl">
       {/* Header with Glassmorphism */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
            <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    طلبات الصرف
                </h2>
                <p className="text-sm text-muted-foreground">
                    إدارة ومتابعة طلبات الصرف والمصاريف المتنوعة
                </p>
            </div>
            <div className="flex items-center gap-2">
                 <div className="relative w-full md:w-64">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="بحث بالنوع أو الملاحظات..."
                        className="pr-9 rounded-xl border-muted-foreground/20 bg-background/50 focus:bg-background transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Link to="/employee-expenses/new">
                    <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">طلب جديد</span>
                    </Button>
                </Link>
            </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
          <p>فشل تحميل البيانات</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const status = getStatus(request);
              return (
                <Card key={request.id} className="group overflow-hidden border-none ring-1 ring-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b from-card to-muted/20">
                  <CardHeader className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                    <div className="space-y-1">
                         <CardTitle className="text-base font-bold text-foreground leading-snug flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary/70" />
                            <span className="break-words">{request.type?.name || "بدون نوع"}</span>
                        </CardTitle>
                        <div className="text-xs text-muted-foreground font-mono opacity-70">#{request.id}</div>
                    </div>
                    <Badge variant={status.color as any} className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-medium shadow-sm">
                        {status.label}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 p-4 md:p-5 text-right">
                      <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                             <Banknote className="h-4 w-4 text-success/70" />
                             <span>المبلغ الإجمالي شامل الضريبة</span>
                        </div>
                        <span className="font-bold font-mono text-success">{parseFloat(request.total_cost).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">ر.س</span></span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                             <Calendar className="h-4 w-4 text-info/70" />
                             <span>التاريخ</span>
                        </div>
                        <span className="font-medium font-mono">
                          {request.created_at
                            ? format(new Date(request.created_at), "PPP", { locale: arSA })
                            : "-"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {request.custody_amount && parseFloat(request.custody_amount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-info-light text-info hover:bg-info/20 border-info/30">
                            عهدة: {parseFloat(request.custody_amount).toLocaleString()}
                          </Badge>
                        )}
                        {request.transfer_amount && parseFloat(request.transfer_amount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-success-light text-success hover:bg-success/20 border-success/30">
                            تحويل: {parseFloat(request.transfer_amount).toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] px-1 relative">
                        {request.notes || "بدون ملاحظات"}
                        {request.file && (
                            <div className="absolute top-0 left-0 text-muted-foreground" title="يوجد مرفق">
                                 <Receipt className="h-3 w-3" />
                            </div>
                        )}
                      </div>
                  </CardContent>

                  <CardFooter className="p-3 bg-muted/30 flex gap-2">
                       <Button 
                         variant="default" 
                         className="flex-1 gap-2 rounded-lg shadow-sm" 
                         size="sm"
                         onClick={() => navigate(`/employee-expenses/${request.id}`)}
                       >
                           <FileText className="h-4 w-4" />
                           التفاصيل
                       </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] p-6 text-center rounded-2xl border-2 border-dashed border-muted bg-muted/5 animate-in fade-in zoom-in-50 duration-300">
              <div className="bg-muted/20 p-6 rounded-full mb-4">
                  <Receipt className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground">لا يوجد طلبات صرف</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                  لم يتم العثور على طلبات {searchQuery ? "تطابق بحثك" : "حالية"}.
              </p>
               {!searchQuery && (
                  <Link to="/employee-expenses/new" className="mt-6">
                      <Button>
                          <Plus className="h-4 w-4 ml-2" />
                          طلب جديد
                      </Button>
                  </Link>
              )}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
}
