import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { productionOrderKeys } from "@/lib/queryKeys";
import type { ProductionOrder, PaginatedResponse } from "@/types";

interface ProductionOrdersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}

interface CreateProductionOrderRequest {
  finished_item: number;
  quantity: string;
  unit_name: string;
}

interface AddMaterialRequest {
  item: number;
  quantity: string;
  unit_name: string;
}

// List Production Orders
export function useProductionOrders(
  filters: ProductionOrdersFilters = {},
): UseQueryResult<PaginatedResponse<ProductionOrder>, Error> {
  return useQuery({
    queryKey: productionOrderKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<ProductionOrder>> => {
      const { data } = await api.get<PaginatedResponse<ProductionOrder>>(
        API_ENDPOINTS.PRODUCTION_ORDERS.LIST,
        { params: filters },
      );
      return data;
    },
  });
}

// Get Production Order Details
export function useProductionOrderDetails(
  id: string | number,
): UseQueryResult<ProductionOrder, Error> {
  return useQuery({
    queryKey: productionOrderKeys.detail(id),
    queryFn: async (): Promise<ProductionOrder> => {
      const { data } = await api.get<ProductionOrder>(
        API_ENDPOINTS.PRODUCTION_ORDERS.DETAILS(id),
      );
      return data;
    },
    enabled: !!id,
  });
}

// Create Production Order (manual)
export function useCreateProductionOrder(): UseMutationResult<
  ProductionOrder,
  Error,
  CreateProductionOrderRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateProductionOrderRequest,
    ): Promise<ProductionOrder> => {
      const { data } = await api.post<ProductionOrder>(
        API_ENDPOINTS.PRODUCTION_ORDERS.CREATE,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionOrderKeys.lists() });
    },
  });
}

// Add Material to Production Order
export function useAddProductionMaterial(): UseMutationResult<
  ProductionOrder,
  Error,
  { id: string | number; data: AddMaterialRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }): Promise<ProductionOrder> => {
      const { data: response } = await api.post<ProductionOrder>(
        API_ENDPOINTS.PRODUCTION_ORDERS.ADD_MATERIAL(id),
        data,
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productionOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.detail(variables.id),
      });
    },
  });
}

// Close Production Order (produces finished item into stock)
export function useCloseProductionOrder(): UseMutationResult<
  ProductionOrder,
  Error,
  { id: string | number }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }): Promise<ProductionOrder> => {
      const { data } = await api.post<ProductionOrder>(
        API_ENDPOINTS.PRODUCTION_ORDERS.CLOSE(id),
        {},
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productionOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productionOrderKeys.detail(variables.id),
      });
    },
  });
}
