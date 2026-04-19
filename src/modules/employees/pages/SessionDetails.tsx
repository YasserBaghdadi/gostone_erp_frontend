import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowRight, User, Calendar, Loader2, Clock, ShoppingCart, Sparkles, XCircle, CheckCircle2, Timer, Phone } from "lucide-react";
import { useSessionDetails, useCloseSession } from "@/hooks/useSessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { parseBackendError } from "@/lib/utils";

export default function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading, isError } = useSessionDetails(id!);
  const closeMutation = useCloseSession();
  const [closeModalOpen, setCloseModalOpen] = useState(false);

  const handleCloseSession = () => {
    setCloseModalOpen(true);
  };

  const confirmCloseSession = () => {
    if (!session) return;
    
    closeMutation.mutate(session.id, {
      onSuccess: () => {
        toast.success("تم إغلاق الجلسة بنجاح");
        setCloseModalOpen(false);
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

  if (isError || !session) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">الجلسة غير موجودة</h2>
        <Button onClick={() => navigate("/sessions")}>عودة للقائمة</Button>
      </div>
    );
  }

  const isOpen = !session.closed_at;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${
            isOpen 
              ? "bg-success/20 text-success ring-2 ring-success/30" 
              : "bg-muted text-muted-foreground ring-2 ring-border"
          }`}>
            <Timer className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              تفاصيل الجلسة #{session.id}
            </h2>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isOpen ? "default" : "secondary"} 
                className={`text-xs ${isOpen ? "bg-success hover:bg-success-dark" : ""}`}
              >
                {isOpen ? (
                  <><CheckCircle2 className="h-3 w-3 ml-1" /> مفتوحة</>
                ) : (
                  <><XCircle className="h-3 w-3 ml-1" /> مغلقة</>
                )}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link to="/sessions">
            <Button variant="outline" className="rounded-xl gap-2 hover:bg-muted/50 transition-colors">
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
          </Link>
          {isOpen && (
            <Button 
              variant="destructive"
              className="rounded-xl gap-2"
              onClick={handleCloseSession}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              إغلاق الجلسة
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Salesman Info */}
          <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                معلومات الموظف
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shadow-inner">
                  {session.salesman.first_name.charAt(0)}{session.salesman.last_name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-foreground">
                    {session.salesman.first_name} {session.salesman.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="font-mono dir-ltr">{session.salesman.phone_number || "غير محدد"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    معرف الموظف: #{session.salesman.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Info */}
          <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                توقيت الجلسة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 p-4 rounded-xl bg-success-light border border-success/20">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-success" />
                  وقت البدء
                </span>
                <span className="font-bold text-lg">
                  {format(new Date(session.created_at), "PPpp", { locale: arSA })}
                </span>
              </div>
              
              <div className={`space-y-1.5 p-4 rounded-xl ${
                session.closed_at 
                  ? "bg-warning-light border border-warning/20" 
                  : "bg-muted/20 border border-dashed border-muted"
              }`}>
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-warning" />
                  وقت الإغلاق
                </span>
                <span className="font-bold text-lg">
                  {session.closed_at 
                    ? format(new Date(session.closed_at), "PPpp", { locale: arSA }) 
                    : "الجلسة مفتوحة"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Stats */}
        <div className="space-y-6">
          {/* Sell Orders Stats */}
          <Card className="shadow-md border-none ring-1 ring-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success shadow-inner">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">أوامر البيع</p>
                  <p className="text-xs text-muted-foreground">{session.sell_orders_count} أمر</p>
                </div>
              </div>
              <div className="text-center p-4 bg-success-light rounded-xl border border-success/20">
                <p className="text-3xl font-bold text-success-dark font-mono">
                  {parseFloat(session.sell_orders_total || "0").toLocaleString()}
                </p>
                <p className="text-sm text-success">ر.س</p>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Stats */}
          <Card className="shadow-md border-none ring-1 ring-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center text-info shadow-inner">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">الفرص</p>
                  <p className="text-xs text-muted-foreground">{session.opportunities_count} فرصة</p>
                </div>
              </div>
              <div className="text-center p-4 bg-info-light rounded-xl border border-info/20">
                <p className="text-3xl font-bold text-info-dark font-mono">
                  {parseFloat(session.opportunities_total || "0").toLocaleString()}
                </p>
                <p className="text-sm text-info">ر.س</p>
              </div>
            </CardContent>
          </Card>

          {/* Discount Info */}
          {session.salesman.discount_percentage && (
            <Card className="shadow-md border-none ring-1 ring-border/50">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">نسبة الخصم المسموحة</p>
                <p className="text-2xl font-bold text-primary font-mono">
                  {session.salesman.discount_percentage}%
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Close Session Confirmation Modal */}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
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
