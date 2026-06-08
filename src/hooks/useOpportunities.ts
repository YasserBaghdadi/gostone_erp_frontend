import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';
import { opportunityKeys } from '@/lib/queryKeys';
import type { Opportunity, PaginatedResponse } from '@/types';

// Types

interface OpportunitiesFilters {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  page_size?: number;
  // Approval filters
  is_accepted?: boolean;
  is_rejected?: boolean;
  is_verified?: boolean;
  // New filters
  has_counter_offer?: boolean;
  interest_level?: string;
  total_price_after_tax_min?: number;
  total_price_after_tax_max?: number;
  need_dim_order?: boolean;
  has_dimensions?: boolean;
  have_sell_order?: boolean;
}

interface CreateOpportunityItemRequest {
  item_id: number;
  quantity: string;
  unit_name: string;
  unit_price_after_tax: string;
  counter_offer_after_tax: string;
  dis_percentage: string;
  notes?: string;
}

interface CreateOpportunityRequest {
  customer_phonenumber: string;
  location: string;
  interest_level: string;
  notes?: string;
  total_counter_offer: string;
  need_dim_order: boolean;
  items: CreateOpportunityItemRequest[];
}

interface UpdateOpportunityRequest extends Partial<CreateOpportunityRequest> {
  status?: string;
}


// List Opportunities
export function useOpportunities(filters: OpportunitiesFilters = {}): UseQueryResult<PaginatedResponse<Opportunity>, Error> {
  return useQuery({
    queryKey: opportunityKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Opportunity>> => {
      // API currently returns array directly according to spec
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      // Limit/Offset might be supported depending on backend pagination implementation
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      
      // Pagination Params
      params.append('page', (filters.page || 1).toString());
      params.append('page_size', (filters.page_size || 10).toString());
      
      // Approval Params
      if (filters.is_accepted !== undefined) params.append('is_accepted', filters.is_accepted.toString());
      if (filters.is_rejected !== undefined) params.append('is_rejected', filters.is_rejected.toString());
      if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());

      // New Params
      if (filters.has_counter_offer !== undefined) params.append('has_counter_offer', filters.has_counter_offer.toString());
      if (filters.interest_level) params.append('interest_level', filters.interest_level);
      if (filters.total_price_after_tax_min) params.append('total_price_after_tax_min', filters.total_price_after_tax_min.toString());
      if (filters.total_price_after_tax_max) params.append('total_price_after_tax_max', filters.total_price_after_tax_max.toString());
      if (filters.need_dim_order !== undefined) params.append('need_dim_order', filters.need_dim_order.toString());
      if (filters.has_dimensions !== undefined) params.append('has_dimensions', filters.has_dimensions.toString());
      if (filters.have_sell_order !== undefined) params.append('have_sell_order', filters.have_sell_order.toString());

      const response = await api.get(`${API_ENDPOINTS.OPPORTUNITIES.LIST}?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Get Opportunity Details
export function useOpportunityDetails(id: string): UseQueryResult<Opportunity, Error> {
  return useQuery({
    queryKey: opportunityKeys.detail(id),
    queryFn: async (): Promise<Opportunity> => {
      const response = await api.get(API_ENDPOINTS.OPPORTUNITIES.DETAILS(id));
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

// Create Opportunity
export function useCreateOpportunity(): UseMutationResult<Opportunity, Error, CreateOpportunityRequest> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOpportunityRequest): Promise<Opportunity> => {
      const response = await api.post(API_ENDPOINTS.OPPORTUNITIES.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate list queries to refetch
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
  });
}

// Update Opportunity
export function useUpdateOpportunity(): UseMutationResult<Opportunity, Error, { id: string; data: UpdateOpportunityRequest }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }): Promise<Opportunity> => {
      const response = await api.patch(API_ENDPOINTS.OPPORTUNITIES.UPDATE(id), data); // Changed to PATCH
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
    },
  });
}

// Delete Opportunity
export function useDeleteOpportunity(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await api.delete(API_ENDPOINTS.OPPORTUNITIES.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
    },
  });
}

// Import dimRequestKeys
import { dimRequestKeys } from '@/hooks/useMeasurements';

// ... existing code ...

// Request Measurements
export function useRequestMeasurements(): UseMutationResult<Opportunity, Error, { id: string; notes?: string }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id }): Promise<Opportunity> => {
      // Spec says POST /request_dim/ with no body mentioned, or maybe empty body?
      const response = await api.post(API_ENDPOINTS.OPPORTUNITIES.REQUEST_MEASUREMENTS(id), {});
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
      // Invalidate measurement requests list
      queryClient.invalidateQueries({ queryKey: dimRequestKeys.all }); 
    },
  });
}

// Request Work Order
export function useRequestWorkOrder(): UseMutationResult<Opportunity, Error, { id: string; notes?: string }> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, notes }): Promise<Opportunity> => {
      const response = await api.post(API_ENDPOINTS.OPPORTUNITIES.REQUEST_WORK_ORDER(id), { notes });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
    },
  });
}

// Create Sell Order from Opportunity. `specs` carries the manufacturing details
// (تفاصيل التصنيع) per custom item, keyed by opportunity-item id, when required.
export function useCreateSellOrder(): UseMutationResult<
  Opportunity,
  Error,
  { id: string; specs?: Record<string, unknown> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, specs }): Promise<Opportunity> => {
      const response = await api.post(
        API_ENDPOINTS.OPPORTUNITIES.CREATE_SELL_ORDER(id),
        specs ? { specs } : {},
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: opportunityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(variables.id) });
    },
  });
}

// Print Quotation (اسم الملف من Content-Disposition كما في أمر البيع)
export function usePrintQuotation(): UseMutationResult<void, Error, { id: string }> {
  return useMutation({
    mutationFn: async ({ id }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } = await import(
        "@/lib/pdfUtils"
      );

      const response = await api.get(API_ENDPOINTS.OPPORTUNITIES.PRINT(id), {
        responseType: "blob",
      });

      const filename = extractFilenameFromResponse(
        response,
        `opportunity_quotation_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
}

// Open an attached measurements file (يفتح ملف المقاسات في تبويب جديد).
// Fetched as an authenticated blob — the direct /media link is not served by
// the SPA host, so it would never open.
export function useOpenDimensionFile(): UseMutationResult<void, Error, string | number> {
  return useMutation({
    mutationFn: async (id): Promise<void> => {
      const response = await api.get(API_ENDPOINTS.OPPORTUNITY_DIMENSIONS.FILE(id), {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(response.data as Blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        // popup blocked → fall back to a programmatic click
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 300000);
    },
  });
}
