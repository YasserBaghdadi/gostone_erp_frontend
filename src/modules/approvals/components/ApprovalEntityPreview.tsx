import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Hash, User, MapPin, FileText, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import type { Customer } from "@/types";
import { formatCustomerWithBalance, formatNameWithBalance } from "@/lib/partyDisplay";

function approvalCustomerLabel(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";
  const c = raw as Record<string, unknown>;
  const account = c.account as { balance?: string | null } | undefined;
  const fn = c.first_name;
  const ln = c.last_name;
  if (typeof fn === "string" || typeof ln === "string") {
    return formatCustomerWithBalance({
      first_name: (fn as string) ?? "",
      last_name: (ln as string) ?? "",
      account: account ?? null,
    } as Customer);
  }
  const dn = c.display_name;
  if (typeof dn === "string" && dn.trim()) {
    return formatNameWithBalance(dn.trim(), account?.balance);
  }
  return "";
}

function approvalPurchaseOrderSupplierLabel(data: Record<string, unknown>): string {
  const list = data.supplier_list as
    | Array<{
        display_name?: string;
        balance?: string | number;
      }>
    | undefined;
  if (Array.isArray(list) && list.length > 0) {
    const s = list[0];
    const n = String(s?.display_name ?? "").trim();
    if (n) return formatNameWithBalance(n, s?.balance);
  }
  return String(data.supplier_name ?? "").trim();
}

interface ApprovalEntityPreviewProps {
  contentTypeLabel: string;
  objectId: number;
}

interface EntityConfig {
  label: string;
  endpoint: (id: string | number) => string;
  detailRoute?: (id: string | number) => string;
  renderFields: (data: Record<string, unknown>) => EntityField[];
}

interface EntityField {
  label: string;
  value: string | number | undefined | null;
  icon?: typeof Hash;
}

const ENTITY_MAP: Record<string, EntityConfig> = {
  "sales.sellorder": {
    label: "تفاصيل أمر البيع",
    endpoint: API_ENDPOINTS.SELL_ORDERS.DETAILS,
    detailRoute: (id) => `/sell-orders/${id}`,
    renderFields: (data) => [
      { label: "رقم الأمر", value: `#${data.id}`, icon: Hash },
      { label: "العميل", value: approvalCustomerLabel(data.customer), icon: User },
      { label: "المندوب", value: (data.salesman as Record<string, unknown>)?.display_name as string, icon: User },
      { label: "الإجمالي قبل الضريبة", value: `${data.total_price_before_tax} ر.س`, icon: DollarSign },
      { label: "الإجمالي بعد الضريبة", value: `${data.total_price_after_tax} ر.س`, icon: DollarSign },
      { label: "نسبة الخصم", value: data.dis_percentage ? `${data.dis_percentage}%` : "بدون خصم", icon: Package },
      { label: "الموقع", value: data.location as string, icon: MapPin },
      { label: "ملاحظات", value: data.notes as string, icon: FileText },
    ],
  },
  "purchase.purchaseorder": {
    label: "تفاصيل طلب الشراء",
    endpoint: API_ENDPOINTS.PURCHASE_ORDERS.DETAILS,
    detailRoute: (id) => `/purchase-orders/${id}`,
    renderFields: (data) => [
      { label: "رقم الطلب", value: `#${data.id}`, icon: Hash },
      { label: "المورد", value: approvalPurchaseOrderSupplierLabel(data), icon: User },
      { label: "الحالة", value: data.status as string, icon: Package },
      { label: "الإجمالي", value: data.total_cost ? `${data.total_cost} ر.س` : undefined, icon: DollarSign },
      { label: "عدد الأصناف", value: data.item_count as number, icon: Package },
      { label: "ملاحظات", value: data.notes as string, icon: FileText },
    ],
  },
  "custody.custodiantransactionrequest": {
    label: "تفاصيل العهدة",
    endpoint: API_ENDPOINTS.CUSTODY.DETAILS,
    detailRoute: (id) => `/custody/${id}`,
    renderFields: (data) => [
      { label: "رقم الطلب", value: `#${data.id}`, icon: Hash },
      { label: "الموظف", value: data.employeeName as string, icon: User },
      { label: "المبلغ", value: data.amount ? `${data.amount} ر.س` : undefined, icon: DollarSign },
      { label: "النوع", value: data.type as string, icon: Package },
      { label: "السبب", value: data.reason as string, icon: FileText },
      { label: "ملاحظات", value: data.notes as string, icon: FileText },
    ],
  },
  "opportunities.opportunity": {
    label: "تفاصيل الفرصة",
    endpoint: (id: string | number) => API_ENDPOINTS.OPPORTUNITIES.DETAILS(String(id)),
    detailRoute: (id) => `/opportunities/${id}`,
    renderFields: (data) => [
      { label: "رقم الفرصة", value: `#${data.id}`, icon: Hash },
      { label: "العميل", value: approvalCustomerLabel(data.customer), icon: User },
      { label: "المندوب", value: (data.salesman as Record<string, unknown>)?.display_name as string, icon: User },
      { label: "الإجمالي قبل الضريبة", value: data.total_price_before_tax ? `${data.total_price_before_tax} ر.س` : undefined, icon: DollarSign },
      { label: "الإجمالي بعد الضريبة", value: data.total_price_after_tax ? `${data.total_price_after_tax} ر.س` : undefined, icon: DollarSign },
      { label: "الموقع", value: data.location as string, icon: MapPin },
      { label: "عدد الأصناف", value: data.item_count as number, icon: Package },
      { label: "ملاحظات", value: data.notes as string, icon: FileText },
    ],
  },
  "disbursements.disbursementrequest": {
    label: "تفاصيل طلب الصرف",
    endpoint: API_ENDPOINTS.DISBURSEMENT_REQUESTS.DETAILS,
    detailRoute: (id) => `/disbursements/${id}`,
    renderFields: (data) => [
      { label: "رقم الطلب", value: `#${data.id}`, icon: Hash },
      { label: "الإجمالي", value: data.total_cost ? `${data.total_cost} ر.س` : undefined, icon: DollarSign },
      { label: "مبلغ العهدة", value: data.custody_amount ? `${data.custody_amount} ر.س` : undefined, icon: DollarSign },
      { label: "مبلغ التحويل", value: data.transfer_amount ? `${data.transfer_amount} ر.س` : undefined, icon: DollarSign },
      { label: "النوع", value: (data.type as Record<string, unknown>)?.name as string, icon: Package },
      { label: "ملاحظات", value: data.notes as string, icon: FileText },
    ],
  },
};

function useEntityDetails(contentTypeLabel: string, objectId: number) {
  const config = ENTITY_MAP[contentTypeLabel];

  return useQuery({
    queryKey: ["entity-preview", contentTypeLabel, objectId],
    queryFn: async () => {
      if (!config) return null;
      const { data } = await api.get(config.endpoint(objectId));
      return data;
    },
    enabled: !!config && !!objectId,
  });
}

export function ApprovalEntityPreview({ contentTypeLabel, objectId }: ApprovalEntityPreviewProps) {
  const config = ENTITY_MAP[contentTypeLabel];
  const { data, isLoading, isError } = useEntityDetails(contentTypeLabel, objectId);

  if (!config) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Package className="h-5 w-5" />
            <span className="text-sm">نوع غير معروف: <Badge variant="outline" className="font-mono text-xs mr-1">{contentTypeLabel}</Badge></span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            {config.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-xl bg-muted" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-4 w-28 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-none shadow-sm ring-1 ring-border/50">
        <CardContent className="p-6">
          <p className="text-sm text-destructive">حدث خطأ أثناء تحميل تفاصيل العنصر</p>
        </CardContent>
      </Card>
    );
  }

  const fields = config.renderFields(data).filter((f) => f.value !== undefined && f.value !== null && f.value !== "");

  const createdAt = data.created_at
    ? format(new Date(data.created_at as string), "PPP", { locale: arSA })
    : null;

  return (
    <Card className="border-none shadow-sm ring-1 ring-primary/20 bg-primary/[0.02]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            {config.label}
          </CardTitle>
          {createdAt && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {createdAt}
              </div>
              {config.detailRoute && (
                <Link to={config.detailRoute(objectId)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  عرض التفاصيل
                </Link>
              )}
            </div>
          )}
          {!createdAt && config.detailRoute && (
              <Link to={config.detailRoute(objectId)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                  عرض التفاصيل
              </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {fields.map((field, index) => {
            const Icon = field.icon || Hash;
            return (
              <div key={index} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground font-medium">{field.label}</span>
                  <span className="font-medium text-sm truncate">{String(field.value)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
