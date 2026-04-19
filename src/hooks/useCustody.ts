
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { PaginatedResponse, CustodyRequest } from "@/types";

export const custodyKeys = {
  all: ["custody"] as const,
  list: () => [...custodyKeys.all, "list"] as const,
  detail: (id: string | number) => [...custodyKeys.all, "detail", id] as const,
};

interface CustodyFilters {
  page?: number;
  page_size?: number;
  is_accepted?: boolean;
  is_rejected?: boolean;
  is_verified?: boolean;
}

export function useCustodyList(filters: CustodyFilters = {}) {
  return useQuery({
    queryKey: [...custodyKeys.list(), filters],
    queryFn: async (): Promise<PaginatedResponse<CustodyRequest>> => {
      const params = new URLSearchParams();
      params.append("page", (filters.page || 1).toString());
      params.append("page_size", (filters.page_size || 10).toString());
      
      if (filters.is_accepted !== undefined) params.append('is_accepted', filters.is_accepted.toString());
      if (filters.is_rejected !== undefined) params.append('is_rejected', filters.is_rejected.toString());
      if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());

      const response = await api.get(
        `${API_ENDPOINTS.CUSTODY.LIST}?${params.toString()}`
      );
      
      // Transform response
      const results = response.data.results.map((item: any) => ({
        ...item,
        is_accepted: item.is_accepted ?? !!item.is_accepted_level1,
        is_verified: item.is_verified ?? !!item.is_accepted_level2,
        is_rejected: item.is_rejected ?? (item.status === 'REJECTED'),
      }));

      return { ...response.data, results };
    },
  });
}

export function useCustodyDetails(id: string) {
  return useQuery({
    queryKey: custodyKeys.detail(id),
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.CUSTODY.DETAILS(id));
      const item = response.data;
      return {
        ...item,
        is_accepted: item.is_accepted ?? !!item.is_accepted_level1,
        is_verified: item.is_verified ?? !!item.is_accepted_level2,
        is_rejected: item.is_rejected ?? (item.status === 'REJECTED'),
      };
    },
    enabled: !!id,
  });
}

export function useCreateCustody() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(API_ENDPOINTS.CUSTODY.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: custodyKeys.list() });
    },
  });
}

export function useUpdateCustody() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(API_ENDPOINTS.CUSTODY.UPDATE(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: custodyKeys.list() });
    },
  });
}
