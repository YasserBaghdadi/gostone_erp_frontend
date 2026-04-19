import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { PaginatedResponse, DisbursementRequest, DisbursementType } from "@/types";

export const disbursementKeys = {
  all: ["disbursements"] as const,
  list: () => [...disbursementKeys.all, "list"] as const,
  detail: (id: string | number) => [...disbursementKeys.all, "detail", id] as const,
  types: () => [...disbursementKeys.all, "types"] as const,
};

interface DisbursementFilters {
  page?: number;
  page_size?: number;
  is_accepted?: boolean;
  is_rejected?: boolean;
  is_verified?: boolean;
}

export function useDisbursementTypes() {
  return useQuery({
    queryKey: disbursementKeys.types(),
    queryFn: async (): Promise<DisbursementType[]> => {
      const response = await api.get(API_ENDPOINTS.DISBURSEMENT_TYPES.LIST);
      return response.data.results || response.data;
    },
  });
}

export function useDisbursementList(filters: DisbursementFilters = {}) {
  return useQuery({
    queryKey: [...disbursementKeys.list(), filters],
    queryFn: async (): Promise<PaginatedResponse<DisbursementRequest>> => {
      const params = new URLSearchParams();
      params.append("page", (filters.page || 1).toString());
      params.append("page_size", (filters.page_size || 10).toString());
      if (filters.is_accepted !== undefined) params.append('is_accepted', filters.is_accepted.toString());
      if (filters.is_rejected !== undefined) params.append('is_rejected', filters.is_rejected.toString());
      if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());

      const response = await api.get(
        `${API_ENDPOINTS.DISBURSEMENT_REQUESTS.LIST}?${params.toString()}`
      );
      
      // Transform response to ensure consistent approval flags
      const results = response.data.results.map((item: any) => ({
        ...item,
        is_accepted: item.is_accepted ?? !!item.accepted_by1,
        is_verified: item.is_verified ?? !!item.accepted_by2,
        is_rejected: item.is_rejected ?? !!item.rejected_by,
      }));

      return { ...response.data, results };
    },
  });
}

export function useDisbursementDetails(id: string | number) {
  return useQuery({
    queryKey: disbursementKeys.detail(id),
    queryFn: async (): Promise<DisbursementRequest> => {
      const response = await api.get(API_ENDPOINTS.DISBURSEMENT_REQUESTS.DETAILS(id));
      const item = response.data;
      return {
        ...item,
        is_accepted: item.is_accepted ?? !!item.accepted_by1,
        is_verified: item.is_verified ?? !!item.accepted_by2,
        is_rejected: item.is_rejected ?? !!item.rejected_by,
      };
    },
    enabled: !!id,
  });
}

interface CreateDisbursementPayload {
  notes?: string;
  custody_amount: string;
  transfer_amount: string;
  type_id: number;
  sell_order_id?: number;
  file?: string | File;
}

export function useCreateDisbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDisbursementPayload | FormData) => {
      const response = await api.post(API_ENDPOINTS.DISBURSEMENT_REQUESTS.CREATE, data, {
        headers: {
          // If data is FormData, let browser set Content-Type with boundary
          ...(data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {}),
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disbursementKeys.list() });
    },
  });
}
