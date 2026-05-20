import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { ArrowLeft, FileText, Loader2, Calendar, Hash, ArrowUpDown, StickyNote, Paperclip } from "lucide-react";
import { useJournalEntryDetails } from "@/hooks/useJournalEntries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { AttachmentLinksList } from "@/components/shared";

export default function JournalEntryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: entry, isLoading, isError } = useJournalEntryDetails(id!);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive text-lg">فشل تحميل بيانات القيد</p>
        <Button variant="outline" onClick={() => navigate(-1)}>العودة</Button>
      </div>
    );
  }

  // Calculate totals
  const totalDebit = entry.items.reduce((sum, item) => sum + parseFloat(item.debit || "0"), 0);
  const totalCredit = entry.items.reduce((sum, item) => sum + parseFloat(item.credit || "0"), 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="space-y-6 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
              <FileText className="h-6 w-6 md:h-8 md:w-8" />
              قيد #{entry.id}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(entry.created_at), "PPPp", { locale: arSA })}
            </p>
          </div>
        </div>
        <Badge
          variant={isBalanced ? "default" : "destructive"}
          className={`text-sm px-4 py-2 ${isBalanced ? 'bg-success-light text-success hover:bg-success-light' : ''}`}
        >
          {isBalanced ? "✓ متوازن" : "✗ غير متوازن"}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">عدد البنود</p>
            <p className="text-2xl font-bold font-mono text-primary">{entry.items.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">إجمالي المدين</p>
            <p className="text-2xl font-bold font-mono text-success">{totalDebit.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
            <p className="text-2xl font-bold font-mono text-destructive">{totalCredit.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">الفرق</p>
            <p className={`text-2xl font-bold font-mono ${Math.abs(totalDebit - totalCredit) === 0 ? 'text-success' : 'text-destructive'}`}>
              {Math.abs(totalDebit - totalCredit).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entry Note */}
      {entry.note && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              ملاحظات القيد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            بنود القيد
          </CardTitle>
          <CardDescription>تفاصيل الحسابات المدينة والدائنة</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {entry.items.map((item) => (
              <div key={item.id} className="p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <Link to={`/accounts/${item.account}`} className="font-mono text-sm hover:text-primary hover:underline transition-colors">{item.account_number}</Link>
                  </div>
                  <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">
                    <Badge variant="outline">{item.account_name || "—"}</Badge>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-muted-foreground">مدين</span>
                    <p className="font-mono font-semibold text-success">
                      {parseFloat(item.debit).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-muted-foreground">دائن</span>
                    <p className="font-mono font-semibold text-destructive">
                      {parseFloat(item.credit).toLocaleString()}
                    </p>
                  </div>
                </div>
                {item.note && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <StickyNote className="h-3 w-3 inline ml-1" />
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الحساب</TableHead>
                  <TableHead className="text-right">اسم الحساب</TableHead>
                  <TableHead className="text-right">مدين</TableHead>
                  <TableHead className="text-right">دائن</TableHead>
                  <TableHead className="text-right">ملاحظة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entry.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">
                      <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">{item.account_number}</Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">{item.account_name || "—"}</Link>
                    </TableCell>
                    <TableCell className="font-mono text-success">
                      {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-destructive">
                      {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {item.note || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2} className="text-right">الإجمالي</TableCell>
                  <TableCell className="font-mono text-success">{totalDebit.toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-destructive">{totalCredit.toLocaleString()}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-primary" />
            المرفقات
            <Badge variant="secondary" className="mr-2 font-mono text-xs">
              {entry.attachments?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentLinksList
            attachments={entry.attachments}
            emptyLabel="لا توجد مرفقات لهذا القيد"
          />
        </CardContent>
      </Card>
    </div>
  );
}
