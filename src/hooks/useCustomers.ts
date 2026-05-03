import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';
import { customerKeys } from '@/lib/queryKeys';
import type { Customer, PaginatedResponse } from '@/types';

// --- Interfaces ---

interface CreateCustomerRequest {
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number2?: string;
  phone_number3?: string;
  
  // New Legal Fields
  vat_number?: string;
  vat_number_file?: File | null;
  tax_number?: string;
  tax_file?: File | null;
  cr_number?: string;
  cr_file?: File | null;
  address?: string;
  address_file?: File | null;
}

interface CustomersListFilters {
  search?: string;
  page?: number;
  page_size?: number;
}

interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

// --- Hooks ---

// Check Customer Existence
export function useCheckCustomer(): UseMutationResult<Customer, Error, string> {
  return useMutation({
    mutationFn: async (phoneNumber: string): Promise<Customer> => {
      const response = await api.get(API_ENDPOINTS.CUSTOMERS.CHECK(phoneNumber));
      return response.data;
    },
  });
}

// Create Customer
export function useCreateCustomer(): UseMutationResult<Customer, Error, CreateCustomerRequest | FormData> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateCustomerRequest | FormData): Promise<Customer> => {
      const isFormData = data instanceof FormData;
      const response = await api.post(API_ENDPOINTS.CUSTOMERS.CREATE, data, {
        headers: isFormData ? { 'Content-Type': undefined } : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// List Customers
export function useCustomers(filters: CustomersListFilters = {}): UseQueryResult<PaginatedResponse<Customer>, Error> {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      params.append('page', (filters.page || 1).toString());
      params.append('page_size', (filters.page_size || 10).toString());
      
      const response = await api.get(`${API_ENDPOINTS.CUSTOMERS.LIST}?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get Customer Details
export function useCustomerDetails(id: string | number): UseQueryResult<Customer, Error> {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async (): Promise<Customer> => {
      const response = await api.get(API_ENDPOINTS.CUSTOMERS.DETAILS(id));
      return response.data;
    },
    enabled: Boolean(id),
  });
}

// Update Customer
export function useUpdateCustomer(): UseMutationResult<Customer, Error, { id: string | number; data: UpdateCustomerRequest | FormData }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }): Promise<Customer> => {
      const isFormData = data instanceof FormData;
      const response = await api.patch(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data, {
        headers: isFormData ? { 'Content-Type': undefined } : undefined,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },
  });
}

// Add Customer Payment
export function useAddCustomerPayment(): UseMutationResult<void, Error, { id: string | number; data: FormData }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }): Promise<void> => {
      await api.post(API_ENDPOINTS.CUSTOMERS.ADD_PAYMENT(id), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      // Invalidate relevant order lists too if needed, but detail is primary
    },
  });
}

// Sync Customer To Odoo
export function useSyncCustomerToOdoo(): UseMutationResult<
  unknown,
  Error,
  string | number
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number): Promise<unknown> => {
      const response = await api.post(API_ENDPOINTS.CUSTOMERS.SYNC_TO_ODOO(id));
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

// Sync All Customers To Odoo
export function useSyncAllCustomersToOdoo(): UseMutationResult<
  unknown,
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<unknown> => {
      const response = await api.post(API_ENDPOINTS.CUSTOMERS.SYNC_ALL_TO_ODOO);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

/** Fetches customer account statement PDF and opens it in a print-ready window. */
export function usePrintCustomerStatement() {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import('@/lib/pdfUtils');
      const response = await api.get(API_ENDPOINTS.CUSTOMERS.STATEMENT(id), {
        responseType: 'blob',
      });
      const filename = extractFilenameFromResponse(
        response,
        `customer_statement_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
}
