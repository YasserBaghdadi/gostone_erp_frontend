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
  responsible?: number;
  unassigned?: boolean;
}

// Params for the printable, filtered production-orders list (by responsible/status)
export interface ProductionListPrintParams {
  responsible?: number;
  unassigned?: boolean;
  status?: string;
}

interface CreateProductionOrderRequest {
  finished_item: number;
  quantity: string;
  unit_name: string;
  storage_area?: number;
  washbasin_spec?: Record<string, unknown> | null;
}

interface AddMaterialRequest {
  item: number;
  quantity: string;
  unit_name: string;
  storage_area?: number;
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

// Print Production Order (returns PDF)
export function usePrintProductionOrder(): UseMutationResult<
  void,
  Error,
  { id: string | number }
> {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import("@/lib/pdfUtils");

      const response = await api.get(
        API_ENDPOINTS.PRODUCTION_ORDERS.PRINT(id),
        { responseType: "blob" },
      );

      const filename = extractFilenameFromResponse(
        response,
        `production_order_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
}

// Print the filtered production-orders list (by responsible / status) as a PDF
export function usePrintProductionOrdersList(): UseMutationResult<
  void,
  Error,
  ProductionListPrintParams
> {
  return useMutation({
    mutationFn: async (params: ProductionListPrintParams): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import("@/lib/pdfUtils");

      const response = await api.get(API_ENDPOINTS.PRODUCTION_ORDERS.PRINT_LIST, {
        params,
        responseType: "blob",
      });

      const filename = extractFilenameFromResponse(
        response,
        "production_orders_list.pdf",
      );
      openPdfInWindow(response.data, filename);
    },
  });
}

// Schedule Production Order (موعد العميل + مسؤول التصنيع)
interface ScheduleProductionOrderArgs {
  id: string | number;
  scheduled_at: string | null;
  responsible?: number | null;
}

export function useScheduleProductionOrder(): UseMutationResult<
  ProductionOrder,
  Error,
  ScheduleProductionOrderArgs
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, scheduled_at, responsible }): Promise<ProductionOrder> => {
      const { data } = await api.patch<ProductionOrder>(
        API_ENDPOINTS.PRODUCTION_ORDERS.SCHEDULE(id),
        responsible === undefined ? { scheduled_at } : { scheduled_at, responsible },
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
