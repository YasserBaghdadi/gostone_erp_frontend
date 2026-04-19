import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { approvalKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import type { Approval, ApprovalDetails, ApprovalStatus } from "@/types";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface ApprovalListParams {
  page?: number;
  page_size?: number;
  status?: ApprovalStatus;
}

// =====================
// List Approvals
// =====================
export function useApprovals(params: ApprovalListParams = {}) {
  return useQuery({
    queryKey: approvalKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Approval>>(
        API_ENDPOINTS.APPROVALS.LIST,
        { params }
      );
      return data;
    },
  });
}

// =====================
// Approval Details
// =====================
export function useApprovalDetails(id: string | number) {
  return useQuery({
    queryKey: approvalKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<ApprovalDetails>(
        API_ENDPOINTS.APPROVALS.DETAILS(id)
      );
      return data;
    },
    enabled: !!id,
  });
}

// =====================
// Approve Mutation
// =====================
export function useApproveApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number) => {
      const { data } = await api.post(API_ENDPOINTS.APPROVALS.APPROVE(id));
      return data;
    },
    onSuccess: () => {
      toast.success("تمت الموافقة بنجاح");
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
    onError: (error) => {
      toast.error(parseBackendError(error) || "حدث خطأ أثناء الموافقة");
    },
  });
}

// =====================
// Reject Mutation
// =====================
export function useRejectApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, comment }: { id: string | number; comment?: string }) => {
      const { data } = await api.post(API_ENDPOINTS.APPROVALS.REJECT(id), { comment });
      return data;
    },
    onSuccess: () => {
      toast.success("تم الرفض بنجاح");
      queryClient.invalidateQueries({ queryKey: approvalKeys.all });
    },
    onError: (error) => {
      toast.error(parseBackendError(error) || "حدث خطأ أثناء الرفض");
    },
  });
}
