import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  ClipboardCheck,
} from "lucide-react";

import { useApprovals, useApproveApproval, useRejectApproval } from "@/hooks/useApprovals";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { ApprovalsFilter, type ApprovalFilterStatus } from "@/modules/approvals/components/ApprovalsFilter";
import { ApprovalActionButtons } from "@/modules/approvals/components/ApprovalActionButtons";
import type { Approval } from "@/types";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "قيد الانتظار", className: "bg-warning-light text-warning border-warning/20" },
  in_progress: { label: "قيد المعالجة", className: "bg-info-light text-info border-info/20" },
  approved: { label: "تمت الموافقة", className: "bg-success-light text-success border-success/20" },
  rejected: { label: "مرفوض", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function ApprovalsPage() {
  const [filterStatus, setFilterStatus] = useState<ApprovalFilterStatus>("pending");
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const { data, isLoading } = useApprovals({
    page,
    page_size: pageSize,
    status: filterStatus,
  });

  const approveMutation = useApproveApproval();
  const rejectMutation = useRejectApproval();

  const totalCount = data?.count || 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  const handleFilterChange = (newFilter: ApprovalFilterStatus) => {
    setFilterStatus(newFilter);
    setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الموافقات</h1>
          <p className="text-muted-foreground mt-1">متابعة واعتماد الطلبات والعمليات المعلقة</p>
        </div>

        <ApprovalsFilter
          currentFilter={filterStatus}
          onFilterChange={handleFilterChange}
          totalCount={data?.count}
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState />
      ) : !data?.results?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.results.map((item) => (
            <ApprovalCard
              key={item.id}
              approval={item}
              onApprove={() => approveMutation.mutate(item.id)}
              onReject={(comment) => rejectMutation.mutate({ id: item.id, comment })}
              isProcessing={approveMutation.isPending || rejectMutation.isPending}
            />
          ))}
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

// --- Sub-components ---

interface ApprovalCardProps {
  approval: Approval;
  onApprove: () => void;
  onReject: (comment?: string) => void;
  isProcessing: boolean;
}

function ApprovalCard({ approval, onApprove, onReject, isProcessing }: ApprovalCardProps) {
  const badge = STATUS_BADGE[approval.status] || STATUS_BADGE.pending;

  return (
    <div className="group flex flex-col bg-card border rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden relative">
      {/* Top Accent */}
      <div className={`h-1.5 w-full ${approval.status === 'rejected' ? 'bg-destructive' : approval.status === 'approved' ? 'bg-success' : approval.status === 'in_progress' ? 'bg-info' : 'bg-warning'}`} />

      <div className="p-5 flex flex-col h-full gap-5">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl shadow-sm bg-primary/10 text-primary ring-1 ring-inset ring-black/5">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-foreground tracking-tight">#{approval.id}</h3>
                <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${badge.className}`}>
                  {badge.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className="font-medium font-mono" dir="ltr">
                  {new Date(approval.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-4 flex-1 content-start py-1">
          <DetailField label="سير العمل" value={approval.workflow_name} />
          <DetailField label="نوع الطلب" value={approval.content_type_label} />
          <DetailField label="الخطوة الحالية" value={approval.current_step?.name || "-"} />
          <DetailField label="رقم العنصر" value={`#${approval.object_id}`} />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t flex flex-col gap-3">
          {(approval.status === "pending" || approval.status === "in_progress") && (
            <ApprovalActionButtons
              onApprove={onApprove}
              onReject={onReject}
              isProcessing={isProcessing}
              status={approval.status}
            />
          )}

          <Link to={`/approvals/${approval.id}`} className="w-full">
            <Button variant="ghost" className="w-full h-8 text-xs text-muted-foreground hover:text-foreground group-hover:bg-muted/50">
              عرض كامل التفاصيل
              <FileText className="h-3 w-3 mr-2 opacity-50" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground leading-snug break-words">
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 rounded-xl bg-muted/20 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/5">
      <div className="p-4 rounded-full bg-muted/20 mb-4">
        <FileText className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold">لا يوجد عناصر</h3>
      <p className="text-muted-foreground text-sm mt-1">لا توجد طلبات في هذه القائمة حالياً</p>
    </div>
  );
}
