import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Loader2, AlertCircle, FileText, Calendar, User, BadgeDollarSign, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { usePOPaymentRequestDetails, useMarkPOPaymentDone } from "@/hooks/usePaymentRequests";
import { usePurchaseOrderDetails } from "@/hooks/usePurchaseOrders";
import {
  purchaseOrderLinkLabel,
  supplierDisplayForPoPayment,
} from "@/hooks/useLinkedEntitiesForPaymentRequests";
import { parseBackendError } from "@/lib/utils";
import { MarkPaymentTransferDialog } from "@/modules/payment_requests/components/MarkPaymentTransferDialog";
import { useCan } from "@/hooks/usePermissions";

function statusBadgeVariant(status: string): "secondary" | "success" | "destructive" | "warning" {
  const s = (status || "").toUpperCase();
  if (s.includes("PENDING")) return "warning";
  if (s.includes("DONE") || s.includes("APPROV") || s.includes("PAID")) return "success";
  if (s.includes("REJECT") || s.includes("CANCEL")) return "destructive";
  return "secondary";
}

function statusLabel(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "قيد الانتظار";
  if (s === "DONE") return "تم التحويل";
  return status;
}

export default function POPaymentRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePOPaymentRequestDetails(id || "");
  const { data: poDetail } = usePurchaseOrderDetails(data?.purchase_order ?? "");
  const markDone = useMarkPOPaymentDone();
  const { can } = useCan();
  const [markDialogOpen, setMarkDialogOpen] = useState(false);

  const handleConfirmMarkDone = (source_account: number) => {
    if (!id) return;
    markDone.mutate(
      { id, source_account },
      {
        onSuccess: () => {
          toast.success("تم تحديث حالة الطلب بنجاح");
          setMarkDialogOpen(false);
        },
        onError: (err) => toast.error(parseBackendError(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل تفاصيل طلب الدفع...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4 animate-in fade-in zoom-in-50 duration-300">
        <div className="bg-destructive/10 p-6 rounded-full"><AlertCircle className="h-10 w-10 text-destructive" /></div>
        <h2 className="text-2xl font-bold tracking-tight">طلب الدفع غير موجود</h2>
        <p className="text-muted-foreground max-w-sm">لم يتم العثور على طلب الدفع المحدد.</p>
        <Button onClick={() => navigate("/payment-requests")} variant="outline" className="rounded-xl min-w-[150px]">العودة للقائمة</Button>
      </div>
    );
  }

  const isPending = (data.status || "").toUpperCase() === "PENDING";
  const poLinkText = purchaseOrderLinkLabel(data.purchase_order);
  const supplierLabel = supplierDisplayForPoPayment(data, poDetail);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/payment-requests")} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">طلب دفع شراء #{data.id}</h1>
              <Badge variant={statusBadgeVariant(data.status)}>{statusLabel(data.status)}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 min-w-0">
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <Link
                to={`/purchase-orders/${data.purchase_order}`}
                className="text-primary hover:underline font-medium truncate"
                title={poLinkText}
              >
                {poLinkText}
              </Link>
            </p>
          </div>
        </div>
        {isPending && can("payment_requests.mark_done") && (
          <Button
            type="button"
            onClick={() => setMarkDialogOpen(true)}
            disabled={markDone.isPending}
            className="gap-2 rounded-xl shadow-lg shadow-success/20 bg-success hover:bg-success/90 text-white"
          >
            <CheckCircle className="h-4 w-4" />
            تم التحويل
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary"><BadgeDollarSign className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">المبلغ</span></div>
                <p className="text-3xl font-bold text-primary font-mono tracking-tight">{parseFloat(data.amount || "0").toLocaleString()} <span className="text-sm font-normal opacity-70">ر.س</span></p>
              </div>
            </CardContent>
          </Card>

          {data.notes && (
            <Card className="shadow-sm border-none ring-1 ring-border/50">
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> ملاحظات</CardTitle></CardHeader>
              <CardContent><p className="text-muted-foreground whitespace-pre-wrap wrap-break-word">{data.notes}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader><CardTitle className="text-lg">معلومات الطلب</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="text-muted-foreground flex items-center gap-2 shrink-0"><ShoppingCart className="h-4 w-4" /> طلب الشراء</span>
                <Link
                  to={`/purchase-orders/${data.purchase_order}`}
                  className="text-primary hover:underline text-sm font-medium text-end truncate min-w-0"
                  title={poLinkText}
                >
                  {poLinkText}
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> المورد</span>
                <span className="text-sm font-medium">{supplierLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" /> حساب المصدر</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {data.source_account && data.source_account > 0
                    ? `#${data.source_account}`
                    : "—"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> المنشئ</span>
                <span className="font-mono text-xs">
                  {data.created_by != null ? `#${data.created_by}` : "—"}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> تاريخ الإنشاء</span>
                <span className="text-sm font-mono">{data.created_at ? new Date(data.created_at).toLocaleString("ar-SA") : "-"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> آخر تحديث</span>
                <span className="text-sm font-mono">{data.updated_at ? new Date(data.updated_at).toLocaleString("ar-SA") : "-"}</span>
              </div>
            </CardContent>
          </Card>
          <Link to="/payment-requests"><Button variant="outline" className="w-full rounded-xl">العودة للقائمة</Button></Link>
        </div>
      </div>

      <MarkPaymentTransferDialog
        open={markDialogOpen}
        onOpenChange={setMarkDialogOpen}
        onConfirm={handleConfirmMarkDone}
        isSubmitting={markDone.isPending}
      />
    </div>
  );
}
