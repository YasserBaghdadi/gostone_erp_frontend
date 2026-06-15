import { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserCog, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useCustomerDetails,
  useUpdateCustomer,
  useConvertToActual,
} from "@/hooks/useCustomers";
import CustomerForm from "../components/CustomerForm";
import type { CustomerFormValues } from "../components/CustomerForm";
import { parseBackendError } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { parseNationalAddressString, emptyNationalAddressParts } from "@/modules/purchase_orders/utils/nationalAddress";

type BackendErrorHandler = (errors: Record<string, unknown>) => boolean;

export default function EditCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // وضع "إكمال بيانات الشركة للتحويل": يأتي من قائمة العملاء المحتملين لشركة.
  const isConvertMode = searchParams.get("convert") === "1";
  const { data: customer, isLoading } = useCustomerDetails(id!);
  const updateMutation = useUpdateCustomer();
  const convertMutation = useConvertToActual();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CustomerFormValues | null>(null);
  // دالة ربط أخطاء الباك اند بحقول النموذج (يُسجّلها CustomerForm).
  const backendErrorHandler = useRef<BackendErrorHandler | null>(null);

  const mapBackendErrorsOrToast = (error: unknown, fallback: string) => {
    const data = (error as { response?: { data?: unknown } })?.response?.data;
    let mappedToFields = false;
    if (data && typeof data === "object" && !("detail" in (data as object))) {
      mappedToFields =
        backendErrorHandler.current?.(data as Record<string, unknown>) ?? false;
    }
    if (!mappedToFields) {
      toast.error(parseBackendError(error) || fallback);
    }
    console.error(error);
  };

  const handleFormSubmit = (values: CustomerFormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!id || !pendingFormData) return;

    const formData = new FormData();
    Object.entries(pendingFormData).forEach(([key, value]) => {
      // Skip proper empty values
      if (value === "" || value === null || value === undefined) return;

      // If the form still contains an existing file URL (string) and the user didn't upload a new file,
      // we should not send it back as if it was a real file upload.
      // Backend expects multipart file objects for *_file fields.
      if (key.endsWith("_file") && typeof value === "string") return;

      // Handle File objects
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }

      // Skip generic objects that aren't Files (fixing the {} issue)
      if (typeof value === 'object' && !(value instanceof File)) return;

      // Append everything else
      formData.append(key, String(value));
    });

    updateMutation.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          // الوضع العادي: حفظ التعديلات والعودة لصفحة العميل.
          if (!isConvertMode) {
            toast.success("تم تحديث بيانات العميل بنجاح");
            navigate(`/customers/${id}`);
            return;
          }

          // وضع التحويل: بعد الحفظ نطلب تحويل العميل المحتمل إلى عميل فعلي.
          convertMutation.mutate(id, {
            onSuccess: () => {
              toast.success("تم تحويله إلى عميل فعلي");
              navigate("/potential-customers");
            },
            onError: (error: unknown) => {
              // قد يرجّع الباك اند 400 بأخطاء حقول الشركة الناقصة.
              mapBackendErrorsOrToast(error, "فشل تحويل العميل إلى فعلي");
            },
          });
        },
        onError: (error: unknown) => {
          mapBackendErrorsOrToast(error, "فشل تحديث البيانات");
        },
      }
    );

    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) return null;

  const hasApiParts =
    customer.street ||
    customer.building_number ||
    customer.district ||
    customer.secondary_number ||
    customer.postal_code ||
    customer.city;

  const defaultNationalParts = hasApiParts
    ? {
        na_short: "",
        na_governorate: "",
        na_city: customer.city || "",
        na_street: customer.street || "",
        na_building: customer.building_number || "",
        na_district: customer.district || "",
        na_additional: customer.secondary_number || "",
        na_postal: customer.postal_code || "",
      }
    : parseNationalAddressString(
        (customer.address || customer.national_address || "") as string,
      ) || emptyNationalAddressParts();

  // في وضع التحويل نُجبر النوع على "شركة"؛ وإلا نأخذ النوع المخزّن (افتراضي فرد).
  const resolvedCustomerType: CustomerFormValues["customer_type"] = isConvertMode
    ? "company"
    : customer.customer_type === "company"
    ? "company"
    : "individual";

  const isConverting = updateMutation.isPending || convertMutation.isPending;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isConvertMode ? "إكمال بيانات الشركة للتحويل" : "تعديل بيانات العميل"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isConvertMode
              ? "أكمل بيانات الشركة (الضريبة + العنوان الوطني) لتحويل العميل المحتمل إلى عميل فعلي"
              : "تحديث المعلومات الشخصية أو معلومات الاتصال"}
          </p>
        </div>
      </div>

      {isConvertMode && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">إكمال بيانات الشركة للتحويل</p>
            <p className="text-muted-foreground mt-1">
              هذا العميل محتمَل من نوع شركة. أكمل الحقول المطلوبة ثم احفظ ليتم تحويله تلقائياً إلى عميل فعلي.
            </p>
          </div>
        </div>
      )}

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" />
            بيانات العميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            forceCompany={isConvertMode}
            registerBackendErrorHandler={(handler) => {
              backendErrorHandler.current = handler;
            }}
            defaultValues={{
              first_name: customer.first_name,
              last_name: customer.last_name,
              phone_number: customer.phone_number,
              email: customer.email || "",
              phone_number2: customer.phone_number2 || "",
              phone_number3: customer.phone_number3 || "",

              customer_type: resolvedCustomerType,

              // Map new fields, with fallback to old ones if applicable/needed
              vat_number: customer.vat_number || "",
              cr_number: customer.cr_number || customer.commercial_registration || "",
              // لا نرسل `address` كنص للبك اند، فقط na_* وملفات
              address: "",
              // تمرير روابط الملفات الحالية حتى تظهر في صفحة التعديل
              vat_number_file: customer.vat_number_file ?? null,
              cr_file: customer.cr_file ?? null,
              address_file: customer.address_file ?? null,

              // تمرير تفاصيل العنوان الوطني لتعبئة الصناديق (مثل المورد)
              na_short: defaultNationalParts.na_short || "",
              na_governorate: defaultNationalParts.na_governorate || "",
              na_city: defaultNationalParts.na_city || "",
              na_street: defaultNationalParts.na_street || "",
              na_building: defaultNationalParts.na_building || "",
              na_district: defaultNationalParts.na_district || "",
              na_additional: defaultNationalParts.na_additional || "",
              na_postal: defaultNationalParts.na_postal || "",
            }}
            onSubmit={handleFormSubmit}
            isLoading={isConverting}
            buttonText={isConvertMode ? "حفظ وتحويل إلى عميل فعلي" : "حفظ التعديلات"}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title={isConvertMode ? "تأكيد الحفظ والتحويل" : "تأكيد التعديل"}
        description={
          isConvertMode
            ? "هل أنت متأكد من حفظ بيانات الشركة وتحويل العميل إلى فعلي؟"
            : "هل أنت متأكد من حفظ التعديلات على بيانات العميل؟"
        }
        confirmText={isConvertMode ? "حفظ وتحويل" : "حفظ التعديلات"}
        variant={isConvertMode ? "success" : "warning"}
        isLoading={isConverting}
      />
    </div>
  );
}
