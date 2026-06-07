import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { deliveryOrderKeys } from "@/lib/queryKeys";
import type { DeliveryOrder, PaginatedResponse } from "@/types";

interface DeliveryOrdersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
}

// List Delivery Orders
export function useDeliveryOrders(
  filters: DeliveryOrdersFilters = {},
): UseQueryResult<PaginatedResponse<DeliveryOrder>, Error> {
  return useQuery({
    queryKey: deliveryOrderKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<DeliveryOrder>> => {
      const { data } = await api.get<PaginatedResponse<DeliveryOrder>>(
        API_ENDPOINTS.DELIVERY_ORDERS.LIST,
        { params: filters },
      );
      return data;
    },
  });
}

// Get Delivery Order Details
export function useDeliveryOrderDetails(
  id: string | number,
): UseQueryResult<DeliveryOrder, Error> {
  return useQuery({
    queryKey: deliveryOrderKeys.detail(id),
    queryFn: async (): Promise<DeliveryOrder> => {
      const { data } = await api.get<DeliveryOrder>(
        API_ENDPOINTS.DELIVERY_ORDERS.DETAILS(id),
      );
      return data;
    },
    enabled: !!id,
  });
}

// Print Delivery Order (returns PDF)
export function usePrintDeliveryOrder(): UseMutationResult<
  void,
  Error,
  { id: string | number }
> {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import("@/lib/pdfUtils");

      const response = await api.get(
        API_ENDPOINTS.DELIVERY_ORDERS.PRINT(id),
        { responseType: "blob" },
      );

      const filename = extractFilenameFromResponse(
        response,
        `delivery_order_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
}

// Deliver Delivery Order (issues the goods from stock)
export function useDeliverDeliveryOrder(): UseMutationResult<
  DeliveryOrder,
  Error,
  { id: string | number }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }): Promise<DeliveryOrder> => {
      const { data } = await api.post<DeliveryOrder>(
        API_ENDPOINTS.DELIVERY_ORDERS.DELIVER(id),
        {},
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryOrderKeys.detail(variables.id),
      });
    },
  });
}

// Schedule Delivery Order (موعد التسليم + الشخص المسؤول)
interface ScheduleDeliveryOrderArgs {
  id: string | number;
  scheduled_at: string | null;
  responsible: number | null;
}

export function useScheduleDeliveryOrder(): UseMutationResult<
  DeliveryOrder,
  Error,
  ScheduleDeliveryOrderArgs
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      scheduled_at,
      responsible,
    }): Promise<DeliveryOrder> => {
      const { data } = await api.patch<DeliveryOrder>(
        API_ENDPOINTS.DELIVERY_ORDERS.SCHEDULE(id),
        { scheduled_at, responsible },
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryOrderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: deliveryOrderKeys.detail(variables.id),
      });
    },
  });
}
