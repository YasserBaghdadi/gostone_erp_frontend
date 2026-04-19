import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { customerReturnKeys } from "@/lib/queryKeys";
import type {
  CustomerReturn,
  CustomerReturnDetail,
  PaginatedResponse,
} from "@/types";

export interface UseCustomerReturnsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  customer?: string | number;
  sell_order?: string | number;
  created_after?: string;
  created_before?: string;
  created_by?: string | number;
  accepted_by?: string | number;
  rejected_by?: string | number;
}

interface CreateCustomerReturnData {
  sell_order: number;
  return_date: string;
  notes?: string;
  items: {
    sell_order_item: number;
    quantity: string;
    notes?: string;
  }[];
}

export function useCustomerReturns(params: UseCustomerReturnsParams = {}) {
  return useQuery({
    queryKey: customerReturnKeys.list(params),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
      );

      const { data } = await api.get<PaginatedResponse<CustomerReturn>>(
        API_ENDPOINTS.CUSTOMER_RETURNS.LIST,
        { params: cleanParams },
      );
      return data;
    },
  });
}

export function useCustomerReturnDetails(id: string | number) {
  return useQuery<CustomerReturnDetail>({
    queryKey: customerReturnKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(
        API_ENDPOINTS.CUSTOMER_RETURNS.DETAILS(id),
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCustomerReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCustomerReturnData) => {
      const res = await api.post(API_ENDPOINTS.CUSTOMER_RETURNS.CREATE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerReturnKeys.lists() });
    },
  });
}

export function useUpdateCustomerReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreateCustomerReturnData>;
    }) => {
      const res = await api.patch(
        API_ENDPOINTS.CUSTOMER_RETURNS.UPDATE(id),
        data,
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: customerReturnKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: customerReturnKeys.lists() });
    },
  });
}
