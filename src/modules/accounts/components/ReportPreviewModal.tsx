import { useQuery } from "@tanstack/react-query";
import { Loader2, Download } from "lucide-react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReportRow {
  cells: string[];
  bold?: boolean;
  highlight?: "sub" | "alt" | "maroon" | null;
  indent?: number;
}
interface ReportData {
  title: string;
  subtitle: string;
  columns: string[];
  rows: ReportRow[];
  indent_col?: number;
  note?: string;
  note_kind?: "ok" | "warn";
}

const MAROON = "#4D010B";
const MAROON_LIGHT = "#9A2433";
const ROW_ALT = "#FAF0F1";

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Report action under /custom-v1/accounts/ (e.g. "vat-summary"). */
  endpoint: string;
  /** Query params for the report (date_from/date_to/as_of/inventory…). */
  params: Record<string, string>;
  /** Triggers the branded Excel download of the same report. */
  onDownload: () => void;
  downloadPending?: boolean;
}

export function ReportPreviewModal({
  open,
  onOpenChange,
  endpoint,
  params,
  onDownload,
  downloadPending = false,
}: ReportPreviewModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["report-preview", endpoint, params],
    queryFn: async () => {
      const res = await api.get<ReportData>(
        `/custom-v1/accounts/${endpoint}/`,
        { params: { ...params, format: "json" } },
      );
      return res.data;
    },
    enabled: open,
  });

  const indentCol = data?.indent_col ?? 0;

  const rowStyle = (r: ReportRow): React.CSSProperties => {
    if (r.highlight === "maroon") return { background: MAROON, color: "#fff" };
    if (r.highlight === "sub") return { background: MAROON_LIGHT, color: "#fff" };
    if (r.highlight === "alt") return { background: ROW_ALT };
    return {};
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden sm:max-w-[680px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>{data?.title ?? "معاينة التقرير"}</DialogTitle>
          {data?.subtitle && (
            <p className="text-sm text-muted-foreground">{data.subtitle}</p>
          )}
        </DialogHeader>

        <div className="overflow-auto" style={{ maxHeight: "62vh" }}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : isError || !data ? (
            <p className="py-10 text-center text-sm text-destructive">
              تعذّر تحميل المعاينة. حاول مرة أخرى.
            </p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {data.columns.map((c, i) => (
                    <th
                      key={i}
                      className="border px-3 py-2 font-bold text-white"
                      style={{
                        background: MAROON,
                        textAlign: i <= indentCol ? "right" : "center",
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r, ri) => (
                  <tr key={ri} style={rowStyle(r)}>
                    {r.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className="border px-3 py-1.5"
                        style={{
                          fontWeight: r.bold ? 700 : 400,
                          textAlign: ci <= indentCol ? "right" : "center",
                          paddingInlineStart:
                            ci === indentCol && r.indent
                              ? `${r.indent * 1.25 + 0.75}rem`
                              : undefined,
                          whiteSpace: ci === indentCol ? "normal" : "nowrap",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {data?.note && (
          <p
            className="text-center text-sm font-medium"
            style={{ color: data.note_kind === "warn" ? "#B00020" : "#1B7A3D" }}
          >
            {data.note}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t pt-3">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button
            type="button"
            className="gap-2"
            onClick={onDownload}
            disabled={downloadPending || isLoading}
          >
            {downloadPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            تحميل Excel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
