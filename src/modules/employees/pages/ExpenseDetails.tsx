import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowRight, Calendar, DollarSign, Wallet, FileText, Download, Receipt, CheckCircle2, XCircle, Clock, Coins, Tag, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { useDisbursementDetails } from "@/hooks/useDisbursements";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

// Status logic based on approval timestamp fields (null = not done, value = done)
const getStatus = (request: any) => {
  if (request.rejected_at) {
    return { key: "rejected", label: "مرفوض", color: "destructive" as const };
  }
  if (request.verified_at) {
    return { key: "approved", label: "تمت الموافقة", color: "success" as const };
  }
  if (request.accepted_at) {
    return { key: "accepted", label: "موافقة أولى", color: "warning" as const };
  }
  return { key: "pending", label: "قيد المراجعة", color: "warning" as const };
};

export default function ExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: request, isLoading, isError } = useDisbursementDetails(id!);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">طلب الصرف غير موجود</h2>
        <Button onClick={() => navigate("/employee-expenses")}>عودة للقائمة</Button>
      </div>
    );
  }

  const status = getStatus(request);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12" dir="rtl">
       {/* Header with Glassmorphism */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-background/60 backdrop-blur-xl p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">تفاصيل طلب الصرف</h2>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground mr-12">
                    <span className="font-mono bg-muted/50 px-3 py-1 rounded-md text-xs border border-border/50 select-all">#{request.id}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                 <Link to="/employee-expenses">
                     <Button variant="outline" className="rounded-xl gap-2 hover:bg-muted/50 transition-colors">
                        <ArrowRight className="h-4 w-4" />
                        العودة
                     </Button>
                 </Link>
            </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Status Banner */}
            <div className={`
                flex items-center gap-4 p-4 rounded-xl border-l-4 shadow-sm transition-all duration-500 hover:shadow-md
                ${status.key === 'approved' ? 'bg-success-light border-l-success text-success-dark border border-success/20' : 
                  status.key === 'rejected' ? 'bg-destructive/10 border-l-destructive text-destructive border border-destructive/20' : 
                  'bg-warning-light border-l-warning text-warning-dark border border-warning/20'}
            `}>
                <div className={`
                    p-2 rounded-full 
                    ${status.key === 'approved' ? 'bg-success/20 text-success' : 
                      status.key === 'rejected' ? 'bg-destructive/20 text-destructive' : 
                      'bg-warning/20 text-warning-dark'}
                `}>
                    {status.key === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : 
                     status.key === 'rejected' ? <XCircle className="w-5 h-5" /> : 
                     <Clock className="w-5 h-5 animate-pulse" />}
                </div>
                <div className="flex-1">
                    <p className="font-bold text-lg">{status.label}</p>
                    <p className="text-sm opacity-90">
                        {status.key === 'pending' ? 'الطلب قيد المراجعة من قبل الإدارة' :
                         status.key === 'partial' ? 'تمت الموافقة الأولى، بانتظار الموافقة الثانية' :
                         status.key === 'approved' ? 'تمت الموافقة على الطلب ويمكن صرفه' : 
                         'تم رفض الطلب، يرجى مراجعة السبب'}
                    </p>
                </div>
            </div>

            {/* Rejection Reason */}
            {request.rejected_reason && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">سبب الرفض:</p>
                  <p className="text-sm">{request.rejected_reason}</p>
                </div>
              </div>
            )}

            {/* Financial Details Card */}
            <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden group">
                <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        التفاصيل المالية
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5 p-4 rounded-xl bg-muted/10 border border-border/50 hover:border-primary/20 transition-colors">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            المبلغ الإجمالي شامل الضريبة
                        </span>
                        <span className="font-bold text-3xl text-primary font-mono tracking-tight">
                            {parseFloat(request.total_cost).toLocaleString()} 
                            <span className="text-sm font-normal text-muted-foreground mr-1">ر.س</span>
                        </span>
                    </div>
                    
                    <div className="space-y-1.5 p-4 rounded-xl bg-muted/10 border border-border/50 hover:border-primary/20 transition-colors">
                         <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            نوع الصرف
                        </span>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="px-3 py-1 text-base bg-background font-medium">
                                {request.type?.name || "غير محدد"}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-1.5 p-4 rounded-xl bg-muted/10 border border-border/50 hover:border-primary/20 transition-colors">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                           <Wallet className="h-4 w-4" />
                           مبلغ العهدة
                        </span>
                        <span className="font-bold text-xl font-mono">
                            {parseFloat(request.custody_amount || "0").toLocaleString()} 
                            <span className="text-sm font-normal text-muted-foreground mr-1">ر.س</span>
                        </span>
                    </div>

                    <div className="space-y-1.5 p-4 rounded-xl bg-muted/10 border border-border/50 hover:border-primary/20 transition-colors">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                           <ExternalLink className="h-4 w-4" />
                           مبلغ التحويل
                        </span>
                        <span className="font-bold text-xl font-mono">
                            {parseFloat(request.transfer_amount || "0").toLocaleString()} 
                            <span className="text-sm font-normal text-muted-foreground mr-1">ر.س</span>
                        </span>
                    </div>
                </CardContent>
            </Card>

             {/* Notes Card */}
             <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        الملاحظات
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="bg-muted/20 p-5 rounded-xl border border-border/50 min-h-[100px]">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base font-normal">
                             {request.notes || "لا توجد ملاحظات"}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
             {/* Date Info */}
             <Card className="shadow-md border-none ring-1 ring-border/50">
                <CardContent className="p-6 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning shadow-inner">
                        <Calendar className="w-6 h-6" />
                     </div>
                     <div className="space-y-0.5">
                        <p className="text-sm text-muted-foreground font-medium">تاريخ الطلب</p>
                        <p className="font-bold text-base text-foreground font-mono">
                             {request.created_at 
                               ? format(new Date(request.created_at), "PPP", { locale: arSA })
                               : "-"}
                        </p>
                     </div>
                </CardContent>
            </Card>

            {/* Sell Order Link */}
            {request.sell_order && (
              <Card className="shadow-md border-none ring-1 ring-border/50">
                <CardContent className="p-6 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center text-info shadow-inner">
                        <ExternalLink className="w-6 h-6" />
                     </div>
                     <div className="space-y-0.5 flex-1">
                        <p className="text-sm text-muted-foreground font-medium">أمر البيع المرتبط</p>
                        <p className="font-bold text-base text-foreground font-mono">#{request.sell_order}</p>
                     </div>
                     <Link to={`/sell-orders/${request.sell_order}`}>
                       <Button variant="ghost" size="sm" className="rounded-lg">
                         عرض
                       </Button>
                     </Link>
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden h-full">
                <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-primary" />
                        المرفقات
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {request.file ? (
                        <div className="space-y-4">
                            <div className="group relative overflow-hidden rounded-xl border border-border shadow-sm transition-all hover:shadow-md hover:border-primary/30">
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                                <div className="p-4 flex items-start gap-4 bg-muted/5">
                                    <div className="bg-white p-2 rounded-lg border shadow-sm">
                                        <Receipt className="h-8 w-8 text-info" />
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <p className="text-sm font-medium truncate text-foreground/90 dir-ltr text-right" title={request.file}>
                                            {request.file.split('/').pop()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <a href={request.file} target="_blank" rel="noopener noreferrer">
                              <Button className="w-full rounded-xl gap-2 shadow-sm" variant="secondary">
                                  <Download className="h-4 w-4" />
                                  تحميل / معاينة
                              </Button>
                            </a>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-60">
                            <div className="bg-muted p-4 rounded-full">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">لا يوجد مستندات مرفقة</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
