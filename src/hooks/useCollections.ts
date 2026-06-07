import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
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

/** Fetches the «سند قبض» PDF for a collection and opens it in a new window. */
export function usePrintCollection(): UseMutationResult<void, Error, { id: string | number }> {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } = await import('@/lib/pdfUtils');
      const response = await api.get(API_ENDPOINTS.PAYMENTS.PRINT(id), { responseType: 'blob' });
      const filename = extractFilenameFromResponse(response, `receipt_${id}.pdf`);
      openPdfInWindow(response.data, filename);
    },
  });
}
