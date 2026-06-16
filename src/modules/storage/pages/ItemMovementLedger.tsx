import { useMemo, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useItems } from "@/hooks/useItems";
import {
  useItemMovements,
  useItemMovementsExcel,
} from "@/hooks/useItemMovements";
import { useStorageAreas } from "@/hooks/useStorageAreas";
import { useCan } from "@/hooks/usePermissions";

const formatQty = (value: string | number) =>
  Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const formatDate = (iso: string | null, exact: boolean) => {
  if (!iso) return "—";
  const day = iso.slice(0, 10);
  return exact ? day : `${day} (تقريبي)`;
};

export default function ItemMovementLedger() {
  const { can } = useCan();
  const [itemId, setItemId] = useState<number | "">("");
  const [comboOpen, setComboOpen] = useState(false);
  const [storageArea, setStorageArea] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: itemsData } = useItems({ page_size: 1000, ordering: "name" });
  const { data: areasData } = useStorageAreas({ page_size: 200 });
  const items = itemsData?.results ?? [];
  const selectedItem = useMemo(
    () => items.find((i) => i.id === itemId),
    [items, itemId],
  );

  const params = {
    item_id: itemId,
    storage_area: storageArea,
    date_from: dateFrom,
    date_to: dateTo,
  };
  const { data, isLoading, isFetching } = useItemMovements(params);
  const exportMutation = useItemMovementsExcel();

  const rows = data?.rows ?? [];
  const summary = data?.summary;
  const canExport = can(["item_movements.export"]);

  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            كشف حركة الصنف
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            كل عمليات الدخول والخروج لصنف واحد بالتسلسل، مع الرصيد بعد كل حركة
          </p>
        </div>
        {canExport && (
          <Button
            onClick={() => exportMutation.mutate(params)}
            disabled={!itemId || exportMutation.isPending}
            className="gap-2 shadow-lg hover:shadow-primary/20 transition-all w-full sm:w-auto"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            تصدير Excel
          </Button>
        )}
      </div>

      <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle>الفلاتر</CardTitle>
          <CardDescription>
            اختر الصنف، ثم قيّد بالمخزن أو الفترة عند الحاجة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-wrap">
            <div className="space-y-1.5 w-full sm:w-72">
              <Label htmlFor="ledger-item-trigger">الصنف</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id="ledger-item-trigger"
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate text-right">
                      {selectedItem ? selectedItem.name : "اختر الصنف"}
                    </span>
                    <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) p-0"
                  align="start"
                  dir="rtl"
                >
                  <Command>
                    <CommandInput placeholder="بحث باسم الصنف..." />
                    <CommandList className="max-h-64">
                      <CommandEmpty>لا يوجد صنف يطابق البحث.</CommandEmpty>
                      <CommandGroup>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            keywords={[item.name]}
                            onSelect={() => {
                              setItemId(item.id);
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                itemId === item.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="flex-1 truncate text-right">
                              {item.name}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5 w-full sm:w-56">
              <Label>المخزن</Label>
              <Select
                value={storageArea === "" ? "all" : String(storageArea)}
                onValueChange={(v) =>
                  setStorageArea(v === "all" ? "" : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="كل المخازن" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المخازن</SelectItem>
                  {(areasData?.results ?? []).map((area) => (
                    <SelectItem key={area.id} value={String(area.id)}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 w-full sm:w-40">
              <Label htmlFor="ledger-date-from">من تاريخ</Label>
              <Input
                id="ledger-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 w-full sm:w-40">
              <Label htmlFor="ledger-date-to">إلى تاريخ</Label>
              <Input
                id="ledger-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {summary && itemId && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">رصيد افتتاحي</div>
                <div className="font-mono font-bold">
                  {formatQty(summary.opening_balance)}
                </div>
              </div>
              <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-3">
                <div className="text-xs text-muted-foreground">إجمالي الداخل</div>
                <div className="font-mono font-bold text-emerald-600">
                  {formatQty(summary.total_in)}
                </div>
              </div>
              <div className="rounded-lg border bg-red-50 dark:bg-red-950/20 p-3">
                <div className="text-xs text-muted-foreground">إجمالي الخارج</div>
                <div className="font-mono font-bold text-red-600">
                  {formatQty(summary.total_out)}
                </div>
              </div>
              <div className="rounded-lg border bg-primary/5 p-3">
                <div className="text-xs text-muted-foreground">الرصيد الحالي</div>
                <div className="font-mono font-bold">
                  {formatQty(summary.closing_balance)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle>الحركات</CardTitle>
          <CardDescription>
            مرتّبة من الأقدم إلى الأحدث؛ الرصيد محسوب بعد كل حركة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!itemId ? (
            <div className="p-8 text-center text-muted-foreground">
              اختر صنفاً لعرض حركته
            </div>
          ) : isLoading || isFetching ? (
            <div className="p-8 text-center text-muted-foreground">
              جاري التحميل...
            </div>
          ) : !rows.length ? (
            <div className="p-8 text-center text-muted-foreground">
              لا توجد حركات لهذا الصنف ضمن الفلاتر المحددة
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-right whitespace-nowrap">
                      #
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      التاريخ
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      الحركة
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      المصدر
                    </TableHead>
                    <TableHead className="text-right whitespace-nowrap">
                      المخزن
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      الكمية
                    </TableHead>
                    <TableHead className="text-center whitespace-nowrap">
                      الرصيد بعدها
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    const isIn = row.movement === "IN";
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(row.date, row.date_is_exact)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              isIn
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
                            )}
                          >
                            {row.movement_label}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="font-medium">{row.source_label}</div>
                          {(row.reference || row.note) && (
                            <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                              {row.reference}
                              {row.reference && row.note ? " — " : ""}
                              {row.note}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {row.storage_area || "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-center font-mono font-medium",
                            isIn ? "text-emerald-600" : "text-red-600",
                          )}
                        >
                          {isIn ? "+" : "−"}
                          {formatQty(row.quantity)}
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">
                          {formatQty(row.balance_after)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
