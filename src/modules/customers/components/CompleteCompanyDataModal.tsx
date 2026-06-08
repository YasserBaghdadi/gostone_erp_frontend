import { useRef } from "react";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCustomerDetails, useUpdateCustomer } from "@/hooks/useCustomers";
import CustomerForm, { type CustomerFormValues } from "./CustomerForm";
import { parseBackendError } from "@/lib/utils";
import {
  parseNationalAddressString,
  emptyNationalAddressParts,
} from "@/modules/purchase_orders/utils/nationalAddress";

type BackendErrorHandler = (errors: Record<string, unknown>) => boolean;

interface Props {
  customerId: string | number | null;
  open: boolean;
  onClose: () => void;
  /** Called after the company data is saved successfully (e.g. retry the order). */
  onCompleted: () => void;
}

/**
 * Inline «إكمال بيانات الشركة»: shown when an action (issuing a work order /
 * converting) is blocked because a company customer is missing its tax +
 * national-address data. Saves the data to the customer, then calls onCompleted.
 */
export default function CompleteCompanyDataModal({
  customerId,
  open,
  onClose,
  onCompleted,
}: Props) {
  const { data: customer, isLoading } = useCustomerDetails(customerId ?? "");
  const updateMutation = useUpdateCustomer();
  const backendErrorHandler = useRef<BackendErrorHandler | null>(null);

  const handleSubmit = (values: CustomerFormValues) => {
    if (!customerId) return;
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) return;
      if (key.endsWith("_file") && typeof value === "string") return;
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      if (typeof value === "object" && !(value instanceof File)) return;
      formData.append(key, String(value));
    });

    updateMutation.mutate(
      { id: customerId, data: formData },
      {
        onSuccess: () => {
          toast.success("تم حفظ بيانات الشركة");
          onCompleted();
        },
        onError: (error: unknown) => {
          const data = (error as { response?: { data?: unknown } })?.response?.data;
          let mapped = false;
          if (data && typeof data === "object" && !("detail" in (data as object))) {
            mapped =
              backendErrorHandler.current?.(data as Record<string, unknown>) ?? false;
          }
          if (!mapped) toast.error(parseBackendError(error) || "فشل حفظ البيانات");
        },
      },
    );
  };

  const hasApiParts =
    customer &&
    (customer.street ||
      customer.building_number ||
      customer.district ||
      customer.secondary_number ||
      customer.postal_code ||
      customer.city);

  const nationalParts = hasApiParts
    ? {
        na_short: "",
        na_governorate: "",
        na_city: customer?.city || "",
        na_street: customer?.street || "",
        na_building: customer?.building_number || "",
        na_district: customer?.district || "",
        na_additional: customer?.secondary_number || "",
        na_postal: customer?.postal_code || "",
      }
    : parseNationalAddressString(
        (customer?.address || customer?.national_address || "") as string,
      ) || emptyNationalAddressParts();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            إكمال بيانات الشركة
          </DialogTitle>
          <DialogDescription>
            هذا العميل شركة. أكمل بيانات الضريبة والعنوان الوطني ثم احفظ لإصدار الأمر.
          </DialogDescription>
        </DialogHeader>

        {isLoading || !customer ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <CustomerForm
            forceCompany
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
              customer_type: "company",
              vat_number: customer.vat_number || "",
              cr_number: customer.cr_number || customer.commercial_registration || "",
              address: "",
              vat_number_file: customer.vat_number_file ?? null,
              cr_file: customer.cr_file ?? null,
              address_file: customer.address_file ?? null,
              na_short: nationalParts.na_short || "",
              na_governorate: nationalParts.na_governorate || "",
              na_city: nationalParts.na_city || "",
              na_street: nationalParts.na_street || "",
              na_building: nationalParts.na_building || "",
              na_district: nationalParts.na_district || "",
              na_additional: nationalParts.na_additional || "",
              na_postal: nationalParts.na_postal || "",
            }}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            buttonText="حفظ ومتابعة إصدار الأمر"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
