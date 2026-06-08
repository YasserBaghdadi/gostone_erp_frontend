import { useEffect } from "react";
import { useForm, useWatch, type UseFormReturn, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Save, Phone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeSaudiPhone, formatPhoneForDisplay } from "@/components/form";
import { FileUploader } from "@/components/ui/file-uploader";
import { CustomerNationalAddressFields } from "@/modules/customers/components/CustomerNationalAddressFields";
import {
  emptyNationalAddressParts,
} from "@/modules/purchase_orders/utils/nationalAddress";

// Regex for Saudi phone number validation (accepts various formats)
const saudiPhoneRegex = /^(\+966|966|0)?5\d{8}$/;

// رسالة الحقول المطلوبة لعميل من نوع شركة
const COMPANY_REQUIRED_MSG = "مطلوب لعميل شركة";

// ... imports

const customerSchema = z
  .object({
    phone_number: z.string()
      .min(9, "رقم الهاتف مطلوب")
      .refine((val) => saudiPhoneRegex.test(val.replace(/\s/g, '')), {
        message: "رقم الهاتف غير صحيح (مثال: 05xxxxxxxx)",
      }),
    first_name: z.string().min(2, "الاسم الأول مطلوب"),
    last_name: z.string().min(2, "اسم العائلة مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
    phone_number2: z.string().optional(),
    phone_number3: z.string().optional(),

    // نوع العميل: فرد (individual) أو شركة (company). القيمة الافتراضية تُضبط عبر defaultValues.
    customer_type: z.enum(["individual", "company"]),

    // New Fields
    vat_number: z.string().optional(),
    vat_number_file: z.any().optional(),

    cr_number: z.string().optional(),
    cr_file: z.any().optional(),

    // Legacy fallback address (text as sent to backend)
    address: z.string().optional().or(z.literal("")),
    address_file: z.any().optional(),

    // National Address (structured UI fields, converted to `address` on submit)
    na_short: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((s) => !s || s.length === 8, "العنوان المختصر 8 خانات أو اتركه فارغاً"),
    na_governorate: z.string().optional().or(z.literal("")),
    na_city: z.string().optional().or(z.literal("")),
    na_street: z.string().optional().or(z.literal("")),
    na_building: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((s) => !s || /^\d{4}$/.test(s), "رقم المبنى (4 أرقام)"),
    na_district: z.string().optional().or(z.literal("")),
    na_additional: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((s) => !s || /^\d{4}$/.test(s), "الرقم الفرعي (4 أرقام)"),
    na_postal: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((s) => !s || /^\d{5}$/.test(s), "الرمز البريدي (5 أرقام)"),

    // تفكيك العنوان المفكك للباك اند (لا نرسل `address` كنص)
    street: z.string().optional().or(z.literal("")),
    building_number: z.string().optional().or(z.literal("")),
    district: z.string().optional().or(z.literal("")),
    secondary_number: z.string().optional().or(z.literal("")),
    postal_code: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
  })
  // الحقول السبعة الخاصة بالشركة مطلوبة فقط عندما يكون نوع العميل "شركة".
  // نتحقق من حقول الإدخال (na_*) التي تُحوَّل لاحقاً إلى مفككات العنوان للباك اند،
  // بالإضافة إلى الرقم الضريبي والسجل التجاري.
  .superRefine((data, ctx) => {
    if (data.customer_type !== "company") return;

    const requiredCompanyFields: Array<keyof typeof data> = [
      "vat_number",
      "cr_number",
      "na_building",
      "na_street",
      "na_district",
      "na_city",
      "na_postal",
    ];

    requiredCompanyFields.forEach((field) => {
      const value = data[field];
      if (!value || String(value).trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: COMPANY_REQUIRED_MSG,
        });
      }
    });
  });

export type CustomerFormValues = z.infer<typeof customerSchema>;

/**
 * يربط أخطاء الحقول القادمة من الباك اند (HTTP 400) على حقول النموذج الصحيحة.
 * الباك اند يرجّع الأخطاء بأسماء حقول الـ payload (مثل building_number)، بينما
 * النموذج يستخدم حقول الإدخال (مثل na_building)، فنحتاج إلى تحويل الأسماء.
 */
const BACKEND_TO_FORM_FIELD: Record<string, keyof CustomerFormValues> = {
  vat_number: "vat_number",
  cr_number: "cr_number",
  building_number: "na_building",
  street: "na_street",
  district: "na_district",
  city: "na_city",
  postal_code: "na_postal",
  secondary_number: "na_additional",
  phone_number: "phone_number",
  phone_number2: "phone_number2",
  phone_number3: "phone_number3",
  first_name: "first_name",
  last_name: "last_name",
  email: "email",
  customer_type: "customer_type",
};

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  isLoading?: boolean;
  buttonText?: string;
  /** عند true: يُجبَر نوع العميل على "شركة" ويُخفى منتقي النوع (وضع إكمال بيانات التحويل). */
  forceCompany?: boolean;
  /**
   * يستقبل الأب دالةً لتمرير أخطاء الباك اند (object من DRF) إلى النموذج.
   * تُعيد true إذا تم التعرّف على خطأ حقل واحد على الأقل وعرضه على الإدخال المناسب.
   */
  registerBackendErrorHandler?: (
    handler: (errors: Record<string, unknown>) => boolean,
  ) => void;
}

// Phone Input Field Component

// Phone Input Field Component
function PhoneInputField({
  value,
  onChange,
  placeholder = "05xxxxxxxx",
  ...props
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only digits for entry
    const sanitized = input.replace(/[^\d]/g, '');
    // Normalize to +966 format for storage
    const normalized = normalizeSaudiPhone(sanitized);
    onChange(normalized);
  };

  // Display in local format (05xxxxxxxx)
  const displayValue = formatPhoneForDisplay(value);

  return (
    <div className="relative">
      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="tel"
        inputMode="numeric"
        dir="ltr"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        className="pr-10 text-left"
        {...props}
      />
    </div>
  );
}

/**
 * يبني دالةً تربط أخطاء الباك اند على النموذج. تُستخدم من الأب عبر
 * registerBackendErrorHandler.
 */
function buildBackendErrorHandler(form: UseFormReturn<CustomerFormValues>) {
  return (errors: Record<string, unknown>): boolean => {
    let handled = false;
    Object.entries(errors).forEach(([key, value]) => {
      const formField = BACKEND_TO_FORM_FIELD[key];
      if (!formField) return;
      const message = Array.isArray(value) ? value.join("، ") : String(value);
      form.setError(formField as Path<CustomerFormValues>, { message });
      handled = true;
    });
    return handled;
  };
}

// ... helper components

export default function CustomerForm({
  defaultValues,
  onSubmit,
  isLoading,
  buttonText = "حفظ",
  forceCompany = false,
  registerBackendErrorHandler,
}: CustomerFormProps) {

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phone_number: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number2: "",
      phone_number3: "",
      customer_type: forceCompany ? "company" : "individual",
      vat_number: "",
      cr_number: "",
      address: "",
      ...emptyNationalAddressParts(),
      ...defaultValues,
      ...(forceCompany ? { customer_type: "company" as const } : {}),
    },
  });

  // عند وضع التحويل (forceCompany) نُثبّت نوع العميل على "شركة".
  useEffect(() => {
    if (forceCompany) {
      form.setValue("customer_type", "company");
    }
  }, [forceCompany, form]);

  // نمرّر للأب دالة ربط أخطاء الباك اند بالنموذج.
  useEffect(() => {
    if (registerBackendErrorHandler) {
      registerBackendErrorHandler(buildBackendErrorHandler(form));
    }
  }, [registerBackendErrorHandler, form]);

  // Transform values before submit (ensure all phones are normalized)
  const handleSubmit = (values: CustomerFormValues) => {
    // نبني مفككات العنوان التي يستقبلها الـ API مباشرة من صناديق العنوان.
    // ملاحظة: لا نرسل `address` كنص لضمان توافق الـ backend.
    const payload = {
      ...values,
      street: values.na_street || "",
      building_number: values.na_building || "",
      district: values.na_district || "",
      secondary_number: values.na_additional || "",
      postal_code: values.na_postal || "",
      city: values.na_city || "",
      phone_number: normalizeSaudiPhone(values.phone_number),
      phone_number2: values.phone_number2
        ? normalizeSaudiPhone(values.phone_number2)
        : "",
      phone_number3: values.phone_number3
        ? normalizeSaudiPhone(values.phone_number3)
        : "",
    };

    const {
      // نحذف حقول الـ UI حتى لا تصل لـ backend
      na_short,
      na_governorate,
      na_city,
      na_street,
      na_building,
      na_district,
      na_additional,
      na_postal,
      // ونحذف عنوان النص بالكامل
      address: _address,
      // address_file سنحتفظ به
      ...rest
    } = payload;

    onSubmit(rest as CustomerFormValues);
  };

  // Watch fields to conditionally show file uploads
  const customerType = useWatch({ control: form.control, name: "customer_type" });
  const vatNumber = useWatch({ control: form.control, name: "vat_number" });
  const crNumber = useWatch({ control: form.control, name: "cr_number" });
  const vatFile = useWatch({ control: form.control, name: "vat_number_file" });
  const crFile = useWatch({ control: form.control, name: "cr_file" });

  const isCompany = customerType === "company";

  const hasExistingFile = (v: unknown): boolean => {
    if (typeof v === "string") return v.trim().length > 0;
    if (!v) return false;
    return v instanceof File;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
            {/* نوع العميل */}
            <FormField
            control={form.control}
            name="customer_type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>نوع العميل <span className="text-destructive">*</span></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={forceCompany}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع العميل" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="individual">فرد</SelectItem>
                    <SelectItem value="company">شركة</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Phone Number */}
            <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
                <FormItem>
                <FormLabel>رقم الهاتف الأساسي <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                    <PhoneInputField
                      value={field.value}
                      onChange={field.onChange}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             {/* Email */}
             <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>البريد الإلكتروني</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="user@example.com" dir="ltr" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* First Name */}
            <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>الاسم الأول <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Last Name */}
            <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>اسم العائلة <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                    <Input {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Phone 2 */}
            <FormField
            control={form.control}
            name="phone_number2"
            render={({ field }) => (
                <FormItem>
                <FormLabel>رقم هاتف إضافي 1</FormLabel>
                <FormControl>
                    <PhoneInputField
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="اختياري"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            {/* Phone 3 */}
            <FormField
            control={form.control}
            name="phone_number3"
            render={({ field }) => (
                <FormItem>
                <FormLabel>رقم هاتف إضافي 2</FormLabel>
                <FormControl>
                    <PhoneInputField
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="اختياري"
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {/* بيانات الشركة — تظهر فقط عندما يكون نوع العميل "شركة" */}
        {isCompany && (
        <div className="border-t pt-6 mt-6 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            بيانات الشركة (الضريبة + العنوان الوطني)
          </h3>
          <div className="grid gap-6 md:grid-cols-2">

            {/* VAT Number */}
            <FormField
              control={form.control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الرقم الضريبي <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value?.toString() || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CR Number */}
            <FormField
              control={form.control}
              name="cr_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السجل التجاري <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value?.toString() || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VAT File */}
            {(vatNumber || hasExistingFile(vatFile)) && (
              <div className="col-span-full animate-in fade-in slide-in-from-top-2">
                  <FileUploader
                      control={form.control}
                      name="vat_number_file"
                      label="ملف الرقم الضريبي (VAT)"
                      description="ارفق ملف الرقم الضريبي"
                      accept={{ "image/*": [], "application/pdf": [".pdf"] }}
                  />
              </div>
            )}

             {/* CR File */}
            {(crNumber || hasExistingFile(crFile)) && (
              <div className="col-span-full animate-in fade-in slide-in-from-top-2">
                  <FileUploader
                      control={form.control}
                      name="cr_file"
                      label="ملف السجل التجاري"
                      description="ارفق ملف السجل التجاري"
                      accept={{ "image/*": [], "application/pdf": [".pdf"] }}
                  />
              </div>
            )}

            <div className="col-span-full space-y-4 rounded-xl border border-border/50 bg-muted/10 p-4">
              <CustomerNationalAddressFields control={form.control} />

              <FileUploader
                control={form.control}
                name="address_file"
                label="ملف العنوان الوطني"
                description="ارفق ملف العنوان الوطني (PDF/Image)"
                accept={{ "image/*": [], "application/pdf": [".pdf"] }}
              />
            </div>
          </div>
        </div>
        )}

        <Button type="submit" className="w-full md:w-auto min-w-[200px]" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="ml-2 h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
