import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";

export interface StockReportRow {
  item_id: number;
  item_name: string;
  unit: string;
  /** quantity per storage area id (keys are stringified ids) */
  quantities: Record<string, string>;
  total: string;
}

export interface StockReportData {
  storage_areas: { id: number; name: string }[];
  rows: StockReportRow[];
  totals: Record<string, string>;
  grand_total: string;
}

export interface StockReportParams {
  storage_area?: number | "";
  search?: string;
  hide_zero?: boolean;
}

const toQuery = (params: StockReportParams) => ({
  storage_area: params.storage_area || undefined,
  search: params.search || undefined,
  hide_zero: params.hide_zero ? "1" : undefined,
});

/** «رصيد المخازن»: items × storage areas balance matrix. */
export const useStockReport = (params: StockReportParams) =>
  useQuery({
    queryKey: ["stock-report", params],
    queryFn: async (): Promise<StockReportData> => {
      const response = await api.get<StockReportData>(API_ENDPOINTS.ITEMS.STOCK_REPORT, {
        params: toQuery(params),
      });
      return response.data;
    },
  });

/** Downloads the branded «رصيد المخازن» Excel (.xlsx) with the same filters. */
export const useStockReportExcel = () =>
  useMutation({
    mutationFn: async (params: StockReportParams): Promise<void> => {
      const response = await api.get(API_ENDPOINTS.ITEMS.STOCK_REPORT_EXCEL, {
        params: toQuery(params),
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "رصيد_المخازن.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: () => toast.error("تعذّر تصدير رصيد المخازن"),
  });
