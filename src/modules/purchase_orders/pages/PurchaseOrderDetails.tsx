import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Package,
  ShoppingCart,
  Clock,
  FileText,
  Calculator,
  User,
  Calendar,
  AlertTriangle,
  Printer,
  Truck,
  ListOrdered,
  Upload,
  ExternalLink,
  PackageCheck,
  CheckCircle2,
  CalendarClock,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  usePurchaseOrderDetails,
  usePrintPurchaseOrder,
  useUploadPurchaseOrderInvoice,
  useReceivePurchaseOrder,
  useSchedulePurchaseOrder,
} from "@/hooks/usePurchaseOrders";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LinkedSellOrderHeaderButton,
  LinkedSellOrderLink,
} from "@/modules/purchase_orders/components/LinkedSellOrderLink";
import {
  PURCHASE_ORDER_STATUS_LABELS,
  type PurchaseOrder,
  type PurchaseOrderItem,
  type PurchaseOrderStatus,
} from "@/types";
import { AttachmentLinksList } from "@/components/shared";
import { toast } from "sonner";
import { formatNameWithBalance } from "@/lib/partyDisplay";
import { parseBackendError } from "@/lib/utils";

function formatLineNotes(notes?: string | null): string | null {
  const t = notes?.trim();
  return t && t.length > 0 ? t : null;
}

/** ISO datetime → قيمة <input type="datetime-local"> بالتوقيت المحلي (YYYY-MM-DDTHH:mm) */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** قيمة <input type="datetime-local"> (محلية) → ISO datetime، أو null إذا فارغة */
function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ترجمة رموز الإجراء القادمة من الباك إند (سجل طلب الشراء) */
const PO_HISTORY_ACTION_AR: Record<string, string> = {
  CREATED: "تم الإنشاء",
  UPDATED: "تم التعديل",
  ITEMS_UPDATED: "تم تعديل الأصناف",
  DELETED: "تم الحذف",
  ACCEPTED: "تم القبول",
  REJECTED: "تم الرفض",
  VERIFIED: "تم التحقق",
  RECEIVED: "تم الاستلام",
  STATUS_CHANGED: "تغيير الحالة",
  CANCELLED: "تم الإلغاء",
};

function translatePoHistoryAction(action: string): string {
  const key = action?.trim().toUpperCase();
  return (key && PO_HISTORY_ACTION_AR[key]) || action;
}

/** ترجمة نصوص التفاصيل الإنجليزية الشائعة */
const PO_HISTORY_DETAILS_EN_TO_AR: Record<string, string> = {
  "purchase order created": "تم إنشاء طلب الشراء",
  "purchase order updated": "تم تحديث طلب الشراء",
  "purchase order items updated": "تم تحديث أصناف طلب الشراء",
  "purchase order deleted": "تم حذف طلب الشراء",
  "purchase order accepted": "تم قبول طلب الشراء",
  "purchase order rejected": "تم رفض طلب الشراء",
  "purchase order verified": "تم التحقق من طلب الشراء",
};

function translatePoHistoryDetails(details: string): string {
  const t = details?.trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  return PO_HISTORY_DETAILS_EN_TO_AR[lower] ?? details;
}

/** مسار أو رابط ملف الفاتورة من الـ API لعرضه في المتصفح */
function buildInvoiceFileHref(raw: string | null | undefined): string {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

function supplierBalanceForSupplierId(
  po: Pick<PurchaseOrder, "supplier_list">,
  sid: number | undefined,
): string | number | undefined {
  if (sid == null || sid <= 0 || !po.supplier_list?.length) return undefined;
  for (const s of po.supplier_list) {
    const rawId = s?.id;
    const id =
      typeof rawId === "number"
        ? rawId
        : rawId !== undefined && rawId !== null && rawId !== ""
          ? Number(rawId)
          : NaN;
    if (!Number.isNaN(id) && id === sid) return s.balance;
  }
  return undefined;
}

export default function PurchaseOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const invoiceBlobRef = useRef<string | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [pendingInvoiceFile, setPendingInvoiceFile] = useState<File | null>(
    null,
  );
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(
    null,
  );

  const {
    data: purchaseOrder,
    isLoading,
    isError,
    error,
  } = usePurchaseOrderDetails(id!);
  const printMutation = usePrintPurchaseOrder();
  const uploadInvoiceMutation = useUploadPurchaseOrderInvoice();
  const receiveMutation = useReceivePurchaseOrder();
  const scheduleMutation = useSchedulePurchaseOrder();

  // حقل الجدولة (موعد التسليم) — يُعبّأ من بيانات الطلب.
  const [scheduledAtInput, setScheduledAtInput] = useState("");

  useEffect(() => {
    setScheduledAtInput(isoToDatetimeLocal(purchaseOrder?.scheduled_at));
  }, [purchaseOrder?.scheduled_at]);

  const handleSaveSchedule = () => {
    if (!purchaseOrder) return;
    scheduleMutation.mutate(
      {
        id: purchaseOrder.id,
        scheduled_at: datetimeLocalToIso(scheduledAtInput),
      },
      {
        onSuccess: () => toast.success("تم حفظ موعد التسليم"),
        onError: (err) =>
          toast.error("فشل حفظ موعد التسليم", {
            description: parseBackendError(err),
          }),
      },
    );
  };

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  // map: po_item_id -> الكمية المستلمة (كنص لتمكين الإدخال)
  const [receivedQtyById, setReceivedQtyById] = useState<
    Record<number, string>
  >({});

  const itemsBySupplier = useMemo(() => {
    if (!purchaseOrder?.items?.length) return [];
    const map = new Map<
      number,
      { name: string; balance?: string | number; items: PurchaseOrderItem[] }
    >();
    for (const item of purchaseOrder.items) {
      const sid = item.supplier ?? purchaseOrder.supplier;
      const name =
        item.supplier_name ||
        purchaseOrder.supplier_name ||
        `مورد #${sid}`;
      if (!map.has(sid)) {
        let balance: string | number | undefined;
        for (const s of purchaseOrder.supplier_list ?? []) {
          const rawId = s?.id;
          const id =
            typeof rawId === "number"
              ? rawId
              : rawId !== undefined && rawId !== null && rawId !== ""
                ? Number(rawId)
                : NaN;
          if (!Number.isNaN(id) && id === sid) {
            balance = s.balance;
            break;
          }
        }
        map.set(sid, { name, balance, items: [] });
      }
      map.get(sid)!.items.push(item);
    }
    return Array.from(map.entries());
  }, [purchaseOrder]);

  const hasMultipleSuppliers = useMemo(() => {
    if (!purchaseOrder?.items?.length) return false;
    const ids = new Set(
      purchaseOrder.items.map(
        (i) => i.supplier ?? purchaseOrder.supplier,
      ),
    );
    return ids.size > 1;
  }, [purchaseOrder]);

  const setInvoiceBlobUrl = (next: string | null) => {
    if (invoiceBlobRef.current) {
      URL.revokeObjectURL(invoiceBlobRef.current);
      invoiceBlobRef.current = null;
    }
    if (next) invoiceBlobRef.current = next;
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
    if (invoiceInputRef.current) invoiceInputRef.current.value = "";
  };

  const openInvoicePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setInvoiceBlobUrl(url);
    setPendingInvoiceFile(file);
    setInvoiceDialogOpen(true);
  };

  const handleConfirmInvoiceUpload = (poId: string | number) => {
    if (!pendingInvoiceFile) return;
    uploadInvoiceMutation.mutate(
      { id: poId, file: pendingInvoiceFile },
      {
        onSuccess: () => {
          toast.success("تم رفع الفاتورة بنجاح");
          closeInvoiceDialog();
        },
        onError: (err) => toast.error(parseBackendError(err)),
      },
    );
  };

  const openReceiveDialog = () => {
    const initial: Record<number, string> = {};
    for (const item of purchaseOrder?.items ?? []) {
      if (item.id != null) initial[item.id] = item.quantity ?? "";
    }
    setReceivedQtyById(initial);
    setReceiveDialogOpen(true);
  };

  // البنود التي لها معرف صالح فقط يمكن استلامها مع كمية مخصّصة
  const receivableItems = useMemo(
    () => (purchaseOrder?.items ?? []).filter((it) => it.id != null),
    [purchaseOrder],
  );

  // التحقق: كل القيم أرقام صالحة >= 0
  const receiveQtyInvalid = useMemo(
    () =>
      receivableItems.some((item) => {
        const raw = receivedQtyById[item.id!];
        const n = Number(raw);
        return raw == null || raw.trim() === "" || !Number.isFinite(n) || n < 0;
      }),
    [receivableItems, receivedQtyById],
  );

  const handleConfirmReceive = (poId: string | number) => {
    const items = receivableItems.map((item) => ({
      id: item.id!,
      received_quantity: Number(receivedQtyById[item.id!]),
    }));
    receiveMutation.mutate(
      { id: poId, items },
      {
        onSuccess: () => {
          toast.success("تم استلام المواد وترحيلها للمخزون");
          setReceiveDialogOpen(false);
        },
        onError: (err) => toast.error(parseBackendError(err)),
      },
    );
  };

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='text-muted-foreground animate-pulse'>
          جاري تحميل تفاصيل طلب الشراء...
        </p>
      </div>
    );
  }

  if (isError || !purchaseOrder) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center'>
        <div className='p-4 rounded-full bg-destructive/10 text-destructive'>
          <AlertTriangle className='h-8 w-8' />
        </div>
        <h3 className='text-xl font-semibold'>حدث خطأ</h3>
        <p className='text-muted-foreground'>
          {(error as Error)?.message || "فشل تحميل تفاصيل طلب الشراء"}
        </p>
        <Button onClick={() => navigate("/purchase-orders")} variant='outline'>
          العودة للطلبات
        </Button>
      </div>
    );
  }

  const statusInfo = PURCHASE_ORDER_STATUS_LABELS[
    purchaseOrder.status as PurchaseOrderStatus
  ] || { label: purchaseOrder.status, color: "secondary" };
  const totalCost = parseFloat(purchaseOrder.total_cost || "0");
  const isReceived = purchaseOrder.status === "RECEIVED";
  const canReceive =
    purchaseOrder.status === "SUBMITTED" ||
    purchaseOrder.status === "ACCEPTED";
  const hasInvoice =
    typeof purchaseOrder.invoice_file === "string" &&
    purchaseOrder.invoice_file.trim().length > 0;
  const invoiceHref = hasInvoice
    ? buildInvoiceFileHref(purchaseOrder.invoice_file)
    : "";

  return (
    <div
      className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'
      dir='rtl'
    >
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate("/purchase-orders")}
            className='rounded-full'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-bold tracking-tight'>
                طلب شراء #{purchaseOrder.id}
              </h1>
              <Badge variant={statusInfo.color as any}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className='text-muted-foreground mt-1'>
              <ShoppingCart className='inline h-4 w-4 mr-1' />
              {hasMultipleSuppliers ? (
                <span>عدة موردين</span>
              ) : purchaseOrder.supplier > 0 ? (
                <Link
                  to={`/suppliers/${purchaseOrder.supplier}`}
                  className='hover:text-primary hover:underline transition-colors'
                >
                  {formatNameWithBalance(
                    purchaseOrder.supplier_name ||
                      `مورد #${purchaseOrder.supplier}`,
                    supplierBalanceForSupplierId(
                      purchaseOrder,
                      purchaseOrder.supplier,
                    ),
                  )}
                </Link>
              ) : (() => {
                const fallbackSid = purchaseOrder.items?.[0]?.supplier;
                const fallbackName =
                  purchaseOrder.supplier_name ||
                  purchaseOrder.items?.[0]?.supplier_name ||
                  "—";
                const bal = supplierBalanceForSupplierId(
                  purchaseOrder,
                  fallbackSid,
                );
                if (fallbackSid && fallbackSid > 0 && fallbackName !== "—") {
                  return (
                    <Link
                      to={`/suppliers/${fallbackSid}`}
                      className='hover:text-primary hover:underline transition-colors'
                    >
                      {formatNameWithBalance(fallbackName, bal)}
                    </Link>
                  );
                }
                return (
                  <span>{formatNameWithBalance(fallbackName, bal)}</span>
                );
              })()}
            </p>
          </div>
        </div>

        <div className='flex gap-2 items-center w-full md:w-auto'>
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
          {purchaseOrder.sell_order != null && purchaseOrder.sell_order > 0 && (
            <LinkedSellOrderHeaderButton
              sellOrderId={purchaseOrder.sell_order}
            />
          )}
          {hasInvoice && invoiceHref ? (
            <a
              href={invoiceHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
              title="فتح الفاتورة في نافذة جديدة"
            >
              <Button
                type="button"
                variant="outline"
                className="rounded-xl gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                فتح الفاتورة
              </Button>
            </a>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl gap-2"
              disabled={uploadInvoiceMutation.isPending || invoiceDialogOpen}
              onClick={() => invoiceInputRef.current?.click()}
              title="رفع فاتورة طلب الشراء"
            >
              {uploadInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              رفع الفاتورة
            </Button>
          )}
          <Button
            variant='outline'
            className='rounded-xl gap-2'
            onClick={() =>
              navigate(`/purchase-orders/${purchaseOrder.id}/edit`)
            }
          >
            <Edit className='h-4 w-4' />
            تعديل
          </Button>
          <Button
            variant='outline'
            className='rounded-xl gap-2'
            disabled={printMutation.isPending}
            onClick={() => {
              printMutation.mutate(
                { id: purchaseOrder.id },
                {
                  onSuccess: () => toast.success("تم فتح طلب الشراء للطباعة"),
                  onError: () => toast.error("فشل تحميل طلب الشراء"),
                },
              );
            }}
          >
            {printMutation.isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Printer className='h-4 w-4' />
            )}
            طباعة طلب الشراء
          </Button>
          {canReceive && (
            <Button
              className='rounded-xl gap-2 bg-success hover:bg-success-dark text-success-foreground border-0'
              disabled={receiveMutation.isPending}
              onClick={openReceiveDialog}
              title='استلام المواد وترحيلها للمخزون'
            >
              {receiveMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <PackageCheck className='h-4 w-4' />
              )}
              استلام المواد
            </Button>
          )}
          {isReceived && (
            <Badge
              variant='success'
              className='gap-1.5 rounded-xl px-3 py-1.5 text-sm'
            >
              <CheckCircle2 className='h-4 w-4' />
              مُستلَم
            </Badge>
          )}
        </div>
      </div>

      <Dialog
        open={receiveDialogOpen}
        onOpenChange={(open) => {
          if (!open && !receiveMutation.isPending) setReceiveDialogOpen(false);
        }}
      >
        <DialogContent className='max-w-2xl' dir='rtl'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <PackageCheck className='h-5 w-5 text-success' />
              استلام المواد
            </DialogTitle>
            <DialogDescription>
              راجع الكميات المستلمة فعلياً لكل بند ثم اضغط “تأكيد الاستلام”.
              الكمية المستلمة هي ما سيُرحَّل للمخزون.
            </DialogDescription>
          </DialogHeader>

          <div className='max-h-[55vh] overflow-y-auto pr-1 space-y-3'>
            {receivableItems.length > 0 ? (
              receivableItems.map((item) => {
                const qtyStr = receivedQtyById[item.id!] ?? "";
                const n = Number(qtyStr);
                const invalid =
                  qtyStr.trim() === "" ||
                  !Number.isFinite(n) ||
                  n < 0;
                return (
                  <div
                    key={item.id}
                    className='flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-end sm:justify-between'
                  >
                    <div className='min-w-0 flex-1 space-y-1'>
                      <span className='block font-medium text-foreground'>
                        {item.item_name || `بند #${item.item}`}
                      </span>
                      <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                        <span>
                          الكمية المطلوبة:{" "}
                          <span className='font-mono text-foreground'>
                            {item.quantity}
                          </span>
                        </span>
                        {item.unit_name && <span>· {item.unit_name}</span>}
                      </div>
                    </div>
                    <div className='w-full sm:w-40 space-y-1'>
                      <Label
                        htmlFor={`received-qty-${item.id}`}
                        className='text-xs text-muted-foreground'
                      >
                        الكمية المستلمة
                      </Label>
                      <Input
                        id={`received-qty-${item.id}`}
                        type='number'
                        inputMode='decimal'
                        min={0}
                        step='any'
                        value={qtyStr}
                        onChange={(e) =>
                          setReceivedQtyById((prev) => ({
                            ...prev,
                            [item.id!]: e.target.value,
                          }))
                        }
                        className={`font-mono ${
                          invalid ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className='py-6 text-center text-sm text-muted-foreground'>
                لا توجد بنود قابلة للاستلام في هذا الطلب.
              </p>
            )}
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setReceiveDialogOpen(false)}
              disabled={receiveMutation.isPending}
              className='rounded-xl'
            >
              إلغاء
            </Button>
            <Button
              type='button'
              onClick={() => handleConfirmReceive(purchaseOrder.id)}
              disabled={
                receiveMutation.isPending ||
                receivableItems.length === 0 ||
                receiveQtyInvalid
              }
              className='rounded-xl bg-success hover:bg-success-dark text-success-foreground border-0'
            >
              {receiveMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin ml-2' />
              ) : null}
              تأكيد الاستلام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={invoiceDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeInvoiceDialog();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>معاينة الفاتورة</DialogTitle>
            <DialogDescription>
              راجع الملف ثم اضغط “تأكيد الرفع”.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border bg-muted/20 p-3">
            {invoicePreviewUrl && pendingInvoiceFile ? (
              pendingInvoiceFile.type === "application/pdf" ||
              pendingInvoiceFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  title="معاينة الفاتورة"
                  src={invoicePreviewUrl}
                  className="w-full h-[60vh] rounded-lg bg-background"
                />
              ) : pendingInvoiceFile.type.startsWith("image/") ? (
                <a
                  href={invoicePreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                  title="فتح الصورة بحجم كامل"
                >
                  <img
                    src={invoicePreviewUrl}
                    alt="معاينة فاتورة طلب الشراء"
                    className="max-h-[60vh] w-full object-contain rounded-lg bg-background"
                    loading="lazy"
                  />
                </a>
              ) : (
                <div className="text-sm text-muted-foreground">
                  نوع الملف غير مدعوم للمعاينة. يمكنك رفعه مباشرة.
                </div>
              )
            ) : (
              <div className="text-sm text-muted-foreground">
                لم يتم اختيار ملف بعد.
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeInvoiceDialog}
              disabled={uploadInvoiceMutation.isPending}
              className="rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              onClick={() => handleConfirmInvoiceUpload(purchaseOrder.id)}
              disabled={
                uploadInvoiceMutation.isPending || !pendingInvoiceFile
              }
              className="rounded-xl"
            >
              {uploadInvoiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : null}
              تأكيد الرفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Items Card */}
          <Card className='shadow-sm border-none ring-1 ring-border/50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='h-5 w-5 text-primary' />
                البنود ({purchaseOrder.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                <div>
                  {/* Mobile View: Cards — مجمّعة حسب المورد */}
                  <div className='md:hidden flex flex-col gap-5'>
                    {itemsBySupplier.map(([sid, group]) => (
                      <div
                        key={sid}
                        className='rounded-2xl border border-border/70 bg-muted/20 p-3 space-y-3 shadow-sm'
                      >
                        <div className='rounded-xl border border-primary/25 bg-linear-to-br from-primary/12 via-primary/5 to-background shadow-sm overflow-hidden'>
                          <div className='flex items-start gap-3 px-4 py-3 border-b border-primary/15'>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary'>
                              <Truck className='h-5 w-5' />
                            </div>
                            <div className='min-w-0 flex-1 text-right space-y-0.5'>
                              <span className='text-[11px] font-bold uppercase tracking-wide text-primary block'>
                                المورد
                              </span>
                              {sid > 0 ? (
                                <Link
                                  to={`/suppliers/${sid}`}
                                  className='font-semibold text-foreground leading-snug hover:text-primary hover:underline block'
                                >
                                  {formatNameWithBalance(
                                    group.name,
                                    group.balance,
                                  )}
                                </Link>
                              ) : (
                                <span className='font-semibold text-foreground leading-snug'>
                                  {formatNameWithBalance(
                                    group.name,
                                    group.balance,
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className='px-3 py-2 bg-background/40'>
                            <div className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
                              <ListOrdered className='h-3.5 w-3.5 shrink-0 text-primary/80' />
                              <span>بنود التوريد التابعة لهذا المورد</span>
                              <Badge variant='secondary' className='text-[10px] px-1.5'>
                                {group.items.length}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className='space-y-2 pr-1'>
                        {group.items.map((item) => {
                          const lineNotes = formatLineNotes(item.notes);
                          return (
                          <div
                            key={item.id ?? `${sid}-${item.item}`}
                            className='p-4 space-y-3 rounded-xl border border-border/50 bg-card shadow-sm ring-1 ring-primary/10 hover:bg-muted/30 transition-colors'
                          >
                            <div className='flex justify-between items-start'>
                              {item.item ? (
                                <Link
                                  to={`/items/${item.item}`}
                                  className='font-medium text-foreground hover:text-primary hover:underline transition-colors block'
                                >
                                  {item.item_name || `بند #${item.item}`}
                                </Link>
                              ) : (
                                <span className='font-medium text-foreground'>
                                  {item.item_name || `بند #${item.item}`}
                                </span>
                              )}
                              <span className='font-bold text-primary font-mono text-sm'>
                                {parseFloat(
                                  item.line_total || "0",
                                ).toLocaleString()}{" "}
                                ر.س
                              </span>
                            </div>
                            <div className='grid grid-cols-2 gap-2 text-sm text-muted-foreground'>
                              <div className='flex justify-between bg-muted/20 p-2 rounded'>
                                <span>الكمية:</span>
                                <span className='font-mono text-foreground'>
                                  {item.quantity}
                                </span>
                              </div>
                              <div className='flex justify-between bg-muted/20 p-2 rounded'>
                                <span>الوحدة:</span>
                                <span>{item.unit_name}</span>
                              </div>
                              {isReceived && (
                                <div className='flex justify-between bg-success/10 p-2 rounded col-span-2'>
                                  <span>المستلَم:</span>
                                  <span className='font-mono text-foreground'>
                                    {item.received_quantity != null
                                      ? item.received_quantity
                                      : "—"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className='flex justify-between items-center text-xs text-muted-foreground pt-1'>
                              <span>سعر الشراء:</span>
                              <span className='font-mono'>
                                {parseFloat(
                                  item.purchase_price || "0",
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className='text-xs bg-muted/25 p-2.5 rounded-lg border border-border/40 w-full overflow-hidden mt-1'>
                              <span className='font-semibold text-foreground mb-1 flex items-center gap-1'>
                                <FileText className='h-3 w-3 shrink-0' />
                                ملاحظات البند
                              </span>
                              {lineNotes ? (
                                <p className='text-muted-foreground whitespace-pre-wrap wrap-break-word leading-relaxed'>
                                  {lineNotes}
                                </p>
                              ) : (
                                <p className='text-muted-foreground/60'>—</p>
                              )}
                            </div>
                          </div>
                          );
                        })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className='hidden md:block overflow-x-auto rounded-xl border border-border/60'>
                    <table className='w-full text-sm'>
                      <thead className='bg-muted/40'>
                        <tr className='border-b text-right'>
                          <th className='p-4 font-medium text-muted-foreground min-w-[160px]'>
                            <span className='inline-flex items-center gap-2'>
                              <ListOrdered className='h-4 w-4 text-primary/70' />
                              البند
                            </span>
                          </th>
                          <th className='p-4 font-medium text-muted-foreground text-center whitespace-nowrap'>
                            الكمية
                          </th>
                          {isReceived && (
                            <th className='p-4 font-medium text-muted-foreground text-center whitespace-nowrap'>
                              المستلَم
                            </th>
                          )}
                          <th className='p-4 font-medium text-muted-foreground text-center whitespace-nowrap'>
                            الوحدة
                          </th>
                          <th className='p-4 font-medium text-muted-foreground text-center whitespace-nowrap'>
                            سعر الشراء
                          </th>
                          <th className='p-4 font-medium text-muted-foreground min-w-[180px] max-w-[280px]'>
                            ملاحظات البند
                          </th>
                          <th className='p-4 font-medium text-muted-foreground text-left whitespace-nowrap'>
                            الإجمالي
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemsBySupplier.map(([sid, group]) => (
                          <Fragment key={sid}>
                            <tr className='border-0'>
                              <td
                                colSpan={isReceived ? 7 : 6}
                                className='p-0 border-0'
                              >
                                <div className='flex flex-wrap items-center gap-3 border-y border-primary/25 bg-linear-to-l from-primary/12 to-primary/5 px-4 py-3 border-r-[5px] border-r-primary'>
                                  <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary'>
                                    <Truck className='h-4 w-4' />
                                  </div>
                                  <div className='min-w-0 flex-1 text-right'>
                                    <span className='text-[11px] font-bold uppercase tracking-wide text-primary block mb-0.5'>
                                      المورد
                                    </span>
                                    {sid > 0 ? (
                                      <Link
                                        to={`/suppliers/${sid}`}
                                        className='text-sm font-semibold text-foreground hover:text-primary hover:underline'
                                      >
                                        {formatNameWithBalance(
                                          group.name,
                                          group.balance,
                                        )}
                                      </Link>
                                    ) : (
                                      <span className='text-sm font-semibold text-foreground'>
                                        {formatNameWithBalance(
                                          group.name,
                                          group.balance,
                                        )}
                                      </span>
                                    )}
                                  </div>
                                  <Badge
                                    variant='outline'
                                    className='shrink-0 border-primary/30 bg-background/80 text-xs font-normal'
                                  >
                                    {group.items.length} بند
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                            {group.items.map((item) => {
                              const lineNotes = formatLineNotes(item.notes);
                              return (
                              <tr
                                key={item.id ?? `${sid}-${item.item}`}
                                className='border-b border-dashed border-border/60 bg-background hover:bg-muted/25 transition-colors'
                              >
                                <td className='p-4 font-medium text-foreground align-top border-r-[3px] border-r-primary/20'>
                                  {item.item ? (
                                    <Link
                                      to={`/items/${item.item}`}
                                      className='hover:text-primary hover:underline transition-colors block'
                                    >
                                      {item.item_name || `بند #${item.item}`}
                                    </Link>
                                  ) : (
                                    <div>
                                      {item.item_name || `بند #${item.item}`}
                                    </div>
                                  )}
                                </td>
                                <td className='p-4 text-center'>
                                  <Badge variant='outline' className='font-mono'>
                                    {item.quantity}
                                  </Badge>
                                </td>
                                {isReceived && (
                                  <td className='p-4 text-center'>
                                    {item.received_quantity != null ? (
                                      <Badge
                                        variant='success'
                                        className='font-mono'
                                      >
                                        {item.received_quantity}
                                      </Badge>
                                    ) : (
                                      <span className='text-muted-foreground/50'>
                                        —
                                      </span>
                                    )}
                                  </td>
                                )}
                                <td className='p-4 text-center text-muted-foreground'>
                                  {item.unit_name}
                                </td>
                                <td className='p-4 text-center font-mono'>
                                  {parseFloat(
                                    item.purchase_price || "0",
                                  ).toLocaleString()}
                                </td>
                                <td className='p-4 align-top max-w-[280px]'>
                                  {lineNotes ? (
                                    <div className='flex items-start gap-1.5 text-sm text-muted-foreground'>
                                      <FileText className='h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/70' />
                                      <p className='whitespace-pre-wrap wrap-break-word leading-relaxed min-w-0'>
                                        {lineNotes}
                                      </p>
                                    </div>
                                  ) : (
                                    <span className='text-sm text-muted-foreground/50'>
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className='p-4 text-left font-bold font-mono text-primary'>
                                  {parseFloat(
                                    item.line_total || "0",
                                  ).toLocaleString()}{" "}
                                  ر.س
                                </td>
                              </tr>
                              );
                            })}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
                  <Package className='h-10 w-10 mb-2 opacity-20' />
                  <p>لا توجد بنود في هذا الطلب</p>
                </div>
              )}
            </CardContent>
            <CardFooter className='flex flex-col border-t bg-muted/30 p-4 gap-3'>
              <div className='flex justify-between items-center w-full'>
                <span className='font-semibold text-muted-foreground flex items-center gap-2'>
                  <Calculator className='h-4 w-4' />
                  التكلفة الإجمالية شامل الضريبة
                </span>
                <span className='text-xl md:text-2xl font-bold text-primary'>
                  {totalCost.toLocaleString()}{" "}
                  <span className='text-sm font-normal text-muted-foreground'>
                    ر.س
                  </span>
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Notes */}
          {purchaseOrder.notes && (
            <Card className='shadow-sm border-none ring-1 ring-border/50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-primary' />
                  ملاحظات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground whitespace-pre-wrap'>
                  {purchaseOrder.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Info Card */}
          <Card className='shadow-sm border-none ring-1 ring-border/50'>
            <CardHeader>
              <CardTitle className='text-lg'>معلومات الطلب</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  المورد
                </span>
                {hasMultipleSuppliers ? (
                  <span className='font-medium'>عدة موردين</span>
                ) : purchaseOrder.supplier > 0 ? (
                  <Link
                    to={`/suppliers/${purchaseOrder.supplier}`}
                    className='font-medium hover:text-primary hover:underline transition-colors'
                  >
                    {formatNameWithBalance(
                      purchaseOrder.supplier_name ||
                        `مورد #${purchaseOrder.supplier}`,
                      supplierBalanceForSupplierId(
                        purchaseOrder,
                        purchaseOrder.supplier,
                      ),
                    )}
                  </Link>
                ) : (() => {
                  const sid = purchaseOrder.items?.[0]?.supplier;
                  const name =
                    purchaseOrder.supplier_name ||
                    purchaseOrder.items?.[0]?.supplier_name ||
                    "—";
                  const bal = supplierBalanceForSupplierId(purchaseOrder, sid);
                  if (sid && sid > 0 && name !== "—") {
                    return (
                      <Link
                        to={`/suppliers/${sid}`}
                        className='font-medium hover:text-primary hover:underline transition-colors'
                      >
                        {formatNameWithBalance(name, bal)}
                      </Link>
                    );
                  }
                  return (
                    <span className='font-medium'>
                      {formatNameWithBalance(name, bal)}
                    </span>
                  );
                })()}
              </div>
              {purchaseOrder.sell_order != null &&
                purchaseOrder.sell_order > 0 && (
                  <div className='flex items-center justify-between gap-2 min-w-0'>
                    <span className='text-muted-foreground shrink-0'>
                      أمر بيع مرتبط
                    </span>
                    <LinkedSellOrderLink
                      sellOrderId={purchaseOrder.sell_order}
                      mode='badge'
                    />
                  </div>
                )}
              <Separator />
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  تاريخ الإنشاء
                </span>
                <span className='text-sm font-mono'>
                  {purchaseOrder.created_at
                    ? new Date(purchaseOrder.created_at).toLocaleDateString(
                        "ar-SA",
                      )
                    : "-"}
                </span>
              </div>
              {purchaseOrder.accepted_at && (
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground'>تاريخ الموافقة</span>
                  <span className='text-sm font-mono'>
                    {new Date(purchaseOrder.accepted_at).toLocaleDateString(
                      "ar-SA",
                    )}
                  </span>
                </div>
              )}
              {purchaseOrder.received_at && (
                <div className='flex items-center justify-between'>
                  <span className='text-muted-foreground flex items-center gap-2'>
                    <PackageCheck className='h-4 w-4 text-success' />
                    تاريخ الاستلام
                  </span>
                  <span className='text-sm font-mono'>
                    {new Date(purchaseOrder.received_at).toLocaleDateString(
                      "ar-SA",
                    )}
                  </span>
                </div>
              )}
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground flex items-center gap-2'>
                  <CalendarClock className='h-4 w-4' />
                  موعد التسليم
                </span>
                <span className='text-sm font-mono'>
                  {purchaseOrder.scheduled_at
                    ? format(new Date(purchaseOrder.scheduled_at), "yyyy/MM/dd HH:mm", {
                        locale: arSA,
                      })
                    : "—"}
                </span>
              </div>
              <Separator />
              <div className='space-y-2'>
                <Label htmlFor='scheduled_at'>تعديل موعد التسليم</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    id='scheduled_at'
                    type='datetime-local'
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    className='rounded-xl gap-2 shrink-0'
                    onClick={handleSaveSchedule}
                    disabled={scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Save className='h-4 w-4' />
                    )}
                    حفظ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments Card */}
          <Card className='shadow-sm border-none ring-1 ring-border/50'>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FileText className='h-5 w-5 text-primary' />
                المرفقات
                <Badge variant='secondary' className='mr-2 font-mono text-xs'>
                  {purchaseOrder.attachments?.length ?? 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentLinksList
                attachments={purchaseOrder.attachments}
                emptyLabel='لا توجد مرفقات لهذا الطلب'
              />
            </CardContent>
          </Card>

          {/* History Card */}
          {purchaseOrder.history_entries &&
            purchaseOrder.history_entries.length > 0 && (
              <Card className='shadow-sm border-none ring-1 ring-border/50'>
                <CardHeader>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-primary' />
                    سجل التغييرات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {purchaseOrder.history_entries.map((entry, index) => (
                      <div
                        key={entry.id}
                        className='relative pl-6 pb-4 last:pb-0'
                      >
                        {index < purchaseOrder.history_entries!.length - 1 && (
                          <div className='absolute left-2 top-3 bottom-0 w-0.5 bg-border' />
                        )}
                        <div className='absolute left-0 top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary' />
                        <div className='space-y-1'>
                          <p className='font-medium text-sm'>
                            {translatePoHistoryAction(entry.action)}
                          </p>
                          {entry.details && (
                            <p className='text-xs text-muted-foreground'>
                              {translatePoHistoryDetails(entry.details)}
                            </p>
                          )}
                          <p className='text-xs text-muted-foreground font-mono'>
                            {new Date(entry.created_at).toLocaleString("ar-SA")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}
