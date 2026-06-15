import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useAccrualRuns,
  useGenerateAccrualRuns,
  usePostAccrualRun,
} from "@/hooks/useAccruals";
import {
  useDepreciationRuns,
  useGenerateDepreciationRuns,
  usePostDepreciationRun,
} from "@/hooks/useFixedAssets";
import type { AccrualRun } from "@/types";
import { useCan } from "@/hooks/usePermissions";

const now = new Date();

export default function MonthEndDraftsPage() {
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // Attachment dialog state for taxable accrual drafts.
  const [taxRun, setTaxRun] = useState<AccrualRun | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { can } = useCan();
  const { data: accrualData, isLoading: accLoading } = useAccrualRuns({ status: "DRAFT" });
  const { data: depData, isLoading: depLoading } = useDepreciationRuns({ status: "DRAFT" });

  const genAccruals = useGenerateAccrualRuns();
  const genDepreciation = useGenerateDepreciationRuns();
  const postAccrual = usePostAccrualRun();
  const postDepreciation = usePostDepreciationRun();

  const accrualDrafts = accrualData?.results ?? [];
  const depDrafts = depData?.results ?? [];

  const handleGenerate = () => {
    genAccruals.mutate({ year, month });
    genDepreciation.mutate({ year, month });
  };

  const handlePostAccrual = (run: AccrualRun) => {
    if (run.is_taxable) {
      setTaxRun(run);
      setFile(null);
      return;
    }
    postAccrual.mutate({ id: run.id });
  };

  const confirmTaxablePost = () => {
    if (!taxRun || !file) return;
    postAccrual.mutate(
      { id: taxRun.id, attachment: file },
      {
        onSuccess: () => {
          setTaxRun(null);
          setFile(null);
        },
      },
    );
  };

  return (
    <div dir="rtl" className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">مسودّات آخر الشهر</h1>
        <p className="text-muted-foreground text-sm">
          راجِع المسودّات ثم رحّلها إلى الدفاتر. القوالب الخاضعة للضريبة تتطلب إرفاق الفاتورة.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-2">
            <Label>السنة</Label>
            <Input
              type="number"
              className="w-28"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>الشهر</Label>
            <Input
              type="number"
              min={1}
              max={12}
              className="w-24"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </div>
          {can(["accrual_templates.generate", "fixed_assets.generate"]) && (
          <Button
            onClick={handleGenerate}
            disabled={genAccruals.isPending || genDepreciation.isPending}
          >
            توليد مسودّات الشهر
          </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مسودّات الاستحقاق (رواتب / إيجار)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">القالب</TableHead>
                <TableHead className="text-right">الفترة</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">الصافي</TableHead>
                <TableHead className="text-right">الضريبة</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">جارٍ التحميل...</TableCell>
                </TableRow>
              ) : accrualDrafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    لا توجد مسودّات استحقاق
                  </TableCell>
                </TableRow>
              ) : (
                accrualDrafts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.template_name}</TableCell>
                    <TableCell>{r.period_year}-{String(r.period_month).padStart(2, "0")}</TableCell>
                    <TableCell>{r.gross_amount}</TableCell>
                    <TableCell>{r.net_amount}</TableCell>
                    <TableCell>
                      {r.is_taxable ? r.tax_amount : <Badge variant="outline">بدون</Badge>}
                    </TableCell>
                    <TableCell>
                      {can(["accrual_templates.post", "month_end_drafts.post"]) && (
                      <Button
                        size="sm"
                        onClick={() => handlePostAccrual(r)}
                        disabled={postAccrual.isPending}
                      >
                        ترحيل
                      </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مسودّات الإهلاك</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الأصل</TableHead>
                <TableHead className="text-right">الفترة</TableHead>
                <TableHead className="text-right">القسط</TableHead>
                <TableHead className="text-right">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {depLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center">جارٍ التحميل...</TableCell>
                </TableRow>
              ) : depDrafts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    لا توجد مسودّات إهلاك
                  </TableCell>
                </TableRow>
              ) : (
                depDrafts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.asset_name}</TableCell>
                    <TableCell>{r.period_year}-{String(r.period_month).padStart(2, "0")}</TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>
                      {can(["fixed_assets.post", "month_end_drafts.post"]) && (
                      <Button
                        size="sm"
                        onClick={() => postDepreciation.mutate(r.id)}
                        disabled={postDepreciation.isPending}
                      >
                        ترحيل
                      </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!taxRun} onOpenChange={(o) => !o && setTaxRun(null)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>إرفاق الفاتورة الضريبية</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              هذا القالب خاضع للضريبة — أرفِق الفاتورة الضريبية قبل الترحيل.
            </p>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <DialogFooter>
            {can(["accrual_templates.post", "month_end_drafts.post"]) && (
            <Button
              onClick={confirmTaxablePost}
              disabled={!file || postAccrual.isPending}
            >
              {postAccrual.isPending ? "جارٍ الترحيل..." : "ترحيل"}
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
