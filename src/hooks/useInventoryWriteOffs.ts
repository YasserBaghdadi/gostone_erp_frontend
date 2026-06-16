import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { itemKeys } from "@/lib/queryKeys";
import type { PaginatedResponse } from "@/types";

export interface InventoryWriteOff {
  id: number;
  item: number;
  item_name: string;
  storage_area: number;
  storage_area_name: string;
  quantity: string;
  unit_name: string;
  reason: string;
  reason_display: string;
  note: string;
  created_at: string;
  created_by: number | null;
  created_by_name: string;
}

export function useInventoryWriteOffs(): UseQueryResult<
  PaginatedResponse<InventoryWriteOff>,
  Error
> {
  return useQuery({
    queryKey: ["inventory-write-offs"],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<InventoryWriteOff>>(
          `${API_ENDPOINTS.INVENTORY_WRITE_OFFS.LIST}?page_size=50`,
        )
      ).data,
  });
}

export interface CreateInventoryWriteOffData {
  item: number;
  storage_area: number;
  quantity: string;
  reason: string;
  note?: string;
}

export function useCreateInventoryWriteOff(): UseMutationResult<
  InventoryWriteOff,
  Error,
  CreateInventoryWriteOffData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post<InventoryWriteOff>(API_ENDPOINTS.INVENTORY_WRITE_OFFS.CREATE, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-write-offs"] });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
