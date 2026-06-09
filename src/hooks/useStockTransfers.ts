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
import type { StockTransfer, PaginatedResponse } from "@/types";

export function useStockTransfers(): UseQueryResult<PaginatedResponse<StockTransfer>, Error> {
  return useQuery({
    queryKey: ["stock-transfers"],
    queryFn: async () =>
      (
        await api.get<PaginatedResponse<StockTransfer>>(
          `${API_ENDPOINTS.STOCK_TRANSFERS.LIST}?page_size=50`,
        )
      ).data,
  });
}

export interface CreateStockTransferData {
  item: number;
  from_storage_area: number;
  to_storage_area: number;
  quantity: string;
  unit_name?: string;
  note?: string;
}

export function useCreateStockTransfer(): UseMutationResult<
  StockTransfer,
  Error,
  CreateStockTransferData
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post<StockTransfer>(API_ENDPOINTS.STOCK_TRANSFERS.CREATE, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-transfers"] });
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}
