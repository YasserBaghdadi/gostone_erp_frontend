import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "@/hooks/usePagination";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: readonly number[];
  entityName?: string;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  entityName = "عنصر",
}: PaginationProps) {
  if (totalCount === 0) return null;

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  const [gotoValue, setGotoValue] = useState(String(safePage));

  useEffect(() => {
    setGotoValue(String(safePage));
  }, [safePage]);

  const clampPage = (p: number) => Math.min(Math.max(1, p), safeTotalPages);

  const pages = useMemo(() => {
    // windowed pagination with ellipsis
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const windowSize = 2; // pages around current
    const left = Math.max(2, safePage - windowSize);
    const right = Math.min(safeTotalPages - 1, safePage + windowSize);

    const out: Array<number | "…"> = [1];
    if (left > 2) out.push("…");
    for (let p = left; p <= right; p++) out.push(p);
    if (right < safeTotalPages - 1) out.push("…");
    out.push(safeTotalPages);
    return out;
  }, [safePage, safeTotalPages]);

  const commitGoto = () => {
    const n = Number(String(gotoValue).replace(/\D/g, ""));
    if (!Number.isFinite(n) || n <= 0) {
      setGotoValue(String(safePage));
      return;
    }
    const next = clampPage(n);
    setGotoValue(String(next));
    if (next !== safePage) onPageChange(next);
  };

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t"
      aria-label="التنقل بين الصفحات"
      role="navigation"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          عرض {startItem} إلى {endItem} من {totalCount} {entityName}
        </p>
        {onPageSizeChange && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-[100px] text-xs rounded-lg"
              aria-label="عدد العناصر في الصفحة"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / صفحة
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2" role="group" aria-label="أزرار التنقل">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={safePage === 1 || isLoading}
            className="gap-1"
            aria-label="الانتقال للصفحة الأولى"
          >
            الأولى
          </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1 || isLoading}
          className="gap-1"
          aria-label={`الانتقال للصفحة السابقة، الصفحة ${safePage - 1}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          السابق
        </Button>
          <div className="flex items-center gap-1.5" aria-label="أرقام الصفحات">
            {pages.map((p, idx) =>
              p === "…" ? (
                <span key={`e-${idx}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  variant={p === safePage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  className="h-8 min-w-8 px-2 font-mono"
                  aria-current={p === safePage ? "page" : undefined}
                  aria-label={`الانتقال إلى الصفحة ${p}`}
                >
                  {p}
                </Button>
              ),
            )}
          </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages || isLoading}
          className="gap-1"
          aria-label={`الانتقال للصفحة التالية، الصفحة ${safePage + 1}`}
        >
          التالي
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(safeTotalPages)}
            disabled={safePage >= safeTotalPages || isLoading}
            className="gap-1"
            aria-label="الانتقال للصفحة الأخيرة"
          >
            الأخيرة
          </Button>
        </div>

        <div className="flex items-center gap-2" aria-label="اذهب إلى صفحة">
          <span className="text-xs text-muted-foreground">اذهب لصفحة</span>
          <Input
            value={gotoValue}
            onChange={(e) => setGotoValue(e.target.value)}
            onBlur={commitGoto}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitGoto();
              }
            }}
            inputMode="numeric"
            className="h-8 w-20 rounded-lg text-center font-mono"
            disabled={isLoading}
            aria-label="اذهب إلى صفحة رقم"
          />
          <span className="text-xs text-muted-foreground">
            من {safeTotalPages}
          </span>
        </div>
      </div>
    </nav>
  );
}
