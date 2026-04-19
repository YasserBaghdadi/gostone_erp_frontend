import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Eye, EyeOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomerTransaction } from "@/types";

interface CustomerTransactionsTableProps {
  transactions: CustomerTransaction[];
  accountId?: number;
}

export function CustomerTransactionsTable({ transactions, accountId }: CustomerTransactionsTableProps) {
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/20">
        لا يوجد سجل للمعاملات المالية
      </div>
    );
  }

  const filterItems = (items: CustomerTransaction["items"]) => {
    if (showAllAccounts || !accountId) return items;
    return items.filter(item => item.account === accountId);
  };

  return (
    <>
      {accountId && (
        <div className="flex justify-end mb-4">
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
        </div>
      )}

      <div className="md:hidden space-y-4">
        {transactions.map((transaction) => {
          const filteredItems = filterItems(transaction.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={transaction.id} className="bg-card p-4 rounded-xl border shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-bold text-muted-foreground">#{transaction.id}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(transaction.created_at), "PPP", { locale: arSA })}
                </span>
              </div>
              
              <div className="space-y-3 pt-2">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-muted/30 p-3 rounded-lg flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm">
                         {(item.account_name && item.account_name !== "string" && item.account_name !== "") ? (
                           <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">
                             {item.account_name}
                           </Link>
                         ) : (
                           <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">
                             {`حساب #${item.account_number}`}
                           </Link>
                         )}
                      </span>
                      <Link to={`/journal-entries/${item.journal_entry}`}>
                        <Badge variant="outline" className="font-mono text-xs cursor-pointer hover:bg-secondary/80 transition-colors">#{item.journal_entry}</Badge>
                      </Link>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex flex-col">
                         <span className="text-[10px] text-muted-foreground">مدين</span>
                         <span className={`font-mono font-bold ${parseFloat(item.debit) > 0 ? "text-success" : "text-muted-foreground"}`} dir="ltr">
                            {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toLocaleString() : "-"}
                         </span>
                      </div>

                      <div className="flex flex-col items-end">
                         <span className="text-[10px] text-muted-foreground">دائن</span>
                         <span className={`font-mono font-bold ${parseFloat(item.credit) > 0 ? "text-destructive" : "text-muted-foreground"}`} dir="ltr">
                            {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toLocaleString() : "-"}
                         </span>
                      </div>
                    </div>
                    
                    {item.order && (
                      <div className="border-t pt-2 mt-1 flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">رقم الطلب</span>
                          <Link to={`/sell-orders/${item.order}`}>
                            <Badge variant="secondary" className="font-mono text-xs cursor-pointer hover:bg-secondary/80 transition-colors">#{item.order}</Badge>
                          </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-right w-[100px] whitespace-nowrap">رقم العملية</TableHead>
              <TableHead className="text-right w-[180px] whitespace-nowrap">التاريخ</TableHead>
              <TableHead className="text-center w-[100px] whitespace-nowrap">القيد</TableHead>
              <TableHead className="text-right min-w-[200px]">الحساب</TableHead>
              <TableHead className="text-left w-[120px] whitespace-nowrap">مدين</TableHead>
              <TableHead className="text-left w-[120px] whitespace-nowrap">دائن</TableHead>
              <TableHead className="text-center w-[100px] whitespace-nowrap">رقم الطلب</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
               const filteredItems = filterItems(transaction.items);
               if (filteredItems.length === 0) return null;

               return filteredItems.map((item, index) => (
              <TableRow key={item.id} className="hover:bg-muted/5 group">
                {index === 0 && (
                    <>
                        <TableCell rowSpan={filteredItems.length} className="align-top font-medium text-muted-foreground border-l whitespace-nowrap">#{transaction.id}</TableCell>
                        <TableCell rowSpan={filteredItems.length} className="align-top border-l whitespace-nowrap">
                          {format(new Date(transaction.created_at), "PPP p", { locale: arSA })}
                        </TableCell>
                    </>
                 )}
  
                <TableCell className="text-center">
                   <Link to={`/journal-entries/${item.journal_entry}`}>
                     <Badge variant="outline" className="font-mono cursor-pointer hover:bg-secondary/80 transition-colors">#{item.journal_entry}</Badge>
                   </Link>
                </TableCell>
                
                <TableCell className="font-medium whitespace-nowrap">
                   {(item.account_name && item.account_name !== "string" && item.account_name !== "") ? (
                      <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors">
                        {item.account_name}
                      </Link>
                   ) : (
                      <Link to={`/accounts/${item.account}`} className="hover:text-primary hover:underline transition-colors block">
                        <span className="text-muted-foreground font-mono text-xs">حساب #{item.account_number}</span>
                      </Link>
                   )}
                </TableCell>
  
                <TableCell className="text-left font-mono text-success font-bold whitespace-nowrap" dir="ltr">
                    {parseFloat(item.debit) > 0 ? parseFloat(item.debit).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-left font-mono text-destructive font-bold whitespace-nowrap" dir="ltr">
                    {parseFloat(item.credit) > 0 ? parseFloat(item.credit).toLocaleString() : "-"}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                   {item.order ? (
                     <Link to={`/sell-orders/${item.order}`}>
                       <Badge variant="secondary" className="font-mono cursor-pointer hover:bg-secondary/80 transition-colors">#{item.order}</Badge>
                     </Link>
                   ) : "-"}
                </TableCell>
              </TableRow>
               ));
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
