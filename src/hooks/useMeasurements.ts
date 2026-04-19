import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { Customer, Salesman, OpportunityItem, PaginatedResponse } from "@/types";

export interface DimRequest {
    id: number;
    customer: Customer;
    salesman: Salesman;
    notes?: string;
    location?: string;
    interest_level?: string;
    total_price_before_tax?: string;
    total_price_after_tax?: string;
    total_counter_offer?: string;
    need_dim_order?: boolean;
    have_sell_order?: boolean;
    items: OpportunityItem[];
}

export const dimRequestKeys = {
    all: ['dimRequests'] as const,
    list: () => [...dimRequestKeys.all, 'list'] as const,
    detail: (id: string) => [...dimRequestKeys.all, 'detail', id] as const,
};

interface DimRequestsFilters {
    page?: number;
    page_size?: number;
}

export function useDimRequests(filters: DimRequestsFilters = {}) {
    return useQuery({
        queryKey: [...dimRequestKeys.list(), filters],
        queryFn: async (): Promise<PaginatedResponse<DimRequest>> => {
            const params = new URLSearchParams();
            params.append('page', (filters.page || 1).toString());
            params.append('page_size', (filters.page_size || 10).toString());
            
            const response = await api.get(`${API_ENDPOINTS.DIM_REQUESTS.LIST}?${params.toString()}`);
            return response.data;
        },
    });
}

export function useUploadDimensions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ 
            opportunityId, 
            file, 
            notes,
            onProgress 
        }: { 
            opportunityId: number; 
            file: File; 
            notes?: string;
            onProgress?: (percent: number) => void;
        }) => {
            const formData = new FormData();
            formData.append('opportunity', opportunityId.toString());
            formData.append('file', file);
            if (notes) {
                formData.append('notes', notes);
            }
            const response = await api.post(API_ENDPOINTS.OPPORTUNITY_DIMENSIONS.CREATE, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total && onProgress) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        onProgress(percent);
                    }
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: dimRequestKeys.all });
            queryClient.invalidateQueries({ queryKey: ['opportunities'] }); 
        },
    });
}
