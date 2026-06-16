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
  /** restrict to postable (leaf) accounts — excludes parent/summary accounts */
  leaf_only?: boolean;
}

// Fetch Accounts List (paginated, for search)
export const useAccounts = (params: AccountsParams = { page: 1, page_size: 10 }) => {
  return useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<any>("/custom-v1/accounts/", { params });

      // بعض بيئات الباك اند ترجع Array مباشرة بدل PaginatedResponse.
      // نوحّد الشكل علشان الـ UI يعتمد دائمًا على `results`.
      if (Array.isArray(data)) {
        const normalized: PaginatedResponse<Account> = {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
        return normalized;
      }

      return data as PaginatedResponse<Account>;
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

// Update Account (edit name/note — number & parent are immutable server-side)
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string | number;
      data: { name?: string; note?: string };
    }) => {
      const { data: response } = await api.patch<Account>(
        `/custom-v1/accounts/${id}/`,
        data,
      );
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [ACCOUNTS_QUERY_KEY, "detail", variables.id],
      });
      toast.success("تم تعديل الحساب بنجاح", {
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error: any) => {
      let msg = "حدث خطأ أثناء تعديل الحساب";
      if (error.response?.data) {
        if (typeof error.response.data.detail === "string") {
          msg = error.response.data.detail;
        } else if (typeof error.response.data === "object") {
          const vals = Object.values(error.response.data).flat();
          if (vals.length > 0 && typeof vals[0] === "string") {
            msg = vals[0] as string;
          }
        }
      }
      toast.error("خطأ", { description: msg });
    },
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

/** Downloads the branded chart-of-accounts Excel (.xlsx). */
export const useExportAccountsExcel = () => {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.get("/custom-v1/accounts/export-excel/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "شجرة_الحسابات.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error("تعذّر تصدير شجرة الحسابات"),
  });
};

function downloadBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/** Downloads the «ملخص ضريبة القيمة المضافة» Excel for a period. */
export const useVatSummaryExcel = () => {
  return useMutation({
    mutationFn: async (params: { date_from: string; date_to: string }) => {
      const res = await api.get("/custom-v1/accounts/vat-summary/", {
        params,
        responseType: "blob",
      });
      downloadBlob(res.data, "ملخص_الضريبة.xlsx");
    },
    onError: () => toast.error("تعذّر تصدير ملخص الضريبة"),
  });
};

/** Downloads the «قائمة الدخل» Excel for a period (optional inventory values). */
export const useIncomeStatementExcel = () => {
  return useMutation({
    mutationFn: async (params: {
      date_from: string;
      date_to: string;
      opening_inventory?: string;
      closing_inventory?: string;
    }) => {
      const res = await api.get("/custom-v1/accounts/income-statement/", {
        params,
        responseType: "blob",
      });
      downloadBlob(res.data, "قائمة_الدخل.xlsx");
    },
    onError: () => toast.error("تعذّر تصدير قائمة الدخل"),
  });
};

/** Downloads the «الميزانية العمومية» (balance sheet) Excel as of a date. */
export const useBalanceSheetExcel = () => {
  return useMutation({
    mutationFn: async (params: { as_of: string }) => {
      const res = await api.get("/custom-v1/accounts/balance-sheet/", {
        params,
        responseType: "blob",
      });
      downloadBlob(res.data, "الميزانية_العمومية.xlsx");
    },
    onError: () => toast.error("تعذّر تصدير الميزانية العمومية"),
  });
};

/** Posts the period-end inventory adjustment (تسوية جرد آخر المدة). */
export const useInventoryAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (closing_inventory: string) => {
      const res = await api.post("/custom-v1/accounts/inventory-adjustment/", {
        closing_inventory,
      });
      return res.data as {
        previous_inventory: string;
        closing_inventory: string;
        adjustment: string;
        message: string;
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY] });
      toast.success(data.message || "تمت تسوية الجرد", {
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error: any) => {
      let msg = "فشلت تسوية الجرد";
      const data = error.response?.data;
      if (data && typeof data === "object") {
        const vals = Object.values(data).flat();
        if (vals.length && typeof vals[0] === "string") msg = vals[0] as string;
      }
      toast.error("خطأ", { description: msg });
    },
  });
};

/** Downloads the branded «ميزان المراجعة» (trial balance) Excel (.xlsx). */
export const useTrialBalanceExcel = () => {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const response = await api.get("/custom-v1/accounts/trial-balance/", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "ميزان_المراجعة.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error("تعذّر تصدير ميزان المراجعة"),
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
