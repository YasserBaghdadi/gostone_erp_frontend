import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { purchaseOrderKeys } from "@/lib/queryKeys";
import type { PurchaseOrder, PaginatedResponse } from "@/types";

// --- Types ---
interface PurchaseOrdersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  is_accepted?: boolean;
  is_rejected?: boolean;
  is_verified?: boolean;
}

interface CreatePurchaseOrderItemData {
  item: number;
  supplier?: number;
  quantity: string;
  purchase_price: string;
  unit_name: string;
  notes?: string;
}

interface CreatePurchaseOrderData {
  supplier?: number;
  sell_order?: number;
  status?: string;
  notes?: string;
  items: CreatePurchaseOrderItemData[];
}

// --- Hooks ---

export function usePurchaseOrders(filters: PurchaseOrdersFilters = {}) {
  return useQuery<PaginatedResponse<PurchaseOrder>>({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.page_size)
        params.append("page_size", String(filters.page_size));
      if (filters.search) params.append("search", filters.search);
      if (filters.status) params.append("status", filters.status);
      if (filters.is_accepted !== undefined)
        params.append("is_accepted", filters.is_accepted.toString());
      if (filters.is_rejected !== undefined)
        params.append("is_rejected", filters.is_rejected.toString());
      if (filters.is_verified !== undefined)
        params.append("is_verified", filters.is_verified.toString());

      const url = `${API_ENDPOINTS.PURCHASE_ORDERS.LIST}?${params.toString()}`;
      const res = await api.get(url);

      // Transform response
      const results = res.data.results.map((item: any) => ({
        ...item,
        is_accepted:
          item.is_accepted ??
          (item.status === "APPROVED" || !!item.accepted_at),
        // Note: 'APPROVED' in PO usually means initial approval, waiting for verification/ordering?
        // Or if verified_by exists.
        is_verified: item.is_verified ?? !!item.verified_by,
        is_rejected:
          item.is_rejected ??
          (item.status === "CANCELLED" || item.status === "REJECTED"),
      }));

      return { ...res.data, results };
    },
  });
}

export function usePurchaseOrderDetails(id: string | number) {
  return useQuery<PurchaseOrder>({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PURCHASE_ORDERS.DETAILS(id));
      const item = res.data;
      return {
        ...item,
        is_accepted:
          item.is_accepted ??
          (item.status === "APPROVED" || !!item.accepted_at),
        is_verified: item.is_verified ?? !!item.verified_by,
        is_rejected:
          item.is_rejected ??
          (item.status === "CANCELLED" || item.status === "REJECTED"),
      };
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderData) => {
      const res = await api.post(API_ENDPOINTS.PURCHASE_ORDERS.CREATE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: Partial<CreatePurchaseOrderData>;
    }) => {
      const res = await api.patch(
        API_ENDPOINTS.PURCHASE_ORDERS.UPDATE(id),
        data,
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string | number) => {
      await api.delete(API_ENDPOINTS.PURCHASE_ORDERS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
    },
  });
}

export function usePrintPurchaseOrder() {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import("@/lib/pdfUtils");

      const response = await api.get(API_ENDPOINTS.PURCHASE_ORDERS.PRINT(id), {
        responseType: "blob",
      });

      const filename = extractFilenameFromResponse(
        response,
        `purchase_order_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
}

export function useUploadPurchaseOrderInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      file,
    }: {
      id: string | number;
      file: File;
    }) => {
      const formData = new FormData();
      // API expects field name: "file"
      formData.append("file", file);
      const res = await api.post(
        API_ENDPOINTS.PURCHASE_ORDERS.UPLOAD_INVOICE(id),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data as PurchaseOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      if (data?.id != null) {
        queryClient.invalidateQueries({
          queryKey: purchaseOrderKeys.detail(data.id),
        });
      }
    },
  });
}
