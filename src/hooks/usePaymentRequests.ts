import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { crPaymentRequestKeys, poPaymentRequestKeys, drPaymentRequestKeys } from "@/lib/queryKeys";
import type { PaginatedResponse, CRPaymentRequest, POPaymentRequest, DRPaymentRequest } from "@/types";

// ─── Shared filter params ────────────────────────────────────────────────────

interface CommonPaymentRequestParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  source_account?: number;
  created_after?: string;
  created_before?: string;
  created_by?: number;
}

export interface UseCRPaymentRequestsParams extends CommonPaymentRequestParams {
  customer_return?: number;
}

export interface UsePOPaymentRequestsParams extends CommonPaymentRequestParams {
  purchase_order?: number;
}

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
}

// ─── CR Payment Requests (مرتجعات) ──────────────────────────────────────────

export function useCRPaymentRequests(params: UseCRPaymentRequestsParams = {}) {
  return useQuery({
    queryKey: crPaymentRequestKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CRPaymentRequest>>(
        API_ENDPOINTS.CR_PAYMENT_REQUESTS.LIST,
        { params: cleanParams(params as Record<string, unknown>) },
      );
      return data;
    },
  });
}

export function useCRPaymentRequestDetails(id: string | number) {
  return useQuery<CRPaymentRequest>({
    queryKey: crPaymentRequestKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.CR_PAYMENT_REQUESTS.DETAILS(id));
      return data;
    },
    enabled: !!id,
  });
}

export interface MarkPaymentDonePayload {
  id: string | number;
  source_account: number;
}

export function useMarkCRPaymentDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source_account }: MarkPaymentDonePayload) => {
      const { data } = await api.post(
        API_ENDPOINTS.CR_PAYMENT_REQUESTS.MARK_DONE(id),
        { source_account },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: crPaymentRequestKeys.all });
      qc.invalidateQueries({ queryKey: crPaymentRequestKeys.detail(variables.id) });
    },
  });
}

// ─── PO Payment Requests (طلبات شراء) ───────────────────────────────────────

export function usePOPaymentRequests(params: UsePOPaymentRequestsParams = {}) {
  return useQuery({
    queryKey: poPaymentRequestKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<POPaymentRequest>>(
        API_ENDPOINTS.PO_PAYMENT_REQUESTS.LIST,
        { params: cleanParams(params as Record<string, unknown>) },
      );
      return data;
    },
  });
}

export function usePOPaymentRequestDetails(id: string | number) {
  return useQuery<POPaymentRequest>({
    queryKey: poPaymentRequestKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.PO_PAYMENT_REQUESTS.DETAILS(id));
      return data;
    },
    enabled: !!id,
  });
}

export function useMarkPOPaymentDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source_account }: MarkPaymentDonePayload) => {
      const { data } = await api.post(
        API_ENDPOINTS.PO_PAYMENT_REQUESTS.MARK_DONE(id),
        { source_account },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: poPaymentRequestKeys.all });
      qc.invalidateQueries({ queryKey: poPaymentRequestKeys.detail(variables.id) });
    },
  });
}

// ─── DR Payment Requests (طلبات صرف) ──────────────────────────────────────

export interface UseDRPaymentRequestsParams extends CommonPaymentRequestParams {
  disbursement_request?: number;
  payment_method?: string;
}

export function useDRPaymentRequests(params: UseDRPaymentRequestsParams = {}) {
  return useQuery({
    queryKey: drPaymentRequestKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<DRPaymentRequest>>(
        API_ENDPOINTS.DR_PAYMENT_REQUESTS.LIST,
        { params: cleanParams(params as Record<string, unknown>) },
      );
      return data;
    },
  });
}

export function useDRPaymentRequestDetails(id: string | number) {
  return useQuery<DRPaymentRequest>({
    queryKey: drPaymentRequestKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(API_ENDPOINTS.DR_PAYMENT_REQUESTS.DETAILS(id));
      return data;
    },
    enabled: !!id,
  });
}

export interface MarkDRPaymentDonePayload {
  id: string | number;
  source_account: number;
  actual_amount: string;
}

export function useMarkDRPaymentDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, source_account, actual_amount }: MarkDRPaymentDonePayload) => {
      const { data } = await api.post(
        API_ENDPOINTS.DR_PAYMENT_REQUESTS.MARK_DONE(id),
        { source_account, actual_amount },
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: drPaymentRequestKeys.all });
      qc.invalidateQueries({ queryKey: drPaymentRequestKeys.detail(variables.id) });
    },
  });
}

export function useUpdateDRPaymentRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string | number; source_account?: number; notes?: string }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.DR_PAYMENT_REQUESTS.DETAILS(id),
        body,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: drPaymentRequestKeys.all });
      qc.invalidateQueries({ queryKey: drPaymentRequestKeys.detail(variables.id) });
    },
  });
}
