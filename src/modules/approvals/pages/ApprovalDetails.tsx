import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  User,
  Hash,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApprovalDetails, useApproveApproval, useRejectApproval } from "@/hooks/useApprovals";
import { ApprovalActionButtons } from "@/modules/approvals/components/ApprovalActionButtons";
import { ApprovalEntityPreview } from "@/modules/approvals/components/ApprovalEntityPreview";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد الانتظار", className: "bg-warning-light text-warning border-warning/20" },
  in_progress: { label: "قيد المعالجة", className: "bg-info-light text-info border-info/20" },
  approved: { label: "تمت الموافقة", className: "bg-success-light text-success border-success/20" },
  rejected: { label: "مرفوض", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function ApprovalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: approval, isLoading } = useApprovalDetails(id!);
  const approveMutation = useApproveApproval();
  const rejectMutation = useRejectApproval();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-lg text-muted-foreground">لم يتم العثور على الموافقة</p>
        <Button variant="outline" onClick={() => navigate("/approvals")}>
          العودة للموافقات
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[approval.status] || STATUS_CONFIG.pending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/approvals">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">موافقة #{approval.id}</h1>
              <Badge variant="outline" className={`${statusConfig.className}`}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{approval.workflow_name}</p>
          </div>
        </div>

        {(approval.status === "pending" || approval.status === "in_progress") && (
          <div className="flex gap-2">
            <ApprovalActionButtons
              onApprove={() => approveMutation.mutate(approval.id)}
              onReject={(comment) => rejectMutation.mutate({ id: approval.id, comment })}
              isProcessing={approveMutation.isPending || rejectMutation.isPending}
              status={approval.status}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approval Info Card */}
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                بيانات الموافقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem icon={Hash} label="رقم الموافقة" value={`#${approval.id}`} />
                <InfoItem icon={ClipboardCheck} label="سير العمل" value={approval.workflow_name} />
                <InfoItem icon={Hash} label="نوع الطلب" value={approval.content_type_label} />
                <InfoItem icon={Hash} label="رقم العنصر" value={`#${approval.object_id}`} />
              </div>
            </CardContent>
          </Card>

          {/* Entity Details */}
          <ApprovalEntityPreview
            contentTypeLabel={approval.content_type_label}
            objectId={approval.object_id}
          />

          {/* Current Step */}
          {approval.current_step && (
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-warning" />
                  الخطوة الحالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoItem icon={ClipboardCheck} label="اسم الخطوة" value={approval.current_step.name} />
                  <InfoItem icon={Hash} label="الترتيب" value={`#${approval.current_step.order}`} />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <CheckCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">مطلوبة</span>
                      <span className="font-medium text-sm">
                        {approval.current_step.is_required ? "نعم" : "لا"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions Timeline */}
          {approval.actions && approval.actions.length > 0 && (
            <Card className="border-none shadow-sm ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-info" />
                  سجل الإجراءات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {approval.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 border border-border/40"
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          action.action === "approved"
                            ? "bg-success-light text-success"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {action.action === "approved" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm">
                            {action.action === "approved" ? "تمت الموافقة" : "تم الرفض"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono" dir="ltr">
                            {format(new Date(action.created_at), "PPP p", { locale: arSA })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{action.performed_by_name}</span>
                        </div>
                        {action.comment && (
                          <p className="mt-2 text-sm text-muted-foreground bg-background p-3 rounded-lg border border-dashed">
                            {action.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border/50">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">تاريخ الإنشاء</span>
                  <span className="font-medium">
                    {format(new Date(approval.created_at), "PPP", { locale: arSA })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">آخر تحديث</span>
                  <span className="font-medium">
                    {format(new Date(approval.updated_at), "PPP p", { locale: arSA })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm pt-4 border-t border-dashed">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  approval.status === "approved" ? "bg-success-light" : 
                  approval.status === "rejected" ? "bg-destructive/10" : 
                  approval.status === "in_progress" ? "bg-info-light" : "bg-warning-light"
                }`}>
                  {approval.status === "approved" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : approval.status === "rejected" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : approval.status === "in_progress" ? (
                    <Clock className="h-4 w-4 text-info" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div className="flex flex-col mr-auto items-end flex-1">
                  <span className="text-xs text-muted-foreground mb-1">حالة الطلب</span>
                  <Badge variant="outline" className={`px-2 ${statusConfig.className}`}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <span className="font-medium text-sm">{value}</span>
      </div>
    </div>
  );
}
