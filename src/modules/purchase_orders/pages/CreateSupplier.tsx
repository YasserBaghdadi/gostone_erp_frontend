import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ArrowRight,
  Save,
  Loader2,
  User,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateSupplier, useUpdateSupplier, useSupplierDetails } from "@/hooks/useSuppliers";
import { parseBackendError } from "@/lib/utils";
import { formatSupplierWithBalance } from "@/lib/partyDisplay";
import { PhoneInputField, normalizeSaudiPhone } from "@/components/form";
import { FileUploader } from "@/components/ui/file-uploader";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CustomerNationalAddressFields } from "@/modules/customers/components/CustomerNationalAddressFields";
import {
  buildNationalAddressString,
  parseNationalAddressString,
  emptyNationalAddressParts,
  type NationalAddressParts,
} from "@/modules/purchase_orders/utils/nationalAddress";

const supplierSchema = z.object({
  first_name: z.string().min(2, "اسم الشركة يجب أن يكون حرفين على الأقل"),
  last_name: z.string().optional(),
  display_name: z.string().optional(),
  contact_name: z.string().min(2, "جهة الاتصال مطلوبة"),
  phone_number: z.string().min(9, "رقم الهاتف غير صحيح"),
  phone_number2: z.string().optional().or(z.literal("")),
  phone_number3: z.string().optional().or(z.literal("")),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  address_file: z.any().optional(),
  national_address_file: z.any().optional(),
  vat_number: z.string().optional().or(z.literal("")),
  vat_number_file: z.any().optional(),
  tax_number: z.string().optional().or(z.literal("")),
  tax_file: z.any().optional(),
  cr_number: z.string().optional().or(z.literal("")),
  cr_file: z.any().optional(),
  commercial_registration: z.string().optional().or(z.literal("")),
  commercial_registration_file: z.any().optional(),
  national_address: z.string().optional().or(z.literal("")),
  street: z.string().optional().or(z.literal("")),
  building_number: z.string().optional().or(z.literal("")),
  district: z.string().optional().or(z.literal("")),
  secondary_number: z.string().optional().or(z.literal("")),
  postal_code: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  na_city: z.string().min(1, "المدينة مطلوبة"),
  na_street: z.string().min(1, "الشارع مطلوب"),
  na_building: z.string().regex(/^\d{4}$/, "رقم المبنى (4 أرقام)"),
  na_district: z.string().min(1, "الحي مطلوب"),
  na_additional: z.string().regex(/^\d{4}$/, "الرقم الفرعي (4 أرقام)"),
  na_postal: z.string().regex(/^\d{5}$/, "الرمز البريدي (5 أرقام)"),
});

type FormValues = z.infer<typeof supplierSchema>;

export default function CreateSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(id!);
  const { data: existingSupplier, isLoading: isLoadingDetails } = useSupplierDetails(id!);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const legacyAddressPreview = useMemo(() => {
    const rawAddress =
      existingSupplier?.national_address || existingSupplier?.address || "";
    if (!isEditing || !rawAddress) return null;
    const p = parseNationalAddressString(rawAddress);
    const structured =
      p.na_city ||
      p.na_street ||
      p.na_building ||
      p.na_district ||
      p.na_additional ||
      p.na_postal;
    if (structured) return null;
    return rawAddress;
  }, [isEditing, existingSupplier?.address, existingSupplier?.national_address]);

  const form = useForm<FormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      display_name: "",
      contact_name: "",
      phone_number: "",
      phone_number2: "",
      phone_number3: "",
      email: "",
      address_file: undefined,
      national_address_file: undefined,
      vat_number: "",
      vat_number_file: undefined,
      tax_number: "",
      tax_file: undefined,
      cr_number: "",
      cr_file: undefined,
      commercial_registration: "",
      commercial_registration_file: undefined,
      national_address: "",
      street: "",
      building_number: "",
      district: "",
      secondary_number: "",
      postal_code: "",
      city: "",
      notes: "",
      ...emptyNationalAddressParts(),
    },
  });

  useEffect(() => {
    if (isEditing && existingSupplier) {
      const rawAddress =
        existingSupplier.national_address || existingSupplier.address || "";
      const parsed = parseNationalAddressString(rawAddress);
      const hasParsed =
        parsed.na_city ||
        parsed.na_street ||
        parsed.na_building ||
        parsed.na_district ||
        parsed.na_additional ||
        parsed.na_postal;

      form.reset({
        first_name: existingSupplier.first_name,
        last_name: existingSupplier.last_name || "",
        display_name: existingSupplier.display_name || "",
        contact_name: existingSupplier.contact_name || "",
        phone_number: existingSupplier.phone_number,
        phone_number2: existingSupplier.phone_number2 || "",
        phone_number3: existingSupplier.phone_number3 || "",
        email: existingSupplier.email || "",
        vat_number: existingSupplier.vat_number || "",
        vat_number_file:
          existingSupplier.vat_number_file || existingSupplier.tax_file || undefined,
        tax_number:
          existingSupplier.tax_number !== undefined &&
          existingSupplier.tax_number !== null
            ? String(existingSupplier.tax_number)
            : existingSupplier.vat_number || "",
        tax_file:
          existingSupplier.tax_file || existingSupplier.vat_number_file || undefined,
        cr_number:
          existingSupplier.cr_number || existingSupplier.commercial_registration || "",
        cr_file:
          existingSupplier.cr_file ||
          existingSupplier.commercial_registration_file ||
          undefined,
        commercial_registration:
          existingSupplier.commercial_registration || existingSupplier.cr_number || "",
        commercial_registration_file:
          existingSupplier.commercial_registration_file ||
          existingSupplier.cr_file ||
          undefined,
        address_file:
          existingSupplier.address_file ||
          existingSupplier.national_address_file ||
          undefined,
        national_address_file:
          existingSupplier.national_address_file ||
          existingSupplier.address_file ||
          undefined,
        national_address: rawAddress,
        street: existingSupplier.street || "",
        building_number: existingSupplier.building_number || "",
        district: existingSupplier.district || "",
        secondary_number: existingSupplier.secondary_number || "",
        postal_code: existingSupplier.postal_code || "",
        city: existingSupplier.city || "",
        notes: existingSupplier.notes || "",
        ...(hasParsed
          ? parsed
          : {
              ...emptyNationalAddressParts(),
            }),
      });
    }
  }, [existingSupplier, isEditing, form]);

  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = async () => {
    if (!pendingFormData) return;
    const values = pendingFormData;
    try {
      const na: NationalAddressParts = {
        na_short: "",
        na_governorate: "",
        na_city: values.na_city,
        na_street: values.na_street,
        na_building: values.na_building,
        na_district: values.na_district,
        na_additional: values.na_additional,
        na_postal: values.na_postal,
      };
      const address = buildNationalAddressString(na);

      const {
        na_city: _nc,
        na_street: _nst,
        na_building: _nb,
        na_district: _nd,
        na_additional: _na,
        na_postal: _np,
        ...rest
      } = values;

      const normalizedValues = {
        ...rest,
        tax_number: values.tax_number || values.vat_number || "",
        commercial_registration:
          values.commercial_registration || values.cr_number || "",
        street: values.na_street || "",
        building_number: values.na_building || "",
        district: values.na_district || "",
        secondary_number: values.na_additional || "",
        postal_code: values.na_postal || "",
        city: values.na_city || "",
        national_address: address,
        national_address_file:
          values.national_address_file ?? values.address_file ?? undefined,
        commercial_registration_file:
          values.commercial_registration_file ?? values.cr_file ?? undefined,
        tax_file: values.tax_file ?? values.vat_number_file ?? undefined,
        phone_number: normalizeSaudiPhone(values.phone_number),
        phone_number2: values.phone_number2 ? normalizeSaudiPhone(values.phone_number2) : "",
        phone_number3: values.phone_number3 ? normalizeSaudiPhone(values.phone_number3) : "",
      };

      if (isEditing) {
        await updateMutation.mutateAsync(normalizedValues);
        toast.success("تم تحديث بيانات المورد بنجاح");
      } else {
        await createMutation.mutateAsync(normalizedValues);
        toast.success("تم إضافة المورد بنجاح");
      }
      navigate("/suppliers");
    } catch (error: any) {
      if (error?.response?.data && typeof error.response.data === 'object' && !error.response.data.detail) {
        Object.entries(error.response.data).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join("، ") : String(value);
          form.setError(key as any, { message });
        });
      } else {
        toast.error(parseBackendError(error));
      }
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };


  if (isEditing && isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full h-10 w-10 shrink-0">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
              {isEditing && existingSupplier
                ? `تعديل المورد: ${formatSupplierWithBalance(existingSupplier)}`
                : "إضافة مورد جديد"}
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-wider font-medium mt-1">
              {isEditing ? "تحديث بيانات المورد الحالي" : "تسجيل مورد جديد في النظام"}
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
          
          {/* Right Column: Main Info (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* بيانات المورد */}
            <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                        بيانات المورد
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid gap-8">
                    <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>اسم الشركة <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="مثال: شركة الأمل" {...field} className="h-11 rounded-xl" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                        <FormField
                            control={form.control}
                            name="vat_number"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>الرقم الضريبي</FormLabel>
                                <FormControl>
                                    <Input placeholder="30xxxxxxxx" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FileUploader
                            control={form.control}
                            name="vat_number_file"
                            label="شهادة الضريبة"
                            description="PDF أو صورة (حد أقصى 5MB)"
                            accept={{ "image/*": [], "application/pdf": [".pdf"] }}
                        />
                    </div>

                    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/10 p-4">
                        <FormField
                            control={form.control}
                            name="cr_number"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>رقم السجل التجاري</FormLabel>
                                <FormControl>
                                    <Input placeholder="10xxxxxxxx" {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FileUploader
                            control={form.control}
                            name="cr_file"
                            label="شهادة السجل التجاري"
                            description="PDF أو صورة (حد أقصى 5MB)"
                            accept={{ "image/*": [], "application/pdf": [".pdf"] }}
                        />
                    </div>

                    <div className="space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                        {legacyAddressPreview && (
                          <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 text-sm text-foreground">
                            <p className="font-medium mb-1">
                              عنوان محفوظ بالشكل النصي — أعد إدخال الحقول أدناه للتحديث
                            </p>
                            <p className="text-xs opacity-90 wrap-break-word leading-relaxed">
                              {legacyAddressPreview}
                            </p>
                          </div>
                        )}
                        <CustomerNationalAddressFields control={form.control} />
                        <FileUploader
                            control={form.control}
                            name="address_file"
                            label="شهادة العنوان الوطني"
                            description="PDF أو صورة (حد أقصى 5MB)"
                            accept={{ "image/*": [], "application/pdf": [".pdf"] }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* الشخص المسؤول */}
             <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-primary" />
                        الشخص المسؤول
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="contact_name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>اسم جهة الاتصال <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="الشخص الذي يتم التواصل معه..." {...field} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone_number"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>رقم الهاتف الأساسي <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <PhoneInputField value={field.value} onChange={field.onChange} className="h-11 rounded-xl" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>البريد الإلكتروني</FormLabel>
                                <FormControl>
                                    <Input placeholder="example@company.com" {...field} className="h-11 rounded-xl" dir="ltr" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone_number2"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>هاتف إضافي 1</FormLabel>
                                <FormControl>
                                    <PhoneInputField value={field.value || ''} onChange={field.onChange} placeholder="اختياري" className="h-11 rounded-xl" />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="phone_number3"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>هاتف إضافي 2</FormLabel>
                                <FormControl>
                                    <PhoneInputField value={field.value || ''} onChange={field.onChange} placeholder="اختياري" className="h-11 rounded-xl" />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

             {/* Action Buttons (Desktop) */}
             <div className="hidden lg:flex items-center justify-between p-4 bg-card border rounded-2xl shadow-sm">
                <Button variant="ghost" type="button" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                    إلغاء
                </Button>
                <Button 
                    type="submit" 
                    size="lg" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold gap-2 min-w-[200px]"
                >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5" />
                    )}
                    {isEditing ? "حفظ التغييرات" : "حفظ وإضافة المورد"}
                </Button>
             </div>
          </div>

          {/* Left Column: Notes (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border/50">
                 <CardHeader className="pb-3">
                    <CardTitle className="text-base">ملاحظات إضافية</CardTitle>
                </CardHeader>
                 <CardContent>
                    <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea 
                                placeholder="اكتب أي ملاحظات هنا..." 
                                {...field} 
                                className="min-h-[120px] resize-none rounded-xl" 
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 </CardContent>
            </Card>

             {/* Action Buttons (Mobile) */}
             <div className="lg:hidden grid gap-3">
                <Button 
                    type="submit" 
                    size="lg" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="w-full rounded-xl shadow-lg"
                >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Save className="h-5 w-5 ml-2" />
                    )}
                    {isEditing ? "حفظ التغييرات" : "حفظ المورد"}
                </Button>
                <Button variant="outline" type="button" onClick={() => navigate(-1)} className="w-full">
                    إلغاء
                </Button>
             </div>
          </div>

        </form>
      </Form>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإضافة"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات على بيانات المورد؟" : "هل أنت متأكد من إضافة هذا المورد؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إضافة المورد"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
