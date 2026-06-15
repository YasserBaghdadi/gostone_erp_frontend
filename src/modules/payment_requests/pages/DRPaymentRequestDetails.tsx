import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Receipt, Loader2, AlertCircle, FileText, Calendar, User, BadgeDollarSign, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useDRPaymentRequestDetails, useMarkDRPaymentDone } from "@/hooks/usePaymentRequests";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { Account, Employee } from "@/types";
import { parseBackendError } from "@/lib/utils";
import { MarkPaymentTransferDialog } from "@/modules/payment_requests/components/MarkPaymentTransferDialog";
import { useCan } from "@/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function approvalStatusLabel(s: string) {
  const map: Record<string, string> = {
    waiting_for_missing_data: "بانتظار بيانات",
    pending_approval: "بانتظار الموافقة",
    approved: "تمت الموافقة",
    rejected: "مرفوض",
  };
  return map[s] || s;
}

export default function DRPaymentRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDRPaymentRequestDetails(id || "");
  const markDone = useMarkDRPaymentDone();
  const { can } = useCan();
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [actualAmount, setActualAmount] = useState("");
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<number | null>(null);

  // Fetch source account name — fail silently on 404
  const sourceAccountId = data?.source_account && data.source_account > 0 ? data.source_account : 0;
  const { data: accountData } = useQuery<Account>({
    queryKey: ["accounts", "detail", sourceAccountId],
    queryFn: async () => { const { data } = await api.get(`/custom-v1/accounts/${sourceAccountId}/`); return data; },
    enabled: !!sourceAccountId,
    throwOnError: false,
    retry: false,
  });

  // Fetch creator employee name — fail silently on 404
  const createdById = data?.created_by != null && data.created_by > 0 ? data.created_by : 0;
  const { data: creatorData } = useQuery<Employee>({
    queryKey: ["employees", "detail", createdById],
    queryFn: async () => { const { data } = await api.get(API_ENDPOINTS.EMPLOYEES.DETAILS(createdById)); return data; },
    enabled: !!createdById,
    throwOnError: false,
    retry: false,
  });

  // Resolve names: prefer backend fields, fallback to fetched data
  const sourceAccountName = data?.source_account_name || accountData?.name || null;
  const creatorName = data?.created_by_name || (creatorData ? `${creatorData.first_name} ${creatorData.last_name}`.trim() : null);

  const handleOpenMarkDialog = () => {
    setActualAmount(data?.final_amount || data?.amount || "");
    setMarkDialogOpen(true);
  };

  const handleConfirmMarkDone = (source_account: number) => {
    if (!id) return;
    setSelectedSourceAccount(source_account);
  };

  const handleFinalConfirm = () => {
    if (!id || !selectedSourceAccount) return;
    markDone.mutate(
      { id, source_account: selectedSourceAccount, actual_amount: actualAmount },
      {
        onSuccess: () => {
          toast.success("تم تحديث حالة الطلب بنجاح");
          setMarkDialogOpen(false);
          setSelectedSourceAccount(null);
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/payment-requests")} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">طلب دفع صرف #{data.id}</h1>
              <Badge variant={statusBadgeVariant(data.status)}>{statusLabel(data.status)}</Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2 min-w-0">
              <Receipt className="h-4 w-4 shrink-0" />
              <span className="text-sm">{data.disbursement_type_name || "—"}</span>
              {data.disbursement_request > 0 && (
                <span className="text-xs font-mono text-muted-foreground">· طلب صرف #{data.disbursement_request}</span>
              )}
            </p>
          </div>
        </div>
        {isPending && can("payment_requests.mark_done") && (
          <Button
            type="button"
            onClick={handleOpenMarkDialog}
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
          {/* Amount Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary"><BadgeDollarSign className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">المبلغ</span></div>
                  <p className="text-3xl font-bold text-primary font-mono tracking-tight">{parseFloat(data.amount || "0").toLocaleString()} <span className="text-sm font-normal opacity-70">ر.س</span></p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-linear-to-br from-violet-500/5 to-transparent border-violet-500/20 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400"><BadgeDollarSign className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-wider">المبلغ النهائي</span></div>
                  <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 font-mono tracking-tight">{parseFloat(data.final_amount || "0").toLocaleString()} <span className="text-sm font-normal opacity-70">ر.س</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Receipt className="h-4 w-4" /> طلب الصرف</span>
                {data.disbursement_request > 0 ? (
                  <Link to={`/employee-expenses/${data.disbursement_request}`} className="text-sm font-medium text-primary hover:underline transition-colors">
                    طلب صرف #{data.disbursement_request}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> نوع الصرف</span>
                <span className="text-sm font-medium">{data.disbursement_type_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><CreditCardIcon className="h-4 w-4" /> طريقة الدفع</span>
                <span className="text-sm font-medium">{data.payment_method || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><BadgeDollarSign className="h-4 w-4" /> حساب المصدر</span>
                {data.source_account && data.source_account > 0 ? (
                  <Link to={`/accounts/${data.source_account}`} className="text-sm font-medium text-primary hover:underline transition-colors">
                    {sourceAccountName || `حساب #${data.source_account}`}
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">حالة الموافقة</span>
                <Badge variant="secondary" className="text-xs">{approvalStatusLabel(data.approval_status)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4" /> المنشئ</span>
                <span className="text-sm font-medium">
                  {data.created_by != null ? (creatorName || `#${data.created_by}`) : "—"}
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

      {/* Mark Done flow: first select source account, then enter actual amount */}
      {!selectedSourceAccount ? (
        <MarkPaymentTransferDialog
          open={markDialogOpen}
          onOpenChange={(open) => { setMarkDialogOpen(open); if (!open) setSelectedSourceAccount(null); }}
          onConfirm={handleConfirmMarkDone}
          isSubmitting={false}
        />
      ) : (
        <Dialog open={markDialogOpen} onOpenChange={(open) => { setMarkDialogOpen(open); if (!open) setSelectedSourceAccount(null); }}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>تأكيد المبلغ الفعلي</DialogTitle>
              <DialogDescription>أدخل المبلغ الفعلي الذي تم تحويله.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              <Label>المبلغ الفعلي</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={actualAmount}
                onChange={(e) => setActualAmount(e.target.value)}
                className="font-mono"
                placeholder="0.00"
              />
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:justify-start">
              <Button variant="outline" onClick={() => { setSelectedSourceAccount(null); }}>رجوع</Button>
              <Button
                className="bg-success text-white hover:bg-success/90"
                disabled={!actualAmount || parseFloat(actualAmount) <= 0 || markDone.isPending}
                onClick={handleFinalConfirm}
              >
                {markDone.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                تأكيد التحويل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}
