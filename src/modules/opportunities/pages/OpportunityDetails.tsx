import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowRight, FileText, Calendar, Phone, MapPin, Edit, Calculator, User, Loader2, Printer } from "lucide-react";
import { 
  useOpportunityDetails,
  useRequestMeasurements,
  useCreateSellOrder,
  usePrintQuotation,
  useOpenDimensionFile
} from "@/hooks/useOpportunities";
import { useItems } from "@/hooks/useItems";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { INTEREST_LEVELS, STATUS_LABELS } from "@/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { parseBackendError } from "@/lib/utils";
import CompleteCompanyDataModal from "@/modules/customers/components/CompleteCompanyDataModal";

export default function OpportunityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: opportunity, isLoading, isError } = useOpportunityDetails(id!);
  const { data: itemsData } = useItems({ page_size: 1000 });
  const requestMeasurementsMutation = useRequestMeasurements();
  const createSellOrderMutation = useCreateSellOrder();
  const printQuotationMutation = usePrintQuotation();
  const openDimensionFileMutation = useOpenDimensionFile();
  const [confirmAction, setConfirmAction] = useState<"measurements" | "sellOrder" | null>(null);
  // العميل الذي يجب إكمال بياناته (شركة) قبل إصدار الأمر — يفتح نافذة البيانات.
  const [companyDataCustomerId, setCompanyDataCustomerId] = useState<number | null>(null);

  const itemNameMap = useMemo(() => {
    const map = new Map<number, string>();
    if (itemsData?.results) {
      for (const item of itemsData.results) {
        map.set(item.id, item.name);
      }
    }
    return map;
  }, [itemsData]);
  

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (isError || !opportunity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-in fade-in zoom-in-50 duration-500">
        <div className="bg-muted/30 p-8 rounded-full">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">الفرصة غير موجودة</h2>
        <Button onClick={() => navigate("/opportunities")} variant="outline" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            عودة للقائمة
        </Button>
      </div>
    );
  }

  const handleRequestMeasurements = () => {
      requestMeasurementsMutation.mutate({ id: opportunity.id.toString() }, {
          onSuccess: () => {
              toast.success("تم إرسال طلب المقاسات بنجاح");
          },
          onError: () => {
              toast.error("فشل إرسال طلب المقاسات");
          }
      });
      setConfirmAction(null);
  };

  const handleCreateSellOrder = () => {
      createSellOrderMutation.mutate({ id: opportunity.id.toString() }, {
          onSuccess: (data: unknown) => {
              toast.success("تم إنشاء أمر البيع بنجاح");
              // بعد التحويل ننتقل لأمر البيع ونغادر صفحة الفرصة.
              const sellOrderId = (data as { sell_order_id?: number | string })?.sell_order_id;
              if (sellOrderId) {
                  navigate(`/sell-orders/${sellOrderId}`);
              }
          },
          onError: (error: unknown) => {
              const data = (error as { response?: { data?: { company_data_required?: boolean; customer_id?: number } } })?.response?.data;
              // عميل شركة ناقص بياناته → افتح نافذة إكمال البيانات بدل رسالة فقط.
              if (data?.company_data_required && data?.customer_id) {
                  setCompanyDataCustomerId(data.customer_id);
                  return;
              }
              toast.error(parseBackendError(error) || "فشل إنشاء أمر البيع");
          }
      });
      setConfirmAction(null);
  };

  const handlePrintQuotation = () => {
      printQuotationMutation.mutate({ id: opportunity.id.toString() }, {
          onSuccess: () => {
              toast.success("تم تجهيز عرض السعر");
          },
          onError: () => {
              toast.error("فشل طباعة عرض السعر");
          }
      });
  };

  // Safe checks and fallbacks
  const statusKey = opportunity.status || 'new';
  const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS['new'];
  const interestLevelKey = opportunity.interest_level as keyof typeof INTEREST_LEVELS || 'interested';
  const interestInfo = INTEREST_LEVELS[interestLevelKey];

  const customerName = opportunity.customer
    ? formatCustomerWithBalance(opportunity.customer)
    : opportunity.clientName || "عميل غير معروف";
  const customerPhone = opportunity.customer?.phone_number || opportunity.clientPhone || "";
  
  const totalPrice = parseFloat(opportunity.total_price_after_tax || "0");
  const totalCounterOffer = parseFloat(opportunity.total_counter_offer || "0");
  const createdDate = opportunity.created_at || new Date().toISOString();

  return (
    <>
    <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-12" dir="rtl">
      
       {/* Header with Glassmorphism */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
             <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/opportunities")} className="rounded-xl hover:bg-muted/50 h-10 w-10">
                    <ArrowRight className="h-5 w-5" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex flex-wrap items-center gap-3 break-words">
                        {opportunity.customer?.id ? (
                            <Link to={`/customers/${opportunity.customer.id}`} className="hover:text-primary hover:underline transition-colors">
                                {customerName}
                            </Link>
                        ) : customerName}
                        <Badge variant={statusInfo.color as any} className="text-sm px-2.5 py-0.5 shadow-sm rounded-lg">
                            {statusInfo.label}
                        </Badge>
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md">
                            <Calendar className="h-3.5 w-3.5" />
                            <span dir="ltr">{new Date(createdDate).toLocaleDateString()}</span>
                        </span>
                         <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md font-mono text-xs opacity-70">
                            #{opportunity.id.toString().slice(0, 8)}
                        </span>
                    </div>
                </div>
            </div>
            
             <div className="flex items-center gap-2 w-full md:w-auto">
                 <Button 
                     variant="outline" 
                     size="sm" 
                     className="gap-2 rounded-lg" 
                     onClick={handlePrintQuotation}
                     disabled={printQuotationMutation.isPending}
                 >
                     {printQuotationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                     طباعة عرض السعر
                 </Button>
                
                 {opportunity.status !== 'converted' && opportunity.status !== 'rejected' && opportunity.status !== 'work_order_pending' && (
                     <>
                         <Link to={`/opportunities/${opportunity.id}/edit`}>
                             <Button variant="outline" size="sm" className="hidden md:flex gap-2 rounded-lg">
                                <Edit className="h-4 w-4" />
                                تعديل
                             </Button>
                         </Link>

                        {/* متاح دائماً ما لم يوجد طلب مقاسات مفتوح — لإعادة طلب المقاس */}
                        {!opportunity.need_dim_order && (
                             <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2 rounded-lg"
                                onClick={() => setConfirmAction("measurements")}
                                disabled={requestMeasurementsMutation.isPending}
                             >
                                {requestMeasurementsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                {opportunity.dimensions && opportunity.dimensions.length > 0 ? "طلب مقاسات جديد" : "طلب مقاسات"}
                             </Button>
                        )}
                        
                         {/* Create Sell Order Button - Hide if already has sell order */}
                          {!opportunity.have_sell_order && (
                            <Button 
                               size="sm" 
                               className="gap-2 rounded-lg shadow-lg shadow-primary/20" 
                               onClick={() => setConfirmAction("sellOrder")}
                               disabled={createSellOrderMutation.isPending}
                            >
                               {createSellOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                               إنشاء أمر بيع
                            </Button>
                          )}
                     </>
                 )}
            </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
            
            {/* Items Card */}
            <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        تفاصيل البنود والأسعار
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {opportunity.items && opportunity.items.length > 0 ? (
                        <>
                             {/* Mobile View: Cards */}
                            <div className="md:hidden flex flex-col divide-y divide-border/50">
                                {opportunity.items.map((item, index) => {
                                    const itemPrice = parseFloat(item.unit_price_after_tax || "0");
                                    const itemQuantity = parseFloat(item.quantity.toString());
                                    const itemTotal = itemPrice * itemQuantity;
                                    const resolvedItemName = typeof item.item === 'object' ? item.item?.name : (item.name || (item.item ? itemNameMap.get(item.item as number) : undefined));

                                    const itemId = typeof item.item === 'object' ? item.item?.id : item.item;

                                    return (
                                        <div key={item.id ?? `item-${index}`} className="p-4 space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="flex justify-between items-start">
                                                {itemId ? (
                                                    <Link to={`/items/${itemId}`} className="font-medium text-foreground hover:text-primary hover:underline transition-colors block">
                                                        {resolvedItemName || 'بند غير معروف'}
                                                    </Link>
                                                ) : (
                                                    <span className="font-medium text-foreground">{resolvedItemName || 'بند غير معروف'}</span>
                                                )}
                                                <Badge variant="outline" className="text-xs bg-background">{itemPrice.toLocaleString()} ر.س</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                 <div className="flex justify-between">
                                                    <span>الكمية:</span>
                                                    <span className="font-mono text-foreground">{itemQuantity} {item.unit_name}</span>
                                                 </div>
                                                 {parseFloat(item.dis_percentage?.toString() || "0") > 0 && (
                                                     <div className="flex justify-between text-success">
                                                        <span>خصم البند:</span>
                                                        <span className="font-bold">{item.dis_percentage}%</span>
                                                     </div>
                                                 )}
                                            </div>
                                             {item.notes && (
                                                <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded mt-1 border border-border/30 w-full overflow-hidden">
                                                    <span className="font-semibold text-foreground/80 mb-0.5 block">ملاحظات:</span>
                                                    <p className="whitespace-pre-wrap break-words break-all">{item.notes}</p>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                                <span className="text-xs font-bold text-muted-foreground">الإجمالي</span>
                                                <span className="font-bold text-primary">{itemTotal.toLocaleString()} ر.س</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                             {/* Desktop View: Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/30">
                                        <tr className="border-b transition-colors text-right">
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[25%]">البند</th>
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">السعر</th>
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">الكمية</th>
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">الوحدة</th>
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">الخصم</th>
                                            <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-center">الإجمالي</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {opportunity.items.map((item, index) => {
                                             const itemPrice = parseFloat(item.unit_price_after_tax || "0");
                                             const itemQuantity = parseFloat(item.quantity.toString());
                                             const itemTotal = itemPrice * itemQuantity;
                                             const resolvedItemName = typeof item.item === 'object' ? item.item?.name : (item.name || (item.item ? itemNameMap.get(item.item as number) : undefined));

                                             const itemId = typeof item.item === 'object' ? item.item?.id : item.item;

                                            return (
                                                <tr key={item.id ?? `item-${index}`} className="hover:bg-muted/5 transition-colors">
                                                    <td className="p-4 align-top font-medium">
                                                        {itemId ? (
                                                            <Link to={`/items/${itemId}`} className="hover:text-primary hover:underline transition-colors block">
                                                                {resolvedItemName || 'بند غير معروف'}
                                                            </Link>
                                                        ) : (
                                                            <div>{resolvedItemName || 'بند غير معروف'}</div>
                                                        )}
                                                        {item.notes && (
                                                            <div className="mt-2 flex items-start gap-1.5 bg-muted/30 p-2 rounded-md border border-border/50 w-full overflow-hidden">
                                                                <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                                                                <p className="text-xs text-muted-foreground whitespace-pre-wrap break-words break-all leading-relaxed min-w-0 flex-1">
                                                                    <span className="font-semibold text-foreground/70 ml-1">ملاحظة:</span>
                                                                    {item.notes}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-middle text-center">{itemPrice.toLocaleString()}</td>
                                                    <td className="p-4 align-middle text-center">{itemQuantity}</td>
                                                    <td className="p-4 align-middle text-center">
                                                        <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground hover:bg-muted">
                                                            {item.unit_name === 'meter' ? 'متر' : 
                                                             item.unit_name === 'sqm' ? 'م²' : 
                                                             item.unit_name === 'pcs' ? 'حبة' : 
                                                             item.unit_name === 'job' ? 'مقطوعية' : item.unit_name}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle text-center font-mono text-success">
                                                        {parseFloat(item.dis_percentage?.toString() || "0") > 0 ? `${item.dis_percentage}%` : '-'}
                                                    </td>
                                                    <td className="p-4 align-middle font-bold text-primary text-center">
                                                        {itemTotal.toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                         <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 mb-2 opacity-20" />
                            <p>لا يوجد بنود مضافة لهذه الفرصة</p>
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex flex-col border-t bg-muted/30 p-4 gap-3">
                        <div className="flex justify-between items-center w-full">
                            <span className="font-semibold text-muted-foreground flex items-center gap-2">
                                 <Calculator className="h-4 w-4" />
                                الإجمالي الكلي شامل الضريبة
                            </span>
                            <span className="text-xl md:text-2xl font-bold text-primary">
                                {totalPrice.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ر.س</span>
                            </span>
                        </div>

                        {totalCounterOffer > 0 && (
                            <div className="flex justify-between items-center w-full text-sm py-2 border-t border-dashed border-border/50 bg-info-light px-3 rounded-lg">
                                <span className="text-muted-foreground font-medium flex items-center gap-2">
                                    <Calculator className="h-3.5 w-3.5 text-info" />
                                    إجمالي العرض المقابل
                                </span>
                                <span className="font-bold text-info-dark text-lg">
                                    {totalCounterOffer.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
                                </span>
                            </div>
                        )}

                        {parseFloat(opportunity.dis_percentage || "0") > 0 && (
                            <div className="flex justify-between items-center w-full text-sm py-1 border-t border-dashed border-border/50">
                                <span className="text-muted-foreground font-medium">نسبة الخصم الكلية:</span>
                                <span className="font-bold text-success">{opportunity.dis_percentage}%</span>
                            </div>
                        )}
                </CardFooter>
            </Card>

            {/* Notes Section if exists */}
            {opportunity.notes && (
                 <Card className="shadow-sm border-none ring-1 ring-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                             <FileText className="h-4 w-4 text-muted-foreground" />
                            ملاحظات عامة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed bg-muted/10 p-4 rounded-lg border border-border/50">
                            {opportunity.notes}
                        </p>
                    </CardContent>
                </Card>
            )}

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
             {/* Client Info Card */}
             <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-4 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-primary" />
                        بيانات العميل
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between p-2 bg-muted/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">التواصل</div>
                        <div className="flex items-center gap-2 text-sm font-medium" dir="ltr">
                             <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                             {customerPhone ? (
                               <a href={`tel:${customerPhone}`} className="hover:text-primary hover:underline transition-colors">{customerPhone}</a>
                             ) : "-"}
                        </div>
                    </div>
                     <Separator className="opacity-50" />
                     <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">مستوى الاهتمام</div>
                        <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${interestInfo?.color?.split(" ")[0] || 'bg-muted-foreground'}`} />
                            <span className="text-sm font-medium">{interestInfo?.label || 'غير محدد'}</span>
                        </div>
                    </div>
                </CardContent>
             </Card>

             {/* Dimensions/Measurements Card */}
             {opportunity.dimensions && opportunity.dimensions.length > 0 && (
                 <Card className="shadow-sm border-none ring-1 ring-border/50">
                     <CardHeader className="pb-4 border-b border-border/50">
                         <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-4 w-4 text-primary" />
                            ملفات المقاسات
                         </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4 pt-4">
                         {opportunity.dimensions.map((dim) => (
                             <div key={dim.id} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-lg border border-border/50">
                                 <div className="flex items-center justify-between">
                                     <span className="text-sm font-medium">ملف #{dim.id}</span>
                                     <span className="text-xs text-muted-foreground" dir="ltr">
                                         {new Date(dim.created_at).toLocaleDateString()}
                                     </span>
                                 </div>
                                 {dim.notes && (
                                     <p className="text-sm text-muted-foreground bg-background/50 p-2 rounded text-xs break-words">
                                         {dim.notes}
                                     </p>
                                 )}
                                 <button
                                     type="button"
                                     onClick={() => openDimensionFileMutation.mutate(dim.id)}
                                     disabled={openDimensionFileMutation.isPending}
                                     className="flex items-center gap-2 text-xs text-primary hover:underline mt-1 disabled:opacity-50"
                                 >
                                     <FileText className="h-3 w-3" />
                                     {openDimensionFileMutation.isPending ? "جارٍ الفتح..." : "عرض الملف"}
                                 </button>
                             </div>
                         ))}
                     </CardContent>
                 </Card>
             )}

             {/* Project Details Card */}
             <Card className="shadow-sm border-none ring-1 ring-border/50">
                 <CardHeader className="pb-4 border-b border-border/50">
                     <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4 text-primary" />
                        تفاصيل المشروع
                     </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-5 pt-6">
                      <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
                          <div>
                              <p className="text-xs text-muted-foreground mb-1">الموقع</p>
                              <p className="text-sm font-medium break-words whitespace-pre-wrap">{opportunity.location || 'غير محدد'}</p>
                          </div>
                      </div>
                      
                      {totalCounterOffer > 0 && (
                          <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                             <Calculator className="h-4 w-4 mt-1 text-destructive shrink-0" />
                             <div>
                                  <p className="text-xs text-destructive/80 mb-1">العرض المضاد / عرض العميل</p>
                                  <p className="text-sm font-bold text-destructive">{totalCounterOffer.toLocaleString()} ر.س</p>
                             </div>
                          </div>
                      )}

                       <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm text-muted-foreground">يحتاج مقاسات</span>
                            {opportunity.need_dim_order ? (
                                  <Badge variant="default" className="text-xs">نعم</Badge>
                              ) : (
                                  <Badge variant="secondary" className="text-xs">لا</Badge>
                              )}
                       </div>
                 </CardContent>
             </Card>
        </div>
      </div>
    </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={confirmAction === "measurements"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleRequestMeasurements}
        title="تأكيد طلب المقاسات"
        description="هل أنت متأكد من إرسال طلب المقاسات لهذه الفرصة؟"
        confirmText="إرسال الطلب"
        variant="default"
        isLoading={requestMeasurementsMutation.isPending}
      />
      <ConfirmModal
        isOpen={confirmAction === "sellOrder"}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleCreateSellOrder}
        title="تأكيد إنشاء أمر بيع"
        description="هل أنت متأكد من إنشاء أمر بيع من هذه الفرصة؟"
        confirmText="إنشاء أمر بيع"
        variant="success"
        isLoading={createSellOrderMutation.isPending}
      />
      <CompleteCompanyDataModal
        customerId={companyDataCustomerId}
        open={companyDataCustomerId !== null}
        onClose={() => setCompanyDataCustomerId(null)}
        onCompleted={() => {
          // بعد حفظ بيانات الشركة، أغلق النافذة وأعد إصدار الأمر تلقائياً.
          setCompanyDataCustomerId(null);
          handleCreateSellOrder();
        }}
      />
    </>
  );
}
