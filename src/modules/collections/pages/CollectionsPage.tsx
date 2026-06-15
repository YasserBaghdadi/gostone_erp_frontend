import { useState } from "react";
import { Plus, Printer, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCollections, usePrintCollection } from "@/hooks/useCollections";
import { PAYMENT_TYPE_LABELS } from "@/types";
import { RecordCollectionModal } from "../components/RecordCollectionModal";
import { useCan } from "@/hooks/usePermissions";

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "PPP", { locale: arSA });
}

export default function CollectionsPage() {
  const { can } = useCan();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: collections, isLoading } = useCollections();
  const printMutation = usePrintCollection();
  const [printingId, setPrintingId] = useState<number | null>(null);

  const handlePrint = (id: number) => {
    setPrintingId(id);
    printMutation.mutate(
      { id },
      {
        onError: () => toast.error("تعذّر توليد سند القبض"),
        onSettled: () => setPrintingId(null),
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            بوابات القبض
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            سجل قبوضات العملاء عبر جميع القنوات في مكان واحد
          </p>
        </div>
        {can("collections.record") && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shadow-lg hover:shadow-primary/20 transition-all w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل قبض</span>
            <span className="sm:hidden">تسجيل</span>
          </Button>
        )}
      </div>

      <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/95">
        <CardHeader>
          <CardTitle>قائمة القبوضات</CardTitle>
          <CardDescription>جميع المبالغ المقبوضة من العملاء</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
          ) : !collections?.length ? (
            <div className="p-8 text-center text-muted-foreground">لا توجد قبوضات</div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="grid gap-3 lg:hidden">
                {collections.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{c.customer?.name ?? "—"}</span>
                      <span className="font-mono text-sm font-bold text-success">
                        {Number(c.amount).toLocaleString()} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{PAYMENT_TYPE_LABELS[c.payment_type] ?? c.payment_type}</Badge>
                      <span className="text-muted-foreground">{c.channel_name || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>{formatDateTime(c.actual_date_time || c.created_at)}</span>
                      {c.is_verified ? (
                        <Badge variant="success">موثّقة</Badge>
                      ) : (
                        <Badge variant="secondary">غير موثّقة</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => handlePrint(c.id)}
                      disabled={printingId === c.id}
                    >
                      {printingId === c.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Printer className="h-3.5 w-3.5" />
                      )}
                      طباعة سند القبض
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right whitespace-nowrap">العميل</TableHead>
                      <TableHead className="text-right whitespace-nowrap">النوع</TableHead>
                      <TableHead className="text-right whitespace-nowrap">القناة</TableHead>
                      <TableHead className="text-right whitespace-nowrap">المبلغ</TableHead>
                      <TableHead className="text-right whitespace-nowrap">التاريخ</TableHead>
                      <TableHead className="text-right whitespace-nowrap">الحالة</TableHead>
                      <TableHead className="text-right whitespace-nowrap">سند القبض</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium whitespace-nowrap">{c.customer?.name ?? "—"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="outline">{PAYMENT_TYPE_LABELS[c.payment_type] ?? c.payment_type}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{c.channel_name || "—"}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-success">
                          {Number(c.amount).toLocaleString()} ر.س
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(c.actual_date_time || c.created_at)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {c.is_verified ? (
                            <Badge variant="success">موثّقة</Badge>
                          ) : (
                            <Badge variant="secondary">غير موثّقة</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => handlePrint(c.id)}
                            disabled={printingId === c.id}
                          >
                            {printingId === c.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Printer className="h-3.5 w-3.5" />
                            )}
                            طباعة
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <RecordCollectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
