import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';
import { collectionKeys } from '@/lib/queryKeys';
import type { CollectionPayment, PaginatedResponse } from '@/types';

/** Lists all customer payments (collections / قبض) across every customer. */
export function useCollections(): UseQueryResult<CollectionPayment[], Error> {
  return useQuery({
    queryKey: collectionKeys.lists(),
    queryFn: async (): Promise<CollectionPayment[]> => {
      // The payments endpoint is paginated (DRF default) → unwrap `results`.
      const { data } = await api.get<PaginatedResponse<CollectionPayment>>(API_ENDPOINTS.PAYMENTS.LIST);
      return data.results;
    },
  });
}
