import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { StorageArea, PaginatedResponse } from "@/types";

interface StorageAreasParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export function useStorageAreas(params: StorageAreasParams) {
  return useQuery({
    queryKey: ["storage-areas", params],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<StorageArea>>(API_ENDPOINTS.STORAGE_AREAS.LIST, {
        params,
      });
      return response.data;
    },
  });
}

export function useStorageAreaDetails(id: number) {
  return useQuery({
    queryKey: ["storage-area", id],
    queryFn: async () => {
      const response = await api.get<StorageArea>(API_ENDPOINTS.STORAGE_AREAS.DETAILS(id));
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateStorageArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await api.post<StorageArea>(API_ENDPOINTS.STORAGE_AREAS.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-areas"] });
    },
  });
}

export function useUpdateStorageArea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      const response = await api.patch<StorageArea>(API_ENDPOINTS.STORAGE_AREAS.UPDATE(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage-areas"] });
      queryClient.invalidateQueries({ queryKey: ["storage-area"] });
    },
  });
}

export function useDeleteStorageArea() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(API_ENDPOINTS.STORAGE_AREAS.DELETE(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["storage-areas"] });
        }
    });
}
