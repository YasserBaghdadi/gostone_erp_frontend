import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

export interface RecordExpensePayload {
  expense_account: number;
  payment_account: number;
  amount: string;
  includes_vat: boolean;
  date?: string;
  description?: string;
}

export interface RecentExpense {
  id: number;
  date: string;
  expense_account: string;
  expense_number: string;
  amount: string;
  paid_from: string;
  description: string;
}

const RECENT_EXPENSES_KEY = "recent-expenses";

/** Last 50 recorded expense vouchers. */
export const useRecentExpenses = () =>
  useQuery({
    queryKey: [RECENT_EXPENSES_KEY],
    queryFn: async () => {
      const { data } = await api.get<RecentExpense[]>(
        "/custom-v1/accounts/recent-expenses/",
      );
      return data;
    },
  });

/** Records a simple expense voucher (DEBIT expense / CREDIT cash-bank, optional VAT). */
export const useRecordExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RecordExpensePayload) => {
      const { data } = await api.post(
        "/custom-v1/accounts/record-expense/",
        payload,
      );
      return data as { id: number; amount: string; net: string; vat: string; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECENT_EXPENSES_KEY] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("تم تسجيل المصروف", {
        className: "bg-green-50 border-green-200 text-green-900",
      });
    },
    onError: (error: any) => {
      let msg = "تعذّر تسجيل المصروف";
      const d = error.response?.data;
      if (d && typeof d === "object") {
        const vals = Object.values(d).flat();
        if (vals.length && typeof vals[0] === "string") msg = vals[0] as string;
      }
      toast.error("خطأ", { description: msg });
    },
  });
};
