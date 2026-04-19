import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, PackageOpen, Loader2, AlertCircle,
  Edit, FileText, Calculator, User, Calendar, ShoppingCart, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCustomerReturnDetails } from "@/hooks/useCustomerReturns";
import { CUSTOMER_RETURN_STATUS_LABELS, type CustomerReturnStatus } from "@/types";
import { formatCustomerReturnPartyLabel } from "@/lib/partyDisplay";

export default function CustomerReturnDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: returnData, isLoading, isError } = useCustomerReturnDetails(id || "");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل تفاصيل المرتجع...</p>
      </div>
    );
  }

  if (isError || !returnData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4 animate-in fade-in zoom-in-50 duration-300">
        <div className="bg-destructive/10 p-6 rounded-full">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">المرتجع غير موجود</h2>
        <p className="text-muted-foreground max-w-sm">
          لم يتم العثور على المرتجع المحدد. ربما تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button onClick={() => navigate("/customer-returns")} variant="outline" className="rounded-xl min-w-[150px]">
          العودة للقائمة
        </Button>
      </div>
    );
  }

  const statusInfo = CUSTOMER_RETURN_STATUS_LABELS[returnData.status as CustomerReturnStatus] || {
    label: returnData.status,
    color: "secondary",
  };
  const totalAmount = parseFloat(returnData.total_amount || "0");
  const isDraft = returnData.status === "DRAFT";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer-returns")} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">مرتجع #{returnData.id}</h1>
              <Badge variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success"}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              <User className="inline h-4 w-4 mr-1" />
              {formatCustomerReturnPartyLabel(returnData)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 items-center w-full md:w-auto">
          <Link to={`/sell-orders/${returnData.sell_order}`}>
            <Button variant="outline" className="rounded-xl gap-2 text-primary hover:text-primary hover:bg-primary/10 border-primary/20">
              <ShoppingCart className="h-4 w-4" />
              أمر البيع #{returnData.sell_order}
            </Button>
          </Link>
          {isDraft && (
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate(`/customer-returns/${returnData.id}/edit`)}>
              <Edit className="h-4 w-4" />
              تعديل
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <PackageOpen className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">إجمالي المرتجع</span>
                </div>
                <p className="text-3xl font-bold text-primary font-mono tracking-tight">
                  {totalAmount.toLocaleString()} <span className="text-sm font-normal opacity-70">ر.س</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                بنود المرتجع ({returnData.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {returnData.items && returnData.items.length > 0 ? (
                <div>
                  {/* Mobile */}
                  <div className="md:hidden flex flex-col divide-y divide-border/50">
                    {returnData.items.map((item) => (
                      <div key={item.id} className="p-4 space-y-3 hover:bg-muted/5 transition-colors">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-foreground">{item.item_name || `بند #${item.item}`}</span>
                          <span className="font-bold text-primary font-mono text-sm">
                            {parseFloat(item.line_total || "0").toLocaleString()} ر.س
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex justify-between bg-muted/20 p-2 rounded">
                            <span>الكمية:</span>
                            <span className="font-mono text-foreground">{item.quantity} {item.unit_name}</span>
                          </div>
                          <div className="flex justify-between bg-muted/20 p-2 rounded">
                            <span>السعر:</span>
                            <span className="font-mono">{parseFloat(item.unit_price || "0").toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>الكمية الأصلية:</span>
                          <Badge variant="outline" className="font-mono text-xs">{item.sell_order_item_original_quantity}</Badge>
                        </div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded border border-border/30">
                            <span className="font-semibold text-foreground/80 block mb-0.5">ملاحظات:</span>
                            <p className="whitespace-pre-wrap wrap-break-word">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0">
                        <tr className="border-b text-right">
                          <th className="p-4 font-medium text-muted-foreground w-[35%]">البند</th>
                          <th className="p-4 font-medium text-muted-foreground text-center">الكمية الأصلية</th>
                          <th className="p-4 font-medium text-muted-foreground text-center">كمية الإرجاع</th>
                          <th className="p-4 font-medium text-muted-foreground text-center">السعر</th>
                          <th className="p-4 font-medium text-muted-foreground text-left">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {returnData.items.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-4 font-medium text-foreground align-top">
                              <div>{item.item_name || `بند #${item.item}`}</div>
                              {item.notes && (
                                <div className="mt-2 flex items-start gap-1.5 bg-muted/30 p-2 rounded-md border border-border/50">
                                  <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word leading-relaxed">
                                    {item.notes}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="outline" className="font-mono text-xs">
                                {item.sell_order_item_original_quantity} {item.unit_name}
                              </Badge>
                            </td>
                            <td className="p-4 text-center">
                              <Badge variant="secondary" className="font-mono">
                                {item.quantity} {item.unit_name}
                              </Badge>
                            </td>
                            <td className="p-4 text-center font-mono">
                              {parseFloat(item.unit_price || "0").toLocaleString()}
                            </td>
                            <td className="p-4 text-left font-bold font-mono text-primary">
                              {parseFloat(item.line_total || "0").toLocaleString()} ر.س
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <PackageOpen className="h-10 w-10 mb-2 opacity-20" />
                  <p>لا توجد بنود في هذا المرتجع</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col border-t bg-muted/30 p-4 gap-3">
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-muted-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  إجمالي المرتجع
                </span>
                <span className="text-xl md:text-2xl font-bold text-primary">
                  {totalAmount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ر.س</span>
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Notes */}
          {returnData.notes && (
            <Card className="shadow-sm border-none ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap wrap-break-word">{returnData.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info */}
          <Card className="shadow-sm border-none ring-1 ring-border/50">
            <CardHeader>
              <CardTitle className="text-lg">معلومات المرتجع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  العميل
                </span>
                <span className="font-medium">{formatCustomerReturnPartyLabel(returnData, "غير محدد")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">أمر البيع</span>
                <Link to={`/sell-orders/${returnData.sell_order}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    #{returnData.sell_order}
                  </Badge>
                </Link>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ المرتجع
                </span>
                <span className="text-sm font-mono">
                  {returnData.return_date
                    ? format(new Date(returnData.return_date), "yyyy/MM/dd", { locale: arSA })
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تاريخ الإنشاء
                </span>
                <span className="text-sm font-mono">
                  {returnData.created_at
                    ? format(new Date(returnData.created_at), "yyyy/MM/dd", { locale: arSA })
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الحالة</span>
                <Badge variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success"}>
                  {statusInfo.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Approval History */}
          {(returnData.accepted_at || returnData.verified_at || returnData.rejected_at) && (
            <Card className="shadow-sm border-none ring-1 ring-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  سجل الإجراءات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {returnData.accepted_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">تمت الموافقة</span>
                    <span className="font-mono text-xs">
                      {format(new Date(returnData.accepted_at), "yyyy/MM/dd HH:mm", { locale: arSA })}
                    </span>
                  </div>
                )}
                {returnData.verified_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">تم التحقق</span>
                    <span className="font-mono text-xs">
                      {format(new Date(returnData.verified_at), "yyyy/MM/dd HH:mm", { locale: arSA })}
                    </span>
                  </div>
                )}
                {returnData.rejected_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-destructive">تم الرفض</span>
                    <span className="font-mono text-xs">
                      {format(new Date(returnData.rejected_at), "yyyy/MM/dd HH:mm", { locale: arSA })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
