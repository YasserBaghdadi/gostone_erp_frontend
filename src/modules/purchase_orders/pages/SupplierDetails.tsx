import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { 
  ArrowRight, 
  Edit, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  FileText,
  Calendar,
  Contact,
  CheckCircle,
  Clock,
  Eye,
  ShoppingCart,
  File,
  CreditCard,
  ExternalLink,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  usePrintSupplierStatement,
  useSupplierDetails,
} from "@/hooks/useSuppliers";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { CustomerTransactionsTable } from "@/modules/customers/components/CustomerTransactionsTable";
import type { CustomerTransaction } from "@/types";
import { AttachmentPreviewDialog } from "@/components/shared/AttachmentPreviewDialog";
import { NationalAddressReadOnlyFields } from "@/components/shared";
import { inferAttachmentKindFromUrl } from "@/lib/attachmentPreview";
import { formatSupplierWithBalance } from "@/lib/partyDisplay";
import { toast } from "sonner";
import { useCan } from "@/hooks/usePermissions";

export default function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useCan();
  const { data: supplier, isLoading, isError } = useSupplierDetails(id!);
  const printStatement = usePrintSupplierStatement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive text-lg font-bold">فشل تحميل بيانات المورد</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للموردين
        </Button>
      </div>
    );
  }

  const normalizeStr = (v: unknown): string => String(v ?? "").trim();
  const vatNumber = normalizeStr(supplier.vat_number);
  const vatFileUrl = normalizeStr(supplier.vat_number_file);
  const taxNumber = supplier.tax_number === null || supplier.tax_number === undefined ? "" : normalizeStr(supplier.tax_number);
  const taxFileUrl = normalizeStr(supplier.tax_file);

  const crNumber = normalizeStr(supplier.cr_number);
  const crFileUrl = normalizeStr(supplier.cr_file);
  const commercialRegistration =
    supplier.commercial_registration === null || supplier.commercial_registration === undefined
      ? ""
      : normalizeStr(supplier.commercial_registration);
  const commercialFileUrl = normalizeStr(supplier.commercial_registration_file);

  const addressFileUrl = normalizeStr(supplier.address_file);
  const nationalAddressFileUrl = normalizeStr(supplier.national_address_file);

  const shouldShowTaxBlock =
    (!!taxNumber && taxNumber !== vatNumber) || (!!taxFileUrl && taxFileUrl !== vatFileUrl);
  const shouldShowCommercialBlock =
    (!!commercialRegistration && commercialRegistration !== crNumber) ||
    (!!commercialFileUrl && commercialFileUrl !== crFileUrl);

  // المطلوب: عرض ملف واحد فقط لشهادة العنوان الوطني.
  // نستخدم `address_file` أولاً، ولو غير موجود نستخدم `national_address_file` كبديل.
  const resolvedAddressFile = addressFileUrl
    ? { url: addressFileUrl, label: "شهادة العنوان الوطني" }
    : nationalAddressFileUrl
      ? { url: nationalAddressFileUrl, label: "شهادة العنوان الوطني" }
      : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-muted h-12 w-12 shrink-0">
            <ArrowRight className="h-6 w-6" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
              {formatSupplierWithBalance(supplier)}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">#{supplier.id}</span>
              <span className="text-sm">تفاصيل بيانات المورد</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto flex-wrap">
          {can("suppliers.statement") && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 md:flex-none rounded-xl gap-2 font-bold min-w-[140px]"
              disabled={printStatement.isPending}
              onClick={() =>
                id &&
                printStatement.mutate(
                  { id },
                  {
                    onError: () =>
                      toast.error("تعذّر طباعة كشف الحساب"),
                  },
                )
              }
            >
              {printStatement.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Printer className="h-5 w-5" />
              )}
              طباعة كشف حساب
            </Button>
          )}
          {can("suppliers.edit") && (
            <Link to={`/suppliers/${id}/edit`} className="flex-1 md:flex-none">
              <Button size="lg" className="w-full rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 gap-2 font-bold min-w-[160px]">
                <Edit className="h-5 w-5" />
                تعديل المورد
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Basic & Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                بيانات المورد
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <InfoItem
                icon={Building2}
                label="اسم الشركة"
                value={formatSupplierWithBalance(supplier)}
              />

              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <InfoItem
                  icon={FileText}
                  label="الرقم الضريبي"
                  value={supplier.vat_number || "غير متوفر"}
                />
                {supplier.vat_number_file && (
                  <FileCard
                    url={supplier.vat_number_file}
                    label="شهادة الضريبة"
                    type="vat"
                  />
                )}
              </div>

              {shouldShowTaxBlock ? (
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                  <InfoItem
                    icon={FileText}
                    label="الرقم الضريبي الموحد"
                    value={taxNumber || "غير متوفر"}
                  />
                  {supplier.tax_file && (
                    <FileCard
                      url={supplier.tax_file}
                      label="ملف الرقم الضريبي"
                      type="vat"
                    />
                  )}
                </div>
              ) : null}

              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <InfoItem
                  icon={FileText}
                  label="رقم السجل التجاري"
                  value={supplier.cr_number || "غير متوفر"}
                />
                {supplier.cr_file && (
                  <FileCard
                    url={supplier.cr_file}
                    label="شهادة السجل التجاري"
                    type="cr"
                  />
                )}
              </div>

              {shouldShowCommercialBlock ? (
                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                  <InfoItem
                    icon={FileText}
                    label="السجل التجاري"
                    value={commercialRegistration || "غير متوفر"}
                  />
                  {supplier.commercial_registration_file && (
                    <FileCard
                      url={supplier.commercial_registration_file}
                      label="ملف السجل التجاري"
                      type="cr"
                    />
                  )}
                </div>
              ) : null}

              <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5" />
                  العنوان الوطني
                </div>
                <NationalAddressReadOnlyFields
                  address={supplier.national_address || supplier.address}
                  street={supplier.street}
                  building_number={supplier.building_number}
                  district={supplier.district}
                  secondary_number={supplier.secondary_number}
                  postal_code={supplier.postal_code}
                  city={supplier.city}
                />
                {resolvedAddressFile ? (
                  <FileCard
                    url={resolvedAddressFile.url}
                    label={resolvedAddressFile.label}
                    type="address"
                  />
                ) : null}
                {/* لا نعرض ملفًا ثانيًا لتجنب التكرار */}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                الشخص المسؤول
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid sm:grid-cols-2 gap-6">
              <InfoItem icon={Contact} label="اسم جهة الاتصال" value={supplier.contact_name || "غير محدد"} />
              <InfoItem icon={Phone} label="رقم الهاتف الأساسي" value={supplier.phone_number} dir="ltr" isPhone />
              <InfoItem icon={Mail} label="البريد الإلكتروني" value={supplier.email || "غير متوفر"} isEmail />
              <InfoItem icon={Phone} label="هاتف إضافي 1" value={supplier.phone_number2 || "غير متوفر"} dir="ltr" isPhone />
              <InfoItem icon={Phone} label="هاتف إضافي 2" value={supplier.phone_number3 || "غير متوفر"} dir="ltr" isPhone />
            </CardContent>
          </Card>

          {/* Financial Transactions */}
          {supplier.account && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-primary" />
                  سجل المعاملات المالية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                      <p className="font-mono font-semibold text-lg text-success" dir="ltr">
                        {parseFloat(supplier.account.total_debit || "0").toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                      <p className="font-mono font-semibold text-lg text-destructive" dir="ltr">
                        {parseFloat(supplier.account.total_credit || "0").toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border col-span-2 md:col-span-2">
                      <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                      <p className={`font-mono font-bold text-xl ${parseFloat(supplier.account.balance || "0") < 0 ? 'text-destructive' : 'text-success'}`} dir="ltr">
                        {parseFloat(supplier.account.balance || "0").toLocaleString()} ر.س
                      </p>
                    </div>
                  </div>
                  <CustomerTransactionsTable
                    transactions={(supplier.account.journal_entries || []) as CustomerTransaction[]}
                    accountId={supplier.account.id}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
           <Card className="border-none shadow-md ring-1 ring-border/50 bg-linear-to-br from-primary/5 to-primary/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 opacity-50" />
                <CardContent className="p-8 text-center relative z-10">
                    <div className="w-16 h-16 bg-background rounded-2xl shadow-sm border border-primary/20 flex items-center justify-center mx-auto mb-4 transform rotate-3 transition-transform hover:rotate-0">
                        <ShoppingCart className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-4xl font-bold text-primary mb-1">{supplier.order_count}</h3>
                    <p className="text-muted-foreground text-sm font-medium">إجمالي طلبات الشراء</p>
                </CardContent>
           </Card>

           <Card className="border-none shadow-sm ring-1 ring-border/50">
                <CardContent className="p-6 space-y-5">
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">تاريخ التسجيل</span>
                            <span className="font-medium">
                                {format(new Date(supplier.created_at), "PPP", { locale: arSA })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                             <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">وقت التسجيل</span>
                            <span className="font-medium" dir="ltr">
                                {format(new Date(supplier.created_at), "p")}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                             <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">تم الإنشاء بواسطة</span>
                            <span className="font-medium">
                                مستخدم #{supplier.created_by}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm pt-4 border-t border-dashed">
                        <div className="h-8 w-8 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                            <CheckCircle className="h-4 w-4 text-success" />
                        </div>
                        <div className="flex flex-col mr-auto items-end flex-1">
                             <span className="text-xs text-muted-foreground mb-1">حالة الحساب</span>
                             <Badge variant="outline" className="px-2 bg-success-light text-success border-success/20">نشط</Badge>
                        </div>
                    </div>
                </CardContent>
           </Card>

           {supplier.notes && (
             <Card className="border-none shadow-sm ring-1 ring-border/50">
                 <CardHeader>
                     <CardTitle className="text-lg">ملاحظات إضافية</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <p className="text-muted-foreground text-sm bg-muted/20 p-4 rounded-xl border border-dashed whitespace-pre-wrap leading-relaxed">
                         {supplier.notes}
                     </p>
                 </CardContent>
             </Card>
           )}
        </div>
       </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, dir, isPhone, isEmail }: { icon: any, label: string, value: string, dir?: "ltr" | "rtl", isPhone?: boolean, isEmail?: boolean }) {
  const renderValue = () => {
    if (isPhone && value && value !== "غير متوفر") {
      return (
        <a href={`tel:${value}`} className="hover:text-primary hover:underline transition-colors">
          {value}
        </a>
      );
    }
    if (isEmail && value && value !== "غير متوفر") {
      return (
        <a href={`mailto:${value}`} className="hover:text-primary hover:underline transition-colors">
          {value}
        </a>
      );
    }
    return value;
  };

  return (
    <div className="group space-y-1.5 p-3 rounded-xl hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider group-hover:text-primary transition-colors">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className={`font-bold text-foreground text-sm md:text-base wrap-break-word ${dir === 'ltr' ? 'text-left' : ''}`} dir={dir}>
        {renderValue()}
      </div>
    </div>
  );
}

function FileCard({ url, label, type }: { url: string; label: string; type: "cr" | "vat" | "address" }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const kind = inferAttachmentKindFromUrl(url);

  return (
    <>
      <div
        role='button'
        tabIndex={0}
        onClick={() => setPreviewOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setPreviewOpen(true);
          }
        }}
        className='flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors group cursor-pointer'
      >
        <div
          className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${
            type === "cr"
              ? "bg-info-light text-info"
              : type === "vat"
                ? "bg-success-light text-success"
                : "bg-warning-light text-warning"
          }`}
        >
          <File className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          <p className="text-[10px] text-muted-foreground truncate">
            اضغط للمعاينة أو استخدم الزر
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 h-8 w-8 text-muted-foreground group-hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setPreviewOpen(true);
          }}
          title="معاينة"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="فتح في تاب جديد"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <AttachmentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        src={url}
        kind={kind}
        fileName={label}
        title={label}
      />
    </>
  );
}
