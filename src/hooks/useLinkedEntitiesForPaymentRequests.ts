import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { customerReturnKeys, purchaseOrderKeys, accountKeys } from "@/lib/queryKeys";
import type { Account, CustomerReturnDetail, PurchaseOrder } from "@/types";

/** نص الرابط لمرتجع: يفضّل أمر البيع المرتبط؛ وإلا رقم المرتجع. */
export function customerReturnLinkLabel(
  returnId: number,
  detail?: CustomerReturnDetail | null,
): string {
  if (!detail) return `مرتجع #${returnId}`;
  if (detail.sell_order) return `مرتجع أمر بيع #${detail.sell_order}`;
  return `مرتجع #${detail.id}`;
}

export function customerReturnLinkTitle(
  returnId: number,
  detail?: CustomerReturnDetail | null,
): string {
  const parts = [`مرتجع رقم ${returnId}`];
  if (detail?.sell_order) parts.push(`أمر بيع #${detail.sell_order}`);
  return parts.join(" · ");
}

export function purchaseOrderLinkLabel(poId: number): string {
  return `طلب شراء #${poId}`;
}

export function formatSourceAccountLabel(
  account: number | null | undefined,
): string {
  if (account != null && account > 0) return `#${account}`;
  return "—";
}

export function useCustomerReturnsMapByIds(returnIds: number[]) {
  const key = returnIds.join("|");
  const uniqueSorted = useMemo(() => {
    const s = [...new Set(returnIds.filter((x) => typeof x === "number" && x > 0))];
    s.sort((a, b) => a - b);
    return s;
  }, [key]);

  const queries = useQueries({
    queries: uniqueSorted.map((id) => ({
      queryKey: customerReturnKeys.detail(id),
      queryFn: async () => {
        const { data } = await api.get<CustomerReturnDetail>(
          API_ENDPOINTS.CUSTOMER_RETURNS.DETAILS(id),
        );
        return data;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const m = new Map<number, CustomerReturnDetail>();
    uniqueSorted.forEach((id, i) => {
      const row = queries[i];
      if (row?.data) m.set(id, row.data);
    });
    return m;
  }, [uniqueSorted, queries]);
}

export function usePurchaseOrdersMapByIds(poIds: number[]) {
  const key = poIds.join("|");
  const uniqueSorted = useMemo(() => {
    const s = [...new Set(poIds.filter((x) => typeof x === "number" && x > 0))];
    s.sort((a, b) => a - b);
    return s;
  }, [key]);

  const queries = useQueries({
    queries: uniqueSorted.map((id) => ({
      queryKey: purchaseOrderKeys.detail(id),
      queryFn: async () => {
        const res = await api.get<PurchaseOrder>(
          API_ENDPOINTS.PURCHASE_ORDERS.DETAILS(id),
        );
        return res.data;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  return useMemo(() => {
    const m = new Map<number, PurchaseOrder>();
    uniqueSorted.forEach((id, i) => {
      const row = queries[i];
      if (row?.data) m.set(id, row.data);
    });
    return m;
  }, [uniqueSorted, queries]);
}

export function supplierDisplayForPoPayment(
  req: { supplier_name?: string },
  order?: PurchaseOrder | null,
): string {
  if (req.supplier_name?.trim()) return req.supplier_name.trim();
  if (order?.supplier_name?.trim()) return order.supplier_name.trim();
  if (order?.supplier != null && order.supplier > 0)
    return `مورد #${order.supplier}`;
  return "—";
}

/** Batch-fetch account details by IDs for showing account names & links. */
export function useAccountsMapByIds(accountIds: number[]) {
  const key = accountIds.join("|");
  const uniqueSorted = useMemo(() => {
    const s = [...new Set(accountIds.filter((x) => typeof x === "number" && x > 0))];
    s.sort((a, b) => a - b);
    return s;
  }, [key]);

  const queries = useQueries({
    queries: uniqueSorted.map((id) => ({
      queryKey: accountKeys.detail(id),
      queryFn: async () => {
        const { data } = await api.get<Account>(
          API_ENDPOINTS.ACCOUNTS.DETAILS(id),
        );
        return data;
      },
      staleTime: 5 * 60 * 1000,
      throwOnError: false as const,
      retry: false,
    })),
  });

  return useMemo(() => {
    const m = new Map<number, Account>();
    uniqueSorted.forEach((id, i) => {
      const row = queries[i];
      if (row?.data) m.set(id, row.data);
    });
    return m;
  }, [uniqueSorted, queries]);
}
