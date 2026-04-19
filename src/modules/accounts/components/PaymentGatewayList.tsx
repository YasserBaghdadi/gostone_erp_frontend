import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Wallet } from "lucide-react";
import type { BasePaymentGateway } from "@/types";
import { useNavigate } from "react-router-dom";

interface PaymentGatewayListProps<T extends BasePaymentGateway> {
  data: T[];
  onEdit: (item: T) => void;
  isLoading?: boolean;
}

export function PaymentGatewayList<T extends BasePaymentGateway>({
  data,
  onEdit,
  isLoading,
}: PaymentGatewayListProps<T>) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!data?.length) {
    return <div className="p-8 text-center text-muted-foreground">لا توجد بيانات</div>;
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="grid gap-3 lg:hidden">
        {data.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground">{item.name}</span>
              {item.account && (
                <span className={`font-mono text-sm font-bold ${Number(item.account.balance) < 0 ? "text-destructive" : "text-success"}`}>
                  {Number(item.account.balance).toLocaleString()} ر.س
                </span>
              )}
            </div>
            {item.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>
            )}
            <div className="flex items-center gap-2 pt-2 border-t">
              {item.account && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => navigate(`/accounts/${item.account!.id}`)}
                >
                  <Wallet className="h-4 w-4 text-info" />
                  عرض الحساب
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => onEdit(item)}
              >
                <Edit className="h-4 w-4" />
                تعديل
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right whitespace-nowrap">الاسم</TableHead>
              <TableHead className="text-right whitespace-nowrap">الرصيد</TableHead>
              <TableHead className="text-right whitespace-nowrap">ملاحظات</TableHead>
              <TableHead className="text-left whitespace-nowrap">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.account ? (
                    <span className={Number(item.account.balance) < 0 ? "text-destructive" : "text-success"}>
                      {Number(item.account.balance).toLocaleString()} ر.س
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {item.notes || "-"}
                </TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center justify-end gap-2">
                    {item.account && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="عرض الحساب"
                        onClick={() => navigate(`/accounts/${item.account!.id}`)}
                      >
                        <Wallet className="h-4 w-4 text-info" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تعديل"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
