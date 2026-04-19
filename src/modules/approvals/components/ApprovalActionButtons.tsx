import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ApprovalActionButtonsProps {
  onApprove: () => void;
  onReject: (comment?: string) => void;
  isProcessing?: boolean;
  status: string;
}

export function ApprovalActionButtons({
  onApprove,
  onReject,
  isProcessing,
  status,
}: ApprovalActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");

  if (status === "rejected") return <span className="text-sm font-medium text-destructive">مرفوض</span>;
  if (status === "approved") return <span className="text-sm font-medium text-success">تمت الموافقة</span>;

  const handleConfirmApprove = () => {
    onApprove();
    setConfirmAction(null);
  };

  const handleRejectWithComment = () => {
    onReject(rejectionComment || undefined);
    setIsRejectOpen(false);
    setRejectionComment("");
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Approve Button */}
        <Button
          size="sm"
          onClick={() => setConfirmAction("approve")}
          disabled={isProcessing}
          className="bg-success hover:bg-success-dark text-success-foreground gap-1.5 h-8 w-full"
        >
          {isProcessing && confirmAction === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">موافقة</span>
        </Button>

        {/* Reject Button */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsRejectOpen(true)}
          disabled={isProcessing}
          className="text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5 h-8 w-full"
        >
          {isProcessing && isRejectOpen ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          <span className="text-xs">رفض</span>
        </Button>
      </div>

      {/* Confirm Approve Modal */}
      <ConfirmModal
        isOpen={confirmAction === "approve"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirmApprove}
        title="تأكيد الموافقة"
        description="هل أنت متأكد من الموافقة على هذا الطلب؟"
        confirmText="موافقة"
        variant="success"
        isLoading={isProcessing}
      />

      {/* Rejection Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[425px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الرفض</DialogTitle>
            <DialogDescription>
              الرجاء ذكر سبب رفض الطلب (اختياري)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">سبب الرفض</Label>
              <Textarea
                id="reason"
                placeholder="اكتب سبب الرفض هنا..."
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
                إلغاء
              </Button>
              <Button variant="destructive" onClick={handleRejectWithComment} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                تأكيد الرفض
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
