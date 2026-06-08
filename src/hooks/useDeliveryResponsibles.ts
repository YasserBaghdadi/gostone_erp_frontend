import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { deliveryResponsibleKeys } from "@/lib/queryKeys";
import type { DeliveryResponsible, PaginatedResponse } from "@/types";

/** قائمة مسؤولي التسليم (مرتّبة من الـ API). نفرّغ `.results`. */
export function useDeliveryResponsibles(): UseQueryResult<DeliveryResponsible[], Error> {
  return useQuery({
    queryKey: deliveryResponsibleKeys.list(),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<DeliveryResponsible>>(
        `${API_ENDPOINTS.DELIVERY_RESPONSIBLES.LIST}?page_size=200`,
      );
      return data.results;
    },
  });
}

export function useCreateDeliveryResponsible(): UseMutationResult<
  DeliveryResponsible,
  Error,
  { name: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) =>
      (await api.post(API_ENDPOINTS.DELIVERY_RESPONSIBLES.CREATE, payload)).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: deliveryResponsibleKeys.lists() }),
  });
}
