import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { accrualRunKeys, accrualTemplateKeys } from "@/lib/queryKeys";
import type { AccrualRun, AccrualTemplate, PaginatedResponse } from "@/types";

interface TemplateFilters {
  page?: number;
  search?: string;
  is_active?: boolean;
}

export function useAccrualTemplates(filters: TemplateFilters = {}) {
  return useQuery<PaginatedResponse<AccrualTemplate>>({
    queryKey: accrualTemplateKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.search) params.append("search", filters.search);
      if (filters.is_active !== undefined) params.append("is_active", String(filters.is_active));
      const res = await api.get(`${API_ENDPOINTS.ACCRUAL_TEMPLATES.LIST}?${params.toString()}`);
      return res.data;
    },
    retry: false,
  });
}

export interface AccrualTemplatePayload {
  name: string;
  kind: string;
  amount: string;
  is_taxable: boolean;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
}

export function useCreateAccrualTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AccrualTemplatePayload) => {
      const res = await api.post(API_ENDPOINTS.ACCRUAL_TEMPLATES.CREATE, data);
      return res.data as AccrualTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accrualTemplateKeys.lists() });
      toast.success("تم إضافة قالب الاستحقاق بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل إضافة القالب");
    },
  });
}

interface RunFilters {
  page?: number;
  status?: string;
}

export function useAccrualRuns(filters: RunFilters = {}) {
  return useQuery<PaginatedResponse<AccrualRun>>({
    queryKey: accrualRunKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.status) params.append("status", filters.status);
      const res = await api.get(`${API_ENDPOINTS.ACCRUAL_RUNS.LIST}?${params.toString()}`);
      return res.data;
    },
    retry: false,
  });
}

export function useGenerateAccrualRuns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { year: number; month: number }) => {
      const res = await api.post(API_ENDPOINTS.ACCRUAL_RUNS.GENERATE, data);
      return res.data as { created: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: accrualRunKeys.lists() });
      toast.success(`تم توليد ${data.created} مسودّة استحقاق`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل توليد المسودّات");
    },
  });
}

export function usePostAccrualRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, attachment }: { id: number; attachment?: File }) => {
      const formData = new FormData();
      if (attachment) formData.append("attachment", attachment);
      const res = await api.post(API_ENDPOINTS.ACCRUAL_RUNS.POST(id), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as AccrualRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accrualRunKeys.lists() });
      toast.success("تم ترحيل القيد بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل ترحيل القيد");
    },
  });
}
