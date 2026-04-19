import { useQuery, useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { supplierKeys } from "@/lib/queryKeys";
import type { Supplier, PaginatedResponse } from "@/types";
import { toast } from "sonner";

// --- Types ---
interface SuppliersFilters {
  page?: number;
  page_size?: number;
  search?: string;
  created_by?: number;
  has_cr_number?: boolean;
  has_vat_number?: boolean;
}

type SupplierMutationPayload = {
  [key: string]: any;
};

// --- Hooks ---

export function useSuppliers(filters: SuppliersFilters = {}) {
  return useQuery<PaginatedResponse<Supplier>>({
    queryKey: supplierKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.page_size) params.append('page_size', String(filters.page_size));
      if (filters.search) params.append('search', filters.search);
      if (filters.created_by) params.append('created_by', String(filters.created_by));
      if (filters.has_cr_number !== undefined) params.append('has_cr_number', String(filters.has_cr_number));
      if (filters.has_vat_number !== undefined) params.append('has_vat_number', String(filters.has_vat_number));
      
      const url = `${API_ENDPOINTS.SUPPLIERS.LIST}?${params.toString()}`;
      const res = await api.get(url);
      return res.data;
    },
    retry: false,
  });
}

export function useSupplierDetails(id: string | number) {
  return useQuery<Supplier>({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.SUPPLIERS.DETAILS(id));
      return res.data;
    },
    enabled: !!id,
    retry: false,
  });
}

export function useCreateSupplier(): UseMutationResult<Supplier, Error, SupplierMutationPayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      const res = await api.post(API_ENDPOINTS.SUPPLIERS.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      toast.success("تم إضافة المورد بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "فشل إضافة المورد");
    },
  });
}

export function useUpdateSupplier(id: string | number): UseMutationResult<Supplier, Error, SupplierMutationPayload> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const formData = new FormData();
      const supplierFileKeys = new Set([
        "vat_number_file",
        "tax_file",
        "cr_file",
        "address_file",
        "national_address_file",
        "commercial_registration_file",
      ]);

      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (supplierFileKeys.has(key)) {
          if (value instanceof File) {
            formData.append(key, value);
          }
          /* روابط سلسلة = مرفق قديم دون تغيير — لا نرسلها في FormData */
          return;
        }
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      });

      const res = await api.patch(API_ENDPOINTS.SUPPLIERS.UPDATE(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
      toast.success("تم تحديث بيانات المورد بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "فشل تحديث بيانات المورد");
    },
  });
}
