/**
 * عرض اسم المورد/العميل مع الرصيد بين قوسين من account.balance أو من حقول summary.
 */

import type { CRPaymentRequest, CustomerReturn } from "@/types";

export function formatBalanceParentheses(
  balance: string | number | null | undefined,
): string {
  if (balance === null || balance === undefined) return "";
  const s = String(balance).trim();
  if (s === "") return "";
  return ` (${s})`;
}

/** اسم + رصيد اختياري (مثل مورد من supplier_list في طلب شراء). */
export function formatNameWithBalance(
  name: string,
  balance?: string | number | null,
): string {
  const trimmed = String(name ?? "").trim();
  return `${trimmed}${formatBalanceParentheses(balance)}`;
}

export function formatSupplierWithBalance(supplier: {
  display_name: string;
  account?: { balance?: string | null } | null;
}): string {
  return formatNameWithBalance(supplier.display_name, supplier.account?.balance);
}

export function formatCustomerWithBalance(customer: {
  first_name?: string | null;
  last_name?: string | null;
  account?: { balance?: string | null } | null;
}): string {
  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();
  const suffix = formatBalanceParentheses(customer.account?.balance);
  if (!name) return suffix ? `—${suffix}` : "—";
  return `${name}${suffix}`;
}

/** قائمة/تفاصيل مرتجع: يفضّل كائن العميل من الـ API ثم الاسم + رصيد مسطح إن وُجد. */
export function formatCustomerReturnPartyLabel(
  row: Pick<
    CustomerReturn,
    "customer_name" | "customer" | "customer_account_balance"
  >,
  emptyNameFallback = "عميل غير محدد",
): string {
  if (row.customer) return formatCustomerWithBalance(row.customer);
  const name = String(row.customer_name ?? "").trim() || emptyNameFallback;
  return formatNameWithBalance(name, row.customer_account_balance);
}

/** طلب دفع مرتبط بمرتجع: يدمج بيانات الطلب مع تفاصيل المرتجع عند التحميل. */
export function formatCrPaymentCustomerLabel(
  req: Pick<
    CRPaymentRequest,
    "customer_name" | "customer" | "customer_account_balance"
  >,
  returnDetail?: Pick<
    CustomerReturn,
    "customer_name" | "customer" | "customer_account_balance"
  > | null,
): string {
  return formatCustomerReturnPartyLabel(
    {
      customer_name: returnDetail?.customer_name ?? req.customer_name,
      customer: returnDetail?.customer ?? req.customer,
      customer_account_balance:
        returnDetail?.customer_account_balance ?? req.customer_account_balance,
    },
    "—",
  );
}
