import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { supplierPaymentKeys } from "@/lib/queryKeys";
import type { PaginatedResponse } from "@/types";

export interface SupplierPayment {
  id: number;
  supplier: number;
  supplier_name: string | null;
  amount: string;
  source_account: number;
  file: string | null;
  status: string;
  notes: string;
  created_at: string;
}

export interface SupplierOption {
  id: number;
  display_name?: string;
  first_name?: string;
  contact_name?: string;
}

export interface SourceAccountOption {
  id: number;
  name: string;
  number: string;
}

export function useSupplierPayments(page = 1) {
  return useQuery<PaginatedResponse<SupplierPayment>>({
    queryKey: supplierPaymentKeys.list({ page }),
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.SUPPLIER_PAYMENTS.LIST}?page=${page}`);
      return res.data;
    },
    retry: false,
  });
}

/** Suppliers for the dropdown (first page, large size). */
export function useSupplierOptions() {
  return useQuery<SupplierOption[]>({
    queryKey: ["supplier-options"],
    queryFn: async () => {
      const res = await api.get(`${API_ENDPOINTS.SUPPLIERS.LIST}?page_size=1000`);
      return res.data?.results ?? res.data ?? [];
    },
    retry: false,
  });
}

/** Cash + bank accounts combined as payment sources (both endpoints are unpaginated). */
export function useSourceAccounts() {
  return useQuery<SourceAccountOption[]>({
    queryKey: ["source-accounts"],
    queryFn: async () => {
      const [cash, bank] = await Promise.all([
        api.get(API_ENDPOINTS.CASH_ACCOUNTS.LIST),
        api.get(API_ENDPOINTS.BANK_ACCOUNTS.LIST),
      ]);
      const cashList = cash.data?.results ?? cash.data ?? [];
      const bankList = bank.data?.results ?? bank.data ?? [];
      return [...cashList, ...bankList];
    },
    retry: false,
  });
}

export interface CreateSupplierPaymentPayload {
  supplier: number;
  amount: string;
  source_account: number;
  file?: File | null;
  notes?: string;
}

export function useCreateSupplierPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateSupplierPaymentPayload) => {
      const form = new FormData();
      form.append("supplier", String(data.supplier));
      form.append("amount", data.amount);
      form.append("source_account", String(data.source_account));
      if (data.notes) form.append("notes", data.notes);
      if (data.file) form.append("file", data.file);
      const res = await api.post(API_ENDPOINTS.SUPPLIER_PAYMENTS.CREATE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as SupplierPayment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierPaymentKeys.lists() });
      toast.success("تم تسجيل الدفعة وترحيلها بنجاح");
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "فشل تسجيل الدفعة");
    },
  });
}
