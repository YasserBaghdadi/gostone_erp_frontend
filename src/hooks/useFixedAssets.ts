import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { depreciationRunKeys, fixedAssetKeys } from "@/lib/queryKeys";
import type { DepreciationRun, FixedAsset, PaginatedResponse } from "@/types";

interface AssetFilters {
  page?: number;
  search?: string;
  is_active?: boolean;
}

export function useFixedAssets(filters: AssetFilters = {}) {
  return useQuery<PaginatedResponse<FixedAsset>>({
    queryKey: fixedAssetKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.search) params.append("search", filters.search);
      if (filters.is_active !== undefined) params.append("is_active", String(filters.is_active));
      const res = await api.get(`${API_ENDPOINTS.FIXED_ASSETS.LIST}?${params.toString()}`);
      return res.data;
    },
    retry: false,
  });
}

export interface FixedAssetPayload {
  name: string;
  cost: string;
  salvage_value: string;
  acquisition_date: string;
  useful_life_months: number;
  is_active?: boolean;
}

export function useCreateFixedAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FixedAssetPayload) => {
      const res = await api.post(API_ENDPOINTS.FIXED_ASSETS.CREATE, data);
      return res.data as FixedAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fixedAssetKeys.lists() });
      toast.success("تم إضافة الأصل بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل إضافة الأصل");
    },
  });
}

interface RunFilters {
  page?: number;
  status?: string;
}

export function useDepreciationRuns(filters: RunFilters = {}) {
  return useQuery<PaginatedResponse<DepreciationRun>>({
    queryKey: depreciationRunKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.status) params.append("status", filters.status);
      const res = await api.get(`${API_ENDPOINTS.DEPRECIATION_RUNS.LIST}?${params.toString()}`);
      return res.data;
    },
    retry: false,
  });
}

export function useGenerateDepreciationRuns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { year: number; month: number }) => {
      const res = await api.post(API_ENDPOINTS.DEPRECIATION_RUNS.GENERATE, data);
      return res.data as { created: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: depreciationRunKeys.lists() });
      toast.success(`تم توليد ${data.created} مسودّة إهلاك`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل توليد المسودّات");
    },
  });
}

export function usePostDepreciationRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(API_ENDPOINTS.DEPRECIATION_RUNS.POST(id), {});
      return res.data as DepreciationRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: depreciationRunKeys.lists() });
      toast.success("تم ترحيل قيد الإهلاك بنجاح");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || "فشل ترحيل القيد");
    },
  });
}
