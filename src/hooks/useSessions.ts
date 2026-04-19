import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { PaginatedResponse, Session } from "@/types";

export const sessionKeys = {
  all: ["sessions"] as const,
  list: () => [...sessionKeys.all, "list"] as const,
  detail: (id: string | number) => [...sessionKeys.all, "detail", id] as const,
};

interface SessionFilters {
  page?: number;
  page_size?: number;
}

export function useSessionList(filters: SessionFilters = {}) {
  return useQuery({
    queryKey: [...sessionKeys.list(), filters],
    queryFn: async (): Promise<PaginatedResponse<Session>> => {
      const params = new URLSearchParams();
      params.append("page", (filters.page || 1).toString());
      params.append("page_size", (filters.page_size || 10).toString());
      
      const response = await api.get(`${API_ENDPOINTS.SESSIONS.LIST}?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSessionDetails(id: string | number) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: async (): Promise<Session> => {
      const response = await api.get(API_ENDPOINTS.SESSIONS.DETAILS(id));
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCloseSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const response = await api.post(API_ENDPOINTS.SESSIONS.CLOSE(id));
      return response.data;
    },
    onSuccess: () => {
      // Invalidate ALL session queries (list with any filters + details)
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}
