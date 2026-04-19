import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Calendar, Clock, ShoppingCart, Sparkles, XCircle, CheckCircle2, Timer } from "lucide-react";
import { useSessionList, useCloseSession } from "@/hooks/useSessions";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { parseBackendError } from "@/lib/utils";

export default function SessionsList() {
  const navigate = useNavigate();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useSessionList({ page, page_size: pageSize });
  const closeMutation = useCloseSession();

  const sessions = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCloseSession = (id: number) => {
    setSelectedSessionId(id);
    setCloseModalOpen(true);
  };

  const confirmCloseSession = () => {
    if (!selectedSessionId) return;
    
    closeMutation.mutate(selectedSessionId, {
      onSuccess: () => {
        toast.success("تم إغلاق الجلسة بنجاح");
        setCloseModalOpen(false);
        setSelectedSessionId(null);
      },
      onError: (error) => {
        const errorMessage = parseBackendError(error);
        toast.error(errorMessage || "فشل إغلاق الجلسة");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
            <Timer className="w-7 h-7 text-primary" />
            إدارة الجلسات
          </h2>
          <p className="text-sm text-muted-foreground">
            عرض وإدارة جلسات الموظفين
          </p>
        </div>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => refetch()}>
          <Clock className="h-4 w-4" />
          تحديث
        </Button>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
          <p>فشل تحميل البيانات</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            إعادة المحاولة
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const isOpen = !session.closed_at;
              return (
                <Card 
                  key={session.id} 
                  className={`group overflow-hidden border-none ring-1 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b from-card to-muted/20 ${
                    isOpen ? "ring-success/50" : "ring-border/50"
                  }`}
                >
                  <CardHeader className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${
                        isOpen 
                          ? "bg-success/10 text-success" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <User className="h-6 w-6" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-base font-bold text-foreground leading-snug">
                          {session.salesman.first_name} {session.salesman.last_name}
                        </CardTitle>
                        <div className="text-xs text-muted-foreground font-mono opacity-70">جلسة #{session.id}</div>
                      </div>
                    </div>
                    <Badge 
                      variant={isOpen ? "default" : "secondary"} 
                      className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-medium shadow-sm ${
                        isOpen ? "bg-success hover:bg-success-dark" : ""
                      }`}
                    >
                      {isOpen ? (
                        <><CheckCircle2 className="h-3 w-3 ml-1" /> مفتوحة</>
                      ) : (
                        <><XCircle className="h-3 w-3 ml-1" /> مغلقة</>
                      )}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 p-4 md:p-5 text-right">
                    {/* Time Info */}
                    <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-info/70" />
                        <span>بدأت في</span>
                      </div>
                      <span className="font-medium text-xs">
                        {format(new Date(session.created_at), "PPp", { locale: arSA })}
                      </span>
                    </div>
                    
                    {session.closed_at && (
                      <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 text-warning/70" />
                          <span>أُغلقت في</span>
                        </div>
                        <span className="font-medium text-xs">
                          {format(new Date(session.closed_at), "PPp", { locale: arSA })}
                        </span>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="p-3 rounded-xl bg-success-light border border-success/30 text-center">
                        <div className="flex items-center justify-center gap-1 text-success mb-1">
                          <ShoppingCart className="h-4 w-4" />
                          <span className="text-xs font-medium">المبيعات</span>
                        </div>
                        <p className="font-bold text-lg text-success-dark font-mono">
                          {parseFloat(session.sell_orders_total || "0").toLocaleString()}
                        </p>
                        <p className="text-[10px] text-success">{session.sell_orders_count} أمر</p>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-info-light border border-info/30 text-center">
                        <div className="flex items-center justify-center gap-1 text-info mb-1">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-xs font-medium">الفرص</span>
                        </div>
                        <p className="font-bold text-lg text-info-dark font-mono">
                          {parseFloat(session.opportunities_total || "0").toLocaleString()}
                        </p>
                        <p className="text-[10px] text-info">{session.opportunities_count} فرصة</p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 bg-muted/30 flex gap-2">
                    <Button 
                      variant="default" 
                      className="flex-1 gap-2 rounded-lg shadow-sm" 
                      size="sm"
                      onClick={() => navigate(`/sessions/${session.id}`)}
                    >
                      التفاصيل
                    </Button>
                    {isOpen && (
                      <Button 
                        variant="destructive" 
                        className="flex-1 gap-2 rounded-lg" 
                        size="sm"
                        onClick={() => handleCloseSession(session.id)}
                        disabled={closeMutation.isPending && selectedSessionId === session.id}
                      >
                        {closeMutation.isPending && selectedSessionId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        إغلاق الجلسة
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] p-6 text-center rounded-2xl border-2 border-dashed border-muted bg-muted/5 animate-in fade-in zoom-in-50 duration-300">
              <div className="bg-muted/20 p-6 rounded-full mb-4">
                <Timer className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold text-foreground">لا توجد جلسات</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                لم يتم العثور على جلسات حالياً.
              </p>
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
        entityName="جلسة"
      />

      {/* Close Session Confirmation Modal */}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => {
          setCloseModalOpen(false);
          setSelectedSessionId(null);
        }}
        onConfirm={confirmCloseSession}
        title="إغلاق الجلسة"
        description="هل أنت متأكد من إغلاق هذه الجلسة؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="إغلاق الجلسة"
        cancelText="إلغاء"
        variant="destructive"
        isLoading={closeMutation.isPending}
      />
    </div>
  );
}
