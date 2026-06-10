import { useState } from "react";
import { FileSpreadsheet, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStockReport, useStockReportExcel } from "@/hooks/useStockReport";
import { useStorageAreas } from "@/hooks/useStorageAreas";

const formatQty = (value: string | number) =>
  Number(value ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function StockReport() {
  const [storageArea, setStorageArea] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [hideZero, setHideZero] = useState(false);

  const params = { storage_area: storageArea, search, hide_zero: hideZero };
  const { data, isLoading } = useStockReport(params);
  const { data: areasData } = useStorageAreas({ page_size: 200 });
  const exportMutation = useStockReportExcel();

  const areas = data?.storage_areas ?? [];
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            رصيد المخازن
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            أرصدة المنتجات موزعة على المخازن في تقرير واحد
          </p>
        </div>
        <Button
          onClick={() => exportMutation.mutate(params)}
          disabled={exportMutation.isPending}
          className="gap-2 shadow-lg hover:shadow-primary/20 transition-all w-full sm:w-auto"
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          تصدير Excel
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle>قائمة الأرصدة</CardTitle>
          <CardDescription>فلتر بالمخزن أو ابحث باسم المنتج</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="space-y-1.5 w-full sm:w-56">
              <Label>المخزن</Label>
              <Select
                value={storageArea === "" ? "all" : String(storageArea)}
                onValueChange={(v) => setStorageArea(v === "all" ? "" : Number(v))}
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
            <div className="space-y-1.5 w-full sm:w-72">
              <Label>المنتج</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث باسم المنتج..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2.5">
              <Switch id="hide-zero" checked={hideZero} onCheckedChange={setHideZero} />
              <Label htmlFor="hide-zero" className="cursor-pointer">
                إخفاء الأصناف الصفرية
              </Label>
            </div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : !rows.length ? (
            <div className="p-8 text-center text-muted-foreground">لا توجد أرصدة لعرضها</div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-right whitespace-nowrap">#</TableHead>
                    <TableHead className="text-right whitespace-nowrap">المنتج</TableHead>
                    <TableHead className="text-right whitespace-nowrap">الوحدة</TableHead>
                    {areas.map((area) => (
                      <TableHead key={area.id} className="text-center whitespace-nowrap">
                        {area.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-center whitespace-nowrap">الإجمالي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    const isZero = Number(row.total) === 0;
                    return (
                      <TableRow key={row.item_id} className={isZero ? "opacity-50" : ""}>
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {row.item_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {row.unit}
                        </TableCell>
                        {areas.map((area) => (
                          <TableCell key={area.id} className="text-center font-mono">
                            {formatQty(row.quantities[String(area.id)])}
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-mono font-bold">
                          {formatQty(row.total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell />
                    <TableCell>الإجمالي</TableCell>
                    <TableCell />
                    {areas.map((area) => (
                      <TableCell key={area.id} className="text-center font-mono">
                        {formatQty(data?.totals[String(area.id)] ?? 0)}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-mono">
                      {formatQty(data?.grand_total ?? 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
