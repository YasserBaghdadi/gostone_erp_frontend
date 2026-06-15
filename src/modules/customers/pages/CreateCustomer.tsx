import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCreateCustomer } from "@/hooks/useCustomers";
import CustomerForm, { type CustomerFormValues } from "../components/CustomerForm";
import { parseBackendError } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

type BackendErrorHandler = (errors: Record<string, unknown>) => boolean;

export default function CreateCustomer() {
  const navigate = useNavigate();
  const createMutation = useCreateCustomer();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CustomerFormValues | null>(null);
  // دالة ربط أخطاء الباك اند بحقول النموذج (يُسجّلها CustomerForm).
  const backendErrorHandler = useRef<BackendErrorHandler | null>(null);

  const handleFormSubmit = (values: CustomerFormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!pendingFormData) return;
    
    const formData = new FormData();
    
    Object.entries(pendingFormData).forEach(([key, value]) => {
      // Skip empty strings, null, undefined
      if (value === "" || value === null || value === undefined) return;
      
      // If it's a File object (and strictly a File), append it
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      
      // For non-file objects (like empty {} for file inputs if any remains), skip
      if (typeof value === 'object' && !(value instanceof File)) return;

      // Append other values as strings
      formData.append(key, String(value));
    });

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("تم إضافة العميل بنجاح");
        navigate("/customers");
      },
      onError: (error: unknown) => {
        // نحاول عرض أخطاء الحقول (مثل حقول الشركة) على الإدخالات المناسبة.
        const data = (error as { response?: { data?: unknown } })?.response?.data;
        let mappedToFields = false;
        if (data && typeof data === "object" && !("detail" in (data as object))) {
          mappedToFields =
            backendErrorHandler.current?.(data as Record<string, unknown>) ?? false;
        }
        if (!mappedToFields) {
          const errorMessage = parseBackendError(error);
          toast.error(errorMessage || "فشل إضافة العميل");
        }
        console.error(error);
      },
    });
    
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إضافة عميل جديد
          </h1>
          <p className="text-muted-foreground mt-1">
            تسجيل بيانات عميل جديد في النظام
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            بيانات العميل
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            onSubmit={handleFormSubmit}
            isLoading={createMutation.isPending}
            buttonText="إضافة العميل"
            registerBackendErrorHandler={(handler) => {
              backendErrorHandler.current = handler;
            }}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="تأكيد الإضافة"
        description="هل أنت متأكد من إضافة هذا العميل؟"
        confirmText="إضافة العميل"
        variant="success"
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

