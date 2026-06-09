import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { productionResponsibleKeys } from "@/lib/queryKeys";
import type { ProductionResponsible, PaginatedResponse } from "@/types";

/** قائمة مسؤولي التصنيع (مرتّبة من الـ API). نفرّغ `.results`. */
export function useProductionResponsibles(): UseQueryResult<ProductionResponsible[], Error> {
  return useQuery({
    queryKey: productionResponsibleKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ProductionResponsible>>(
        `${API_ENDPOINTS.PRODUCTION_RESPONSIBLES.LIST}?page_size=200`,
      );
      return data.results;
    },
  });
}

export function useCreateProductionResponsible(): UseMutationResult<
  ProductionResponsible,
  Error,
  { name: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post(API_ENDPOINTS.PRODUCTION_RESPONSIBLES.CREATE, payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productionResponsibleKeys.lists() }),
  });
}
