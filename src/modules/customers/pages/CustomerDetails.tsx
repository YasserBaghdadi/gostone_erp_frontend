import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  Clock,
  History,
  UserCheck,
  CreditCard,
  Users,
  FileText,
  File,
  Eye,
  ExternalLink,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  useCustomerDetails,
  usePrintCustomerStatement,
  useSyncCustomerToOdoo,
} from "@/hooks/useCustomers";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { useState } from "react";
import { AddPaymentModal } from "../components/AddPaymentModal";
import { CustomerTransactionsTable } from "../components/CustomerTransactionsTable";
import { customerAccentColor } from "@/lib/utils";
import {
  AttachmentPreviewDialog,
  OdooBadge,
  NationalAddressReadOnlyFields,
} from "@/components/shared";
import { inferAttachmentKindFromUrl } from "@/lib/attachmentPreview";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";

function CustomerAttachmentCard({
  url,
  label,
}: {
  url: string | null | undefined;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  if (!url) return null;
  const safeUrl = url.trim();
  if (!safeUrl) return null;
  const kind = inferAttachmentKindFromUrl(safeUrl);

  return (
    <div className='rounded-xl border border-border/50 bg-muted/10 p-3 space-y-2'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='h-10 w-10 rounded-lg bg-card flex items-center justify-center shrink-0'>
            <File className='h-5 w-5 text-primary' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium truncate'>{label}</p>
            <p className='text-[10px] text-muted-foreground truncate'>
              اضغط للمعاينة
            </p>
          </div>
        </div>

        <div className='flex items-center gap-1 shrink-0'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-primary'
            onClick={() => setOpen(true)}
            title='معاينة'
          >
            <Eye className='h-4 w-4' />
          </Button>

          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground'
            asChild
          >
            <a
              href={safeUrl}
              target='_blank'
              rel='noopener noreferrer'
              title='فتح في تبويب جديد'
            >
              <ExternalLink className='h-4 w-4' />
            </a>
          </Button>
        </div>
      </div>

      <AttachmentPreviewDialog
        open={open}
        onOpenChange={setOpen}
        src={safeUrl}
        kind={kind}
        title='معاينة الملف'
        fileName={label}
      />
    </div>
  );
}

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading, isError } = useCustomerDetails(id!);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const syncCustomerToOdooMutation = useSyncCustomerToOdoo();
  const printStatement = usePrintCustomerStatement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-muted-foreground">فشل تحميل بيانات العميل</p>
        <Button onClick={() => navigate('/customers')}>عودة للقائمة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <AddPaymentModal 
        customerId={Number(id)} 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        customerName={formatCustomerWithBalance(customer)}
      />
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-sm">
          <div
            className="w-1.5 shrink-0 self-stretch min-h-20"
            style={{ backgroundColor: customerAccentColor(customer.color) }}
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-5">
            <div className="flex w-full min-w-0 flex-1 items-start gap-4 md:flex-1">
                <Button variant="ghost" size="icon" onClick={() => navigate('/customers')} className="rounded-full shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground wrap-break-word truncate max-w-full">
                            {formatCustomerWithBalance(customer)}
                        </h1>
                        <Badge variant={customer.is_active ? "outline" : "destructive"} className={customer.is_active ? "bg-success-light text-success border-success/30" : ""}>
                            {customer.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center text-muted-foreground mt-2 gap-4 text-sm">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">تاريخ الانضمام:</span> 
                            <span dir="ltr">{customer.date_joined ? format(new Date(customer.date_joined), "PPP", { locale: arSA }) : "-"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5" />
                             <span className="hidden sm:inline">رقم العميل:</span> 
                             <span className="font-mono">#{customer.id}</span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <Button
                    variant="outline"
                    className="flex-1 md:flex-none gap-2"
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4" />
                    )}
                    <span className="sm:hidden md:inline">طباعة كشف حساب</span>
                    <span className="hidden sm:inline md:hidden">طباعة</span>
                </Button>
                <Button
                    className="flex-1 md:flex-none gap-2 border-0 bg-[#875A7B] text-white hover:bg-[#714a67] shadow-sm"
                    disabled={syncCustomerToOdooMutation.isPending}
                    onClick={() => {
                      if (!id) return;
                      syncCustomerToOdooMutation.mutate(id, {
                        onSuccess: () => {
                          toast.success("تم ربط العميل مع Odoo بنجاح");
                        },
                        onError: (error) => {
                          toast.error(parseBackendError(error) || "فشل ربط العميل مع Odoo");
                        },
                      });
                    }}
                >
                    {syncCustomerToOdooMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <OdooBadge />
                    )}
                    <span className="sm:hidden md:inline">ربط مع Odoo</span>
                    <span className="hidden sm:inline md:hidden">ربط</span>
                </Button>
                <Button className="flex-1 md:flex-none gap-2" onClick={() => setIsPaymentModalOpen(true)}>
                    <CreditCard className="h-4 w-4" />
                    <span className="sm:hidden md:inline">إضافة دفعة</span>
                    <span className="hidden sm:inline md:hidden">دفعة</span>
                </Button>
                <Link to={`/customers/${id}/edit`} className="flex-1 md:flex-none">
                    <Button variant="outline" className="w-full gap-2">
                        <Edit className="h-4 w-4" />
                        <span className="sm:hidden md:inline">تعديل</span>
                        <span className="hidden sm:inline md:hidden">تعديل</span>
                    </Button>
                </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Info */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    معلومات الاتصال
                </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">رقم الهاتف الأساسي</label>
                    <div className="flex items-center gap-2 font-mono text-lg" dir="ltr">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${customer.phone_number}`} className="hover:text-primary hover:underline transition-colors">
                          {customer.phone_number}
                        </a>
                    </div>
                </div>
                 <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</label>
                    <div className="flex items-center gap-2" dir="ltr">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {customer.email ? (
                          <a href={`mailto:${customer.email}`} className="hover:text-primary hover:underline transition-colors">
                            {customer.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic">غير مسجل</span>
                        )}
                    </div>
                </div>
                {customer.phone_number2 && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">رقم هاتف إضافي 1</label>
                         <div className="flex items-center gap-2 font-mono text-lg" dir="ltr">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${customer.phone_number2}`} className="hover:text-primary hover:underline transition-colors">
                              {customer.phone_number2}
                            </a>
                        </div>
                    </div>
                )}
                 {customer.phone_number3 && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">رقم هاتف إضافي 2</label>
                         <div className="flex items-center gap-2 font-mono text-lg" dir="ltr">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${customer.phone_number3}`} className="hover:text-primary hover:underline transition-colors">
                              {customer.phone_number3}
                            </a>
                        </div>
                    </div>
                )}

                <div className='sm:col-span-2 space-y-4'>
                  <div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                    <FileText className='h-4 w-4 text-primary' />
                    البيانات القانونية والعنوان
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    <div className='rounded-xl border border-border/50 bg-muted/10 p-3 space-y-1'>
                      <div className='text-xs text-muted-foreground font-medium'>الرقم الضريبي (VAT)</div>
                      <div className='font-mono text-sm text-foreground wrap-break-word'>
                        {customer.vat_number || "غير متوفر"}
                      </div>
                    </div>

                    <div className='rounded-xl border border-border/50 bg-muted/10 p-3 space-y-1'>
                      <div className='text-xs text-muted-foreground font-medium'>السجل التجاري (CR)</div>
                      <div className='font-mono text-sm text-foreground wrap-break-word'>
                        {customer.cr_number || "غير متوفر"}
                      </div>
                    </div>
                  </div>

                  <div className='pt-3'>
                    <NationalAddressReadOnlyFields
                      address={customer.address || customer.national_address}
                      street={customer.street}
                      building_number={customer.building_number}
                      district={customer.district}
                      secondary_number={customer.secondary_number}
                      postal_code={customer.postal_code}
                      city={customer.city}
                    />
                  </div>

                  <div className='pt-2 border-t border-border/50 space-y-3'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                      <FileText className='h-4 w-4 text-primary' />
                      الملفات المرفقة
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <CustomerAttachmentCard
                        url={customer.vat_number_file}
                        label='شهادة الضريبة'
                      />
                      <CustomerAttachmentCard
                        url={customer.cr_file}
                        label='شهادة السجل التجاري'
                      />
                      <CustomerAttachmentCard
                        url={customer.address_file}
                        label='شهادة العنوان الوطني'
                      />
                    </div>
                  </div>
                </div>
            </CardContent>
        </Card>

        {/* Stats */}
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                   <History className="h-5 w-5 text-primary" />
                    إحصائيات الزيارات
                </CardTitle>
            </CardHeader>
             <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <span className="text-muted-foreground">آخر زيارة</span>
                    <span className="font-semibold">
                         {customer.last_visit ? format(new Date(customer.last_visit), "PPP", { locale: arSA }) : "-"}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl">
                    <span className="text-muted-foreground">تكرار الزيارة (أيام)</span>
                    <span className="font-semibold font-mono text-lg">{customer.visit_repetition_days || 0}</span>
                </div>
            </CardContent>
        </Card>

         {/* Salesmen History */}
         <Card className="lg:col-span-3 border-border/50 shadow-sm">
             <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                     <Users className="h-5 w-5 text-primary" />
                     سجل مسؤولي المبيعات
                 </CardTitle>
                 <CardDescription>الموظفين الذين تعاملوا مع هذا العميل ونسبة الخصم الممنوحة</CardDescription>
             </CardHeader>
             <CardContent>
                 {customer.salesmen && customer.salesmen.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {customer.salesmen.map((salesman) => {
                              const fullName = `${salesman.first_name || ""} ${salesman.last_name || ""}`.trim();
                              const initials =
                                (salesman.first_name?.[0] || "") + (salesman.last_name?.[0] || "") || "م";
                              const displayName = fullName || salesman.phone_number || `مندوب #${salesman.id}`;
                              return (
                                <div key={salesman.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                        {initials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                         <p className="font-semibold text-sm wrap-break-word">{displayName}</p>
                                        {fullName && salesman.phone_number && (
                                          <p className="text-xs text-muted-foreground" dir="ltr">{salesman.phone_number}</p>
                                        )}
                                    </div>
                                    {salesman.discount_percentage && parseFloat(salesman.discount_percentage) > 0 && (
                                        <div className="shrink-0">
                                            <Badge variant="secondary" className="font-mono">
                                                {salesman.discount_percentage}%
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                              );
                          })}
                      </div>
                 ) : (
                     <div className="text-center py-8 text-muted-foreground">
                         لا يوجد سجل لمسؤولي المبيعات
                     </div>
                 )}
             </CardContent>
         </Card>

         {/* Transactions History */}
         <Card className="lg:col-span-3 border-border/50 shadow-sm">
             <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-lg">
                     <CreditCard className="h-5 w-5 text-primary" />
                     سجل المعاملات المالية
                 </CardTitle>
                 <CardDescription>
                    الرصيد الحالي: <span dir="ltr" className="font-mono font-bold text-primary">{customer.account?.balance || "0.00"}</span>
                 </CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-muted/30 p-3 rounded-lg border">
                          <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                          <p className="font-mono font-semibold text-lg text-success" dir="ltr">
                              {parseFloat(customer.account?.total_debit || "0").toLocaleString()}
                          </p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border">
                          <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                          <p className="font-mono font-semibold text-lg text-destructive" dir="ltr">
                              {parseFloat(customer.account?.total_credit || "0").toLocaleString()}
                          </p>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border col-span-2 md:col-span-2">
                          <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                          <p className={`font-mono font-bold text-xl ${parseFloat(customer.account?.balance || "0") < 0 ? 'text-destructive' : 'text-success'}`} dir="ltr">
                              {parseFloat(customer.account?.balance || "0").toLocaleString()} ر.س
                          </p>
                      </div>
                  </div>
                  <CustomerTransactionsTable transactions={customer.account?.transactions || []} accountId={customer.account?.id} />
                </div>
             </CardContent>
         </Card>
      </div>
    </div>
  );
}
