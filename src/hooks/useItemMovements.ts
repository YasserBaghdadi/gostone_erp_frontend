import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";

export interface ItemMovementRow {
  id: number;
  /** ISO date/datetime, or null when no date is recorded for the movement */
  date: string | null;
  /** true when `date` is the movement's own timestamp; false = source-doc fallback */
  date_is_exact: boolean;
  movement: "IN" | "OUT";
  movement_label: string;
  source_label: string;
  reference: string;
  note: string;
  storage_area: string;
  unit_name: string;
  quantity: string;
  signed_quantity: string;
  balance_after: string;
  created_by: string;
}

export interface ItemMovementLedger {
  item: { id: number; name: string; unit: string };
  storage_area: { id: number; name: string } | null;
  rows: ItemMovementRow[];
  summary: {
    opening_balance: string;
    total_in: string;
    total_out: string;
    closing_balance: string;
    count: number;
  };
}

export interface ItemMovementParams {
  item_id: number | "";
  storage_area?: number | "";
  date_from?: string;
  date_to?: string;
}

const toQuery = (params: ItemMovementParams) => ({
  storage_area: params.storage_area || undefined,
  date_from: params.date_from || undefined,
  date_to: params.date_to || undefined,
});

/** «كشف حركة الصنف»: chronological in/out ledger with running balance. */
export const useItemMovements = (params: ItemMovementParams) =>
  useQuery({
    queryKey: ["item-movements", params],
    enabled: !!params.item_id,
    queryFn: async (): Promise<ItemMovementLedger> => {
      const response = await api.get<ItemMovementLedger>(
        API_ENDPOINTS.ITEMS.MOVEMENTS(params.item_id),
        { params: toQuery(params) },
      );
      return response.data;
    },
  });

/** Downloads the branded «كشف حركة الصنف» Excel (.xlsx) with the same filters. */
export const useItemMovementsExcel = () =>
  useMutation({
    mutationFn: async (params: ItemMovementParams): Promise<void> => {
      if (!params.item_id) return;
      const response = await api.get(
        API_ENDPOINTS.ITEMS.MOVEMENTS_EXCEL(params.item_id),
        { params: toQuery(params), responseType: "blob" },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "كشف_حركة_الصنف.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error("تعذّر تصدير كشف حركة الصنف"),
  });
