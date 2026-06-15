import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { itemKeys } from "@/lib/queryKeys";
import type { Item, PaginatedResponse } from "@/types";

interface UseItemsParams {
  page?: number;
  search?: string;
  page_size?: number;
  is_sellable?: boolean;
  is_purchable?: boolean;
  ordering?: string; // e.g., 'name', '-name', 'unit_price', '-unit_price'
  /** عند التمرير، تقتصر النتائج على أصناف هذا المورد */
  supplier?: number;
  /** تصفية حسب نوع الإنتاج: 'ready' (جاهزة) أو 'custom' (تفصيل) */
  production_type?: string;
  /** قصر النتائج على مجموعة معرّفات (CSV)، مثل "1,2" */
  id__in?: string;
}

export function useItems(params: UseItemsParams = {}) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Item>>(
        API_ENDPOINTS.ITEMS.LIST,
        {
          params,
        },
      );
      return data;
    },
  });
}

export function useItemDetails(id: string | number) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Item>(API_ENDPOINTS.ITEMS.DETAILS(id));
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemData: Partial<Item>) => {
      const { data } = await api.post<Item>(
        API_ENDPOINTS.ITEMS.CREATE,
        itemData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data: itemData,
    }: {
      id: string | number;
      data: Partial<Item>;
    }) => {
      const { data } = await api.patch<Item>(
        API_ENDPOINTS.ITEMS.UPDATE(id),
        itemData,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(API_ENDPOINTS.ITEMS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
