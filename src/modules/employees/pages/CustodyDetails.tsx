import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, User, Banknote, Calendar, FileText, CheckCircle, XCircle, Edit } from "lucide-react";
import { useCustodyDetails } from "@/hooks/useCustody";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "قيد المراجعة", color: "warning" },
  ACCEPTED: { label: "تمت الموافقة", color: "success" },
  REJECTED: { label: "مرفوض", color: "destructive" },
};

export default function CustodyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: request, isLoading, isError } = useCustodyDetails(id!);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-destructive">
        <p>فشل تحميل البيانات أو الطلب غير موجود</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/custody")}>
          عودة للقائمة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/custody")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              تفاصيل طلب العهد #{request.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              عرض تفاصيل طلب العهد المالية
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center w-full md:w-auto">
            <Link to={`/custody/${request.id}/edit`}>
                <Button variant="outline" className="gap-2 rounded-xl">
                    <Edit className="h-4 w-4" />
                    تعديل
                </Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              بيانات الطلب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">اسم الموظف</span>
              <span className="font-medium">{request.custodian_user || "غير محدد"}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">الحالة</span>
              <Badge variant={STATUS_LABELS[request.status]?.color as any}>
                {STATUS_LABELS[request.status]?.label || request.status}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">المبلغ</span>
              <span className="font-bold text-lg text-success">
                {parseFloat(request.amount).toLocaleString()} ر.س
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">تاريخ الحاجة</span>
              <span className="font-medium">
                {request.needed_by
                  ? format(new Date(request.needed_by), "PPP", { locale: arSA })
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">تاريخ الإنشاء</span>
              <span className="font-medium">
                {request.created_at
                  ? format(new Date(request.created_at), "PPP", { locale: arSA })
                  : "-"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              تفاصيل الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">نقدي</span>
              {request.is_cash ? (
                  <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">تحويل بنكي</span>
              {request.is_bank ? (
                  <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">فاتورة ضريبية</span>
              {request.have_tax_invoice ? (
                  <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground/30" />
              )}
            </div>
            {request.sell_order && (
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">أمر البيع</span>
                <Link to={`/sell-orders/${request.sell_order}`} className="text-primary hover:underline">
                  #{request.sell_order}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Explanation */}
        {request.explanation && (
          <Card className="border-border/50 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                التفسير / التوضيح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{request.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Approval Info */}
        <Card className="border-border/50 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              حالة الموافقات
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-medium">
                {request.accepted_at ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground/30" />
                )}
                موافقة المستوى الأول (القبول)
              </div>
              {request.accepted_by && (
                <p className="text-sm text-muted-foreground">
                  بواسطة: {request.accepted_by}
                </p>
              )}
            </div>
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-medium">
                {request.verified_at ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground/30" />
                )}
                موافقة المستوى الثاني (التعميد)
              </div>
              {request.verified_by && (
                <p className="text-sm text-muted-foreground">
                  بواسطة: {request.verified_by}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
