import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';
import { journalEntryKeys } from '@/lib/queryKeys';
import type { JournalEntry, JournalEntryAttachment, PaginatedResponse } from '@/types';

// --- Interfaces ---

interface JournalEntriesFilters {
  search?: string;
  created_at?: string;
  page?: number;
  page_size?: number;
}

interface CreateJournalEntryItem {
  account: number;
  debit: string;
  credit: string;
  note?: string;
}

interface CreateJournalEntryRequest {
  note?: string;
  items: CreateJournalEntryItem[];
}

// --- Hooks ---

// List Journal Entries
export function useJournalEntries(filters: JournalEntriesFilters = {}): UseQueryResult<PaginatedResponse<JournalEntry>, Error> {
  return useQuery({
    queryKey: journalEntryKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<JournalEntry>> => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.created_at) params.append('created_at', filters.created_at);
      params.append('page', (filters.page || 1).toString());
      params.append('page_size', (filters.page_size || 10).toString());

      const response = await api.get(`${API_ENDPOINTS.JOURNAL_ENTRIES.LIST}?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get Journal Entry Details
export function useJournalEntryDetails(id: string | number): UseQueryResult<JournalEntry, Error> {
  return useQuery({
    queryKey: journalEntryKeys.detail(id),
    queryFn: async (): Promise<JournalEntry> => {
      const response = await api.get(API_ENDPOINTS.JOURNAL_ENTRIES.DETAILS(id));
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// Create Journal Entry
export function useCreateJournalEntry(): UseMutationResult<JournalEntry, Error, CreateJournalEntryRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJournalEntryRequest): Promise<JournalEntry> => {
      const response = await api.post(API_ENDPOINTS.JOURNAL_ENTRIES.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.lists() });
    },
  });
}

// Upload Attachment
export function useUploadJournalEntryAttachment(): UseMutationResult<JournalEntryAttachment, Error, { id: string | number; file: File; description?: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file, description }): Promise<JournalEntryAttachment> => {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      const response = await api.post(
        API_ENDPOINTS.JOURNAL_ENTRIES.UPLOAD_ATTACHMENT(id),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: journalEntryKeys.detail(variables.id) });
    },
  });
}
