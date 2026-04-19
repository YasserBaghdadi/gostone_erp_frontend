import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';
import { bankKeys, bnplKeys, cardMachineKeys, cashRegisterKeys } from '@/lib/queryKeys';
import type { Bank, BuyNowPayLater, CardMachine, CashRegister, PaginatedResponse } from '@/types';

// Generic Filters
interface ListFilters {
  search?: string;
  page?: number;
  page_size?: number;
}

// Generic Payload
interface PaymentGatewayPayload {
  name: string;
  notes?: string;
}

// --- BANKS ---
export function useBanks(filters: ListFilters = {}): UseQueryResult<PaginatedResponse<Bank>, Error> {
  return useQuery({
    queryKey: bankKeys.list(filters),
    queryFn: async () => {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        params.append('page', (filters.page || 1).toString());
        params.append('page_size', (filters.page_size || 10).toString());
        const { data } = await api.get(`${API_ENDPOINTS.BANKS.LIST}?${params.toString()}`);
        return data;
    },
  });
}

export function useCreateBank(): UseMutationResult<Bank, Error, PaymentGatewayPayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post(API_ENDPOINTS.BANKS.CREATE, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bankKeys.lists() }),
  });
}

export function useUpdateBank(): UseMutationResult<Bank, Error, { id: number; data: PaymentGatewayPayload }> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }) => (await api.patch(API_ENDPOINTS.BANKS.UPDATE(id), data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: bankKeys.lists() }),
    });
}


// --- BNPL ---
export function useBNPL(filters: ListFilters = {}): UseQueryResult<PaginatedResponse<BuyNowPayLater>, Error> {
    return useQuery({
      queryKey: bnplKeys.list(filters),
      queryFn: async () => {
          const params = new URLSearchParams();
          if (filters.search) params.append('search', filters.search);
          params.append('page', (filters.page || 1).toString());
          params.append('page_size', (filters.page_size || 10).toString());
          const { data } = await api.get(`${API_ENDPOINTS.BNPL.LIST}?${params.toString()}`);
          return data;
      },
    });
  }
  
  export function useCreateBNPL(): UseMutationResult<BuyNowPayLater, Error, PaymentGatewayPayload> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data) => (await api.post(API_ENDPOINTS.BNPL.CREATE, data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: bnplKeys.lists() }),
    });
  }
  
  export function useUpdateBNPL(): UseMutationResult<BuyNowPayLater, Error, { id: number; data: PaymentGatewayPayload }> {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async ({ id, data }) => (await api.patch(API_ENDPOINTS.BNPL.UPDATE(id), data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: bnplKeys.lists() }),
      });
  }

  // --- CARD MACHINES ---
export function useCardMachines(filters: ListFilters = {}): UseQueryResult<PaginatedResponse<CardMachine>, Error> {
    return useQuery({
      queryKey: cardMachineKeys.list(filters),
      queryFn: async () => {
          const params = new URLSearchParams();
          if (filters.search) params.append('search', filters.search);
          params.append('page', (filters.page || 1).toString());
          params.append('page_size', (filters.page_size || 10).toString());
          const { data } = await api.get(`${API_ENDPOINTS.CARD_MACHINES.LIST}?${params.toString()}`);
          return data;
      },
    });
  }
  
  export function useCreateCardMachine(): UseMutationResult<CardMachine, Error, PaymentGatewayPayload> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data) => (await api.post(API_ENDPOINTS.CARD_MACHINES.CREATE, data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: cardMachineKeys.lists() }),
    });
  }
  
  export function useUpdateCardMachine(): UseMutationResult<CardMachine, Error, { id: number; data: PaymentGatewayPayload }> {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async ({ id, data }) => (await api.patch(API_ENDPOINTS.CARD_MACHINES.UPDATE(id), data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cardMachineKeys.lists() }),
      });
  }

  // --- CASH REGISTERS ---
export function useCashRegisters(filters: ListFilters = {}): UseQueryResult<PaginatedResponse<CashRegister>, Error> {
    return useQuery({
      queryKey: cashRegisterKeys.list(filters),
      queryFn: async () => {
          const params = new URLSearchParams();
          if (filters.search) params.append('search', filters.search);
          params.append('page', (filters.page || 1).toString());
          params.append('page_size', (filters.page_size || 10).toString());
          const { data } = await api.get(`${API_ENDPOINTS.CASH_REGISTERS.LIST}?${params.toString()}`);
          return data;
      },
    });
  }
  
  export function useCreateCashRegister(): UseMutationResult<CashRegister, Error, PaymentGatewayPayload> {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data) => (await api.post(API_ENDPOINTS.CASH_REGISTERS.CREATE, data)).data,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: cashRegisterKeys.lists() }),
    });
  }
  
  export function useUpdateCashRegister(): UseMutationResult<CashRegister, Error, { id: number; data: PaymentGatewayPayload }> {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async ({ id, data }) => (await api.patch(API_ENDPOINTS.CASH_REGISTERS.UPDATE(id), data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: cashRegisterKeys.lists() }),
      });
  }
