import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { sellOrderKeys } from "@/lib/queryKeys";
import type { SellOrder, PaginatedResponse } from "@/types";

/** أمر بيع به فاتورة مرفوعة — لا يُسمح بتعديله من الواجهة */
export function sellOrderHasInvoice(
  order: { invoice_file?: string | null } | null | undefined,
): boolean {
  const v = order?.invoice_file;
  if (v == null) return false;
  return String(v).trim().length > 0;
}

/** يوحّد شكل أمر البيع القادم من الـ API (تفاصيل، قائمة، أو بعد رفع الفاتورة). */
function normalizeSellOrderApiItem(raw: unknown): SellOrder {
  const item = raw as SellOrder & {
    is_accepted?: boolean;
    is_verified?: boolean;
    is_rejected?: boolean;
  };
  return {
    ...item,
    is_accepted: item.is_accepted ?? !!item.accepted_by,
    is_verified: item.is_verified ?? !!item.verified_by,
    is_rejected: item.is_rejected ?? !!item.rejected_by,
  } as SellOrder;
}

// --- Types ---
interface SellOrdersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_accepted?: boolean;
  is_rejected?: boolean;
  is_verified?: boolean;
  /** عند `false`: أوامر بدون فاتورة فقط (حسب الـ API). عند `undefined`: لا يُرسل المعامل = كل الأوامر. */
  have_invoice?: boolean;
}

interface CreateSellOrderData {
  customer_phonenumber: string;
  location?: string;
  notes?: string;
  dis_percentage?: string;
  sell_order_items: {
    item_id: number;
    quantity: string;
    unit_name: string;
    price_after_tax: string;
    dis_percentage?: string;
    notes?: string;
  }[];
}

// --- Hooks ---

export function useSellOrders(filters: SellOrdersFilters = {}) {
  return useQuery<PaginatedResponse<SellOrder>>({
    queryKey: sellOrderKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.page_size) params.append('page_size', String(filters.page_size));
      if (filters.search) params.append('search', filters.search);
      if (filters.is_accepted !== undefined) params.append('is_accepted', filters.is_accepted.toString());
      if (filters.is_rejected !== undefined) params.append('is_rejected', filters.is_rejected.toString());
      if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified.toString());
      if (filters.have_invoice !== undefined) {
        params.append("have_invoice", filters.have_invoice ? "true" : "false");
      }

      const url = `${API_ENDPOINTS.SELL_ORDERS.LIST}?${params.toString()}`;
      const res = await api.get(url);
      
      const results = res.data.results.map((item: unknown) =>
        normalizeSellOrderApiItem(item),
      );

      return { ...res.data, results };
    },
  });
}

export function useSellOrderDetails(id: string | number) {
  return useQuery<SellOrder>({
    queryKey: sellOrderKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.SELL_ORDERS.DETAILS(id));
      return normalizeSellOrderApiItem(res.data);
    },
    enabled: !!id,
  });
}

export function useCreateSellOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSellOrderData) => {
      const res = await api.post(API_ENDPOINTS.SELL_ORDERS.CREATE, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.lists() });
    },
  });
}

export function useUpdateSellOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<CreateSellOrderData> }) => {
      const res = await api.patch(API_ENDPOINTS.SELL_ORDERS.UPDATE(id), data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.lists() });
    },
  });
}

export function usePrintSellOrder() {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } = await import("@/lib/pdfUtils");

      const response = await api.get(API_ENDPOINTS.SELL_ORDERS.PRINT(id), {
        responseType: "blob",
      });

      const filename = extractFilenameFromResponse(response, `sell_order_${id}.pdf`);
      openPdfInWindow(response.data, filename);
    },
  });
}

export function useUploadSellOrderInvoice() {
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
      formData.append("invoice_file", file);
      const { data } = await api.post(
        API_ENDPOINTS.SELL_ORDERS.UPLOAD_INVOICE(id),
        formData,
        { headers: { "Content-Type": undefined } },
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        sellOrderKeys.detail(variables.id),
        normalizeSellOrderApiItem(data),
      );
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.lists() });
    },
  });
}

export function usePushSellOrderToOdoo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number): Promise<unknown> => {
      const response = await api.post(API_ENDPOINTS.SELL_ORDERS.PUSH_TO_ODOO(id));
      return response.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sellOrderKeys.lists() });
    },
  });
}
