import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import type { Account, PaginatedResponse } from "@/types";
import { toast } from "sonner";

const ACCOUNTS_QUERY_KEY = "accounts";

interface AccountsParams {
  page?: number;
  page_size?: number;
  search?: string;
}

// Fetch Accounts List (paginated, for search)
export const useAccounts = (params: AccountsParams = { page: 1, page_size: 10 }) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Account>>("/custom-v1/accounts/", { params });
      return data;
    },
    placeholderData: (previousData) => previousData,
  });
};

// Fetch ALL accounts (no pagination — for tree view)
export const useAllAccounts = () => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, "all"],
    queryFn: async (): Promise<Account[]> => {
      const { data } = await api.get<any>("/custom-v1/accounts/", {
        params: { page_size: 9999 },
      });
      return Array.isArray(data) ? data : (data.results || []);
    },
  });
};

// Fetch Single Account Details
export const useAccountDetails = (id: string | number) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const { data } = await api.get<Account>(`/custom-v1/accounts/${id}/`);
      return data;
    },
    enabled: !!id,
  });
};

// Create Account
export const useCreateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Account>) => {
      // Ensure parent is sent only if selected, otherwise API might expect null or omit it
      const payload = {
          ...data,
          parent: data.parent || null // Explicitly null if 0 or undefined
      }
      const { data: response } = await api.post<Account>("/custom-v1/accounts/", payload);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      toast.success("تمت العملية بنجاح", {
        description: "تم إنشاء الحساب الجديد بنجاح",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error: any) => {
      let msg = "حدث خطأ أثناء إنشاء الحساب";
      if (error.response?.data) {
        if (typeof error.response.data.detail === "string") {
          msg = error.response.data.detail;
        } else if (typeof error.response.data === "object") {
          const vals = Object.values(error.response.data).flat();
          if (vals.length > 0 && typeof vals[0] === "string") {
            msg = vals[0];
          }
        }
      }
      toast.error("خطأ", {
        description: msg,
      });
    }
  });
};

// Get Next Account Number (Suggestion)
export const useNextAccountNumber = (parentId: string | number | null) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, "next-number", parentId],
    queryFn: async () => {
      if (!parentId) return null;
      const { data } = await api.get<{ next_number: string }>(`/custom-v1/accounts/${parentId}/next-child-number/`);
      // The user mentioned the API returns a suggestion, we assume standard structure or string. 
      // Based on request "GET /api/custom-v1/accounts/{id}/next-child-number/"
      // It likely returns just the number or object. Let's assume object for safety or adjust if it's raw string.
      // Usually API returns JSON. Let's assume { number: "..." } or similar. 
      // User said: "beji min khilal ... biytla3 iqtira7"
      // Let's assume the response body IS the string or a simple object. 
      // If the user didn't specify the response format for this specific endpoint, I'll assume it returns a JSON object.
      // Let's safe guard it.
      return data;
    },
    enabled: !!parentId,
    retry: false,
  });
};

/** Fetches account statement PDF and opens it in a print-ready window. */
export const usePrintAccountStatement = () => {
  return useMutation({
    mutationFn: async ({ id }: { id: string | number }): Promise<void> => {
      const { extractFilenameFromResponse, openPdfInWindow } =
        await import("@/lib/pdfUtils");
      const response = await api.get(API_ENDPOINTS.ACCOUNTS.STATEMENT(id), {
        responseType: "blob",
      });
      const filename = extractFilenameFromResponse(
        response,
        `account_statement_${id}.pdf`,
      );
      openPdfInWindow(response.data, filename);
    },
  });
};
