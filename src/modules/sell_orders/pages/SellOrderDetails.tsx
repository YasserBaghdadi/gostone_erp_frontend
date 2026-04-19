import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Phone,
  MapPin,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  FileText,
  Edit,
  Printer,
  PackageOpen,
  Upload,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { SellOrderInvoiceOdooBadge } from "@/components/shared/SellOrderInvoiceOdooBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSellOrderDetails,
  usePrintSellOrder,
  useUploadSellOrderInvoice,
  sellOrderHasInvoice,
  usePushSellOrderToOdoo,
} from "@/hooks/useSellOrders";
import { parseBackendError } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { toast } from "sonner";

/** مسار أو رابط ملف الفاتورة من الـ API لعرضه في المتصفح */
function buildInvoiceFileHref(raw: string | null | undefined): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function invoiceUrlViewerKind(url: string): "pdf" | "image" | "unknown" {
  const path = url.split("?")[0].split("#")[0].toLowerCase();
  if (path.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path)) return "image";
  return "unknown";
}

export default function SellOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const invoiceBlobRef = useRef<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [pendingInvoiceFile, setPendingInvoiceFile] = useState<File | null>(null);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);
  const [didPushToOdoo, setDidPushToOdoo] = useState(false);
  const [odooConfirmOpen, setOdooConfirmOpen] = useState(false);

  const { data: sellOrder, isLoading, isError } = useSellOrderDetails(id || "");
  const printMutation = usePrintSellOrder();
  const uploadInvoiceMutation = useUploadSellOrderInvoice();
  const pushToOdooMutation = usePushSellOrderToOdoo();

  const setInvoiceBlobUrl = (next: string | null) => {
    if (invoiceBlobRef.current) {
      URL.revokeObjectURL(invoiceBlobRef.current);
      invoiceBlobRef.current = null;
    }
    if (next) {
      invoiceBlobRef.current = next;
    }
    setInvoicePreviewUrl(next);
  };

  useEffect(() => {
    return () => {
      if (invoiceBlobRef.current) {
        URL.revokeObjectURL(invoiceBlobRef.current);
        invoiceBlobRef.current = null;
      }
    };
  }, []);

  const closeInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setPendingInvoiceFile(null);
    setInvoiceBlobUrl(null);
    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = "";
    }
  };

  const openInvoicePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setInvoiceBlobUrl(url);
    setPendingInvoiceFile(file);
    setInvoiceDialogOpen(true);
  };

  const handleConfirmInvoiceUpload = () => {
    if (!pendingInvoiceFile || !id) return;
    uploadInvoiceMutation.mutate(
      { id, file: pendingInvoiceFile },
      {
        onSuccess: () => {
          toast.success("تم رفع الفاتورة بنجاح");
          closeInvoiceDialog();
        },
        onError: (err) => toast.error(parseBackendError(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !sellOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4 animate-in fade-in zoom-in-50 duration-300" dir="rtl">
        <div className="bg-destructive/10 p-6 rounded-full">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">أمر البيع غير موجود</h2>
        <p className="text-muted-foreground max-w-sm">
          لم يتم العثور على أمر البيع المحدد. ربما تم حذفه أو أن الرابط غير صحيح.
        </p>
        <Button onClick={() => navigate("/sell-orders")} variant="outline" className="rounded-xl min-w-[150px]">العودة للقائمة</Button>
      </div>
    );
  }

  const totalPrice = parseFloat(sellOrder.total_price_after_tax || "0");
  const customer = sellOrder.customer;
  const hasInvoice = sellOrderHasInvoice(sellOrder);
  const invoiceHref = hasInvoice
    ? buildInvoiceFileHref(sellOrder.invoice_file)
    : "";
  const invoiceKind = invoiceHref ? invoiceUrlViewerKind(invoiceHref) : "unknown";
  const shouldShowPushToOdoo = !hasInvoice && !didPushToOdoo;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-12 text-right" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sell-orders")} className="rounded-xl hover:bg-muted/50 h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">تفاصيل أمر البيع</h2>
              <Badge variant="outline" className="font-mono text-xs bg-muted/50 border-border/50">#{sellOrder.id}</Badge>
              <SellOrderInvoiceOdooBadge isSynced={hasInvoice} />
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              عرض تفاصيل أمر البيع والبنود
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={invoiceInputRef}
            type="file"
            className="sr-only"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            aria-hidden
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              openInvoicePreview(file);
            }}
          />
          <Badge variant="success" className="text-sm px-4 py-1.5 rounded-lg shadow-sm">
            أمر بيع
          </Badge>
          <Link to={`/purchase-orders/${sellOrder.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg gap-2 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
            >
              <ShoppingCart className="h-4 w-4" />
              طلب الشراء المرتبط
            </Button>
          </Link>
          <Link to={`/customer-returns/new?sell_order=${sellOrder.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg gap-2 text-warning hover:text-warning hover:bg-warning/10 border-warning/20"
            >
              <PackageOpen className="h-4 w-4" />
              إنشاء مرتجع
            </Button>
          </Link>
          {!hasInvoice && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg gap-2"
                onClick={() => navigate(`/sell-orders/${sellOrder.id}/edit`)}
              >
                <Edit className="h-4 w-4" />
                تعديل
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg gap-2"
                disabled={uploadInvoiceMutation.isPending || invoiceDialogOpen}
                onClick={() => invoiceInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                رفع الفاتورة
              </Button>
            </>
          )}
            {shouldShowPushToOdoo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg gap-2 border-0 bg-[#875A7B] text-white hover:bg-[#714a67]"
                disabled={pushToOdooMutation.isPending}
                onClick={() => setOdooConfirmOpen(true)}
                title="مزامنة أمر البيع مع Odoo (مرة واحدة)"
              >
                {pushToOdooMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold uppercase tracking-[0.15em]">
                    odoo
                  </span>
                )}
                مزامنة مع Odoo
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-lg gap-2"
              disabled={printMutation.isPending}
              onClick={() => {
                printMutation.mutate(
                  { id: sellOrder.id },
                  {
                    onSuccess: () => toast.success("تم فتح عرض السعر للطباعة"),
                    onError: () => toast.error("فشل تحميل عرض السعر"),
                  }
                );
              }}
            >
              {printMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
              طباعة عرض السعر
            </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={odooConfirmOpen}
        onClose={() => setOdooConfirmOpen(false)}
        onConfirm={() => {
          pushToOdooMutation.mutate(sellOrder.id, {
            onSuccess: () => {
              setDidPushToOdoo(true);
              setOdooConfirmOpen(false);
              toast.success("تمت المزامنة مع Odoo بنجاح");
            },
            onError: (err) =>
              toast.error(parseBackendError(err) || "فشل المزامنة مع Odoo"),
          });
        }}
        title="هل تريد مزامنة أمر البيع مع Odoo؟"
        description="تنبيه: المزامنة تُنفّذ لمرة واحدة فقط، وبعدها سيتم قفل التعديل."
        confirmText="تأكيد المزامنة"
        cancelText="إلغاء"
        variant="warning"
        isLoading={pushToOdooMutation.isPending}
        details={[
          "سيتم إرسال أمر البيع إلى Odoo لإنشاء/تحديث مستند مطابق وربطه بالنظام.",
          "بعد المزامنة لن تتمكن من تعديل أمر البيع.",
          "بعد المزامنة لن تتمكن من تعديل أمر الشراء المرتبط أيضًا.",
        ]}
      />

      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeInvoiceDialog();
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] flex flex-col gap-4"
          dir="rtl"
        >
          <DialogHeader className="text-right sm:text-right">
            <DialogTitle>معاينة الفاتورة</DialogTitle>
            <DialogDescription>
              راجع الملف ثم اضغط «تأكيد الرفع» لإرساله إلى الخادم.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/30 p-2">
            {invoicePreviewUrl && pendingInvoiceFile ? (
              pendingInvoiceFile.type === "application/pdf" ||
              pendingInvoiceFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  title="معاينة الفاتورة"
                  src={invoicePreviewUrl}
                  className="h-[min(60vh,520px)] w-full rounded-md border-0 bg-background"
                />
              ) : pendingInvoiceFile.type.startsWith("image/") ? (
                <img
                  src={invoicePreviewUrl}
                  alt=""
                  className="mx-auto max-h-[min(60vh,520px)] w-auto rounded-md object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-12 w-12 opacity-50" />
                  <p>معاينة غير متاحة لهذا النوع من الملفات.</p>
                  <p className="font-mono text-xs">{pendingInvoiceFile.name}</p>
                </div>
              )
            ) : null}
          </div>
          <DialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={closeInvoiceDialog}
              disabled={uploadInvoiceMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={handleConfirmInvoiceUpload}
              disabled={
                uploadInvoiceMutation.isPending || !pendingInvoiceFile
              }
            >
              {uploadInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                "تأكيد الرفع"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Financial Summary */}
          <Card className="bg-linear-to-br from-primary/5 to-transparent border-primary/20 shadow-sm overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-sm font-bold uppercase tracking-wider">إجمالي أمر البيع شامل الضريبة</span>
                </div>
                <p className="text-3xl font-bold text-primary font-mono tracking-tight">
                  {totalPrice.toLocaleString()} <span className="text-sm font-normal opacity-70">ر.س</span>
                </p>
              </div>
              {parseFloat(sellOrder.dis_percentage || "0") > 0 && (
                <div className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">نسبة الخصم الكلية:</span>
                  <span className="font-bold text-success px-2 py-1 rounded-lg border border-success/20">
                    {sellOrder.dis_percentage}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                بنود أمر البيع
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {/* Mobile View: Cards */}
                <div className="md:hidden flex flex-col divide-y divide-border/50">
                  {sellOrder.sell_order_items?.map((item) => (
                    <div key={item.id} className="p-4 space-y-3 hover:bg-muted/5 transition-colors">
                      <div className="flex justify-between items-start">
                        {item.item ? (
                          <Link to={`/items/${typeof item.item === 'object' ? item.item.id : item.item}`} className="font-medium text-foreground wrap-break-word max-w-[200px] hover:text-primary hover:underline transition-colors">
                            {typeof item.item === 'object' ? item.item.name : 'بند'}
                          </Link>
                        ) : (
                          <span className="font-medium text-foreground wrap-break-word max-w-[200px]">بند</span>
                        )}
                        <span className="font-bold text-primary font-mono text-sm">
                          {parseFloat(item.total_price_after_tax || "0").toLocaleString()} ر.س
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div className="flex justify-between bg-muted/20 p-2 rounded">
                           <span>الكمية:</span>
                           <span className="font-mono text-foreground">{item.quantity} {item.unit_name}</span>
                        </div>
                        <div className="flex justify-between bg-muted/20 p-2 rounded">
                           <span>السعر:</span>
                           <span className="font-mono">{parseFloat(item.price_after_tax || "0").toLocaleString()}</span>
                        </div>
                      </div>
                      {parseFloat(item.dis_percentage || "0") > 0 && (
                        <div className="flex justify-between items-center text-xs text-success bg-success-light p-1.5 rounded border border-success/20">
                          <span>نسبة الخصم:</span>
                          <span className="font-bold font-mono">{item.dis_percentage}%</span>
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded mt-1 border border-border/30 w-full overflow-hidden">
                          <span className="font-semibold text-foreground/80 mb-0.5 block">ملاحظات:</span>
                          <p className="whitespace-pre-wrap wrap-break-word break-all">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop View: Table */}
                <table className="hidden md:table w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr className="border-b text-right">
                      <th className="p-4 font-medium text-muted-foreground w-[35%]">البند</th>
                      <th className="p-4 font-medium text-muted-foreground text-center">الكمية</th>
                      <th className="p-4 font-medium text-muted-foreground text-center">السعر</th>
                      <th className="p-4 font-medium text-muted-foreground text-center">الخصم</th>
                      <th className="p-4 font-medium text-muted-foreground text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sellOrder.sell_order_items?.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-4 wrap-break-word max-w-[200px] align-top">
                          {item.item ? (
                            <Link to={`/items/${typeof item.item === 'object' ? item.item.id : item.item}`} className="font-medium text-foreground hover:text-primary hover:underline transition-colors block">
                              {typeof item.item === 'object' ? item.item.name : 'بند'}
                            </Link>
                          ) : (
                            <div className="font-medium text-foreground">بند</div>
                          )}
                          {item.notes && (
                            <div className="mt-2 flex items-start gap-1.5 bg-muted/30 p-2 rounded-md border border-border/50 w-full overflow-hidden">
                              <FileText className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word break-all leading-relaxed min-w-0 flex-1">
                                <span className="font-semibold text-foreground/70 ml-1">ملاحظة:</span>
                                {item.notes}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="font-mono">
                            {item.quantity} {item.unit_name}
                          </Badge>
                        </td>
                        <td className="p-4 text-center font-mono">{parseFloat(item.price_after_tax || "0").toLocaleString()}</td>
                        <td className="p-4 text-center font-mono text-success">
                          {parseFloat(item.dis_percentage || "0") > 0 ? `${item.dis_percentage}%` : '-'}
                        </td>
                        <td className="p-4 text-left font-bold font-mono text-primary">
                          {parseFloat(item.total_price_after_tax || "0").toLocaleString()} ر.س
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* الفاتورة المرفوعة */}
          {hasInvoice && invoiceHref ? (
            <Card className="shadow-lg border-none ring-1 ring-border/50 overflow-hidden">
              <CardHeader className="bg-muted/5 pb-4 border-b border-border/50 flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  فاتورة أمر البيع
                </CardTitle>
                <Button variant="outline" size="sm" className="rounded-lg gap-2 shrink-0" asChild>
                  <a
                    href={invoiceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="فتح الفاتورة في نافذة جديدة"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح الفاتورة
                  </a>
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {invoiceKind === "pdf" ? (
                  <iframe
                    title="معاينة فاتورة أمر البيع"
                    src={invoiceHref}
                    className="h-[min(70vh,560px)] w-full rounded-lg border border-border/50 bg-muted/20"
                  />
                ) : invoiceKind === "image" ? (
                  <a
                    href={invoiceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-border/50 bg-muted/20 p-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <img
                      src={invoiceHref}
                      alt="معاينة فاتورة أمر البيع"
                      className="mx-auto max-h-[min(70vh,560px)] w-auto max-w-full rounded-md object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    لا تتوفر معاينة مباشرة لهذا النوع من الملفات. استخدم زر «فتح
                    الفاتورة» أعلاه لعرضه أو تنزيله.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="shadow-md border-none ring-1 ring-border/50">
            <CardHeader className="bg-muted/5 pb-4 border-b border-border/50">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              <div className="p-4 flex items-center gap-3 hover:bg-muted/5 transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground mb-0.5">اسم العميل</p>
                  <Link
                    to={`/customers/${customer.id}`}
                    className="font-semibold text-sm wrap-break-word hover:text-primary hover:underline transition-colors"
                  >
                    {formatCustomerWithBalance(customer)}
                  </Link>
                </div>
              </div>
              <div className="p-4 flex items-center gap-3 hover:bg-muted/5 transition-colors">
                <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center text-info shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs text-muted-foreground mb-0.5">الجوال</p>
                  <a href={`tel:${customer.phone_number}`} className="font-semibold text-sm font-mono hover:text-primary hover:underline transition-colors" dir="ltr">{customer.phone_number}</a>
                </div>
              </div>
              {sellOrder.location && (
                <div className="p-4 flex items-center gap-3 hover:bg-muted/5 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center text-warning shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-0.5">الموقع</p>
                    <p className="font-semibold text-sm wrap-break-word">{sellOrder.location}</p>
                  </div>
                </div>
              )}
              {sellOrder.created_at && (
                <div className="p-4 flex items-center gap-3 hover:bg-muted/5 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-slate/10 flex items-center justify-center text-slate shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground mb-0.5">تاريخ الإنشاء</p>
                    <p className="font-semibold text-sm font-mono">{new Date(sellOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {sellOrder.notes && (
            <Card className="shadow-md border-none ring-1 ring-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ملاحظات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-word">{sellOrder.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
