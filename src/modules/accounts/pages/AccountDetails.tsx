import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Loader2, Wallet, Calendar, FileText, ArrowRightLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccountDetails } from "@/hooks/useAccounts";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AccountDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: account, isLoading, isError } = useAccountDetails(id!);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive font-medium">خطأ في تحميل بيانات الحساب</p>
        <Button variant="outline" onClick={() => navigate("/accounts")}>
          العودة للقائمة
        </Button>
      </div>
    );
  }

  // Calculate totals client-side to ensure consistency with the table entries
  const calculatedTotals = account.journal_entries?.reduce((acc, entry) => {
    const accountItems = entry.items.filter(item => item.account === account.id);
    accountItems.forEach(item => {
        acc.debit += parseFloat(item.debit || "0");
        acc.credit += parseFloat(item.credit || "0");
    });
    return acc;
  }, { debit: 0, credit: 0 }) || { debit: 0, credit: 0 };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
         <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/accounts")} className="rounded-full shrink-0">
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
                 <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                        {account.name || "حساب بدون اسم"}
                    </h1>
                    <Badge variant="outline" className="font-mono text-sm md:text-base px-2 md:px-3 shrink-0">
                        {account.number}
                    </Badge>
                 </div>
                 <p className="text-muted-foreground mt-1 text-xs md:text-sm flex items-center gap-2">
                    <Wallet className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{account.parent ? `تابع للحساب الأساسي #${account.parent}` : "حساب رئيسي"}</span>
                 </p>
            </div>
         </div>
         <div className="text-right md:text-left bg-muted/30 md:bg-transparent p-3 md:p-0 rounded-xl">
            <p className="text-xs md:text-sm text-muted-foreground mb-1">الرصيد الحالي</p>
            <p className={`text-xl md:text-2xl font-bold font-mono ${parseFloat(account.balance) < 0 ? 'text-destructive' : 'text-primary'}`} dir="ltr">
                {parseFloat(account.balance).toLocaleString()} SAR
            </p>
         </div>
      </div>

        <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Journal Entries */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-sm border-none ring-1 ring-border/50">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-primary" />
                            قيود السندات
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllAccounts(!showAllAccounts)}
                            className="gap-2 rounded-lg text-xs"
                        >
                            {showAllAccounts ? (
                                <>
                                    <EyeOff className="h-3.5 w-3.5" />
                                    إخفاء التفاصيل
                                </>
                            ) : (
                                <>
                                    <Eye className="h-3.5 w-3.5" />
                                    إظهار التفاصيل
                                </>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        {account.journal_entries && account.journal_entries.length > 0 ? (
                            <div className="overflow-x-auto">
                            <Table className="min-w-[700px]">
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="text-right w-[180px]">التاريخ</TableHead>
                                        <TableHead className="text-center w-[100px]">رقم القيد</TableHead>
                                        <TableHead className="text-right">الحساب</TableHead>
                                        <TableHead className="text-left w-[120px] text-success">مدين</TableHead>
                                        <TableHead className="text-left w-[120px] text-destructive">دائن</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {account.journal_entries.map((entry) => {
                                        const filteredItems = showAllAccounts
                                            ? entry.items
                                            : entry.items.filter(item => item.account === account.id);
                                        
                                        if (filteredItems.length === 0) return null;

                                        return filteredItems.map((item, index) => (
                                            <TableRow key={item.id} className="hover:bg-muted/5 group">
                                                {index === 0 && (
                                                    <>
                                                        <TableCell rowSpan={filteredItems.length} className="align-top font-medium text-muted-foreground border-l">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                <span className="text-xs">{format(new Date(entry.created_at), "PPP p", { locale: arSA })}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell rowSpan={filteredItems.length} className="align-top text-center border-l">
                                                            <Link to={`/journal-entries/${entry.id}`}>
                                                                <Badge variant="secondary" className="font-mono cursor-pointer hover:bg-secondary/80 transition-colors">#{entry.id}</Badge>
                                                            </Link>
                                                        </TableCell>
                                                    </>
                                                )}
                                                
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                       {item.account === account.id && <Badge variant="outline" className="text-[10px] px-1 h-5">هذا الحساب</Badge>}
                                                       {item.account !== account.id ? (
                                                           <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">
                                                               {item.account_name || `حساب #${item.account_number}`}
                                                           </Link>
                                                       ) : (
                                                           <span>{item.account_name || `حساب #${item.account_number}`}</span>
                                                       )}
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-left font-mono text-success">
                                                    {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toLocaleString() : "-"}
                                                </TableCell>
                                                
                                                <TableCell className="text-left font-mono text-destructive">
                                                    {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toLocaleString() : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ));
                                    })}
                                </TableBody>
                            </Table>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileText className="h-10 w-10 mb-2 opacity-20" />
                                <p>لا توجد قيود مسجلة لهذا الحساب</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Sidebar - Info */}
            <div className="space-y-6">
                 <Card className="shadow-sm border-none ring-1 ring-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">معلومات الحساب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">مدين</span>
                            <span className="font-mono font-medium">{calculatedTotals.debit.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">دائن</span>
                            <span className="font-mono font-medium">{calculatedTotals.credit.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/50">
                            <span className="text-muted-foreground">تاريخ الإنشاء</span>
                            <span className="font-mono text-sm">
                                {format(new Date(account.created_at), "yyyy/MM/dd")}
                            </span>
                        </div>
                        {account.note && (
                            <div className="pt-2">
                                <span className="text-muted-foreground block mb-1">ملاحظات</span>
                                <p className="text-sm bg-muted/30 p-3 rounded-lg">{account.note}</p>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    </div>
  );
}
