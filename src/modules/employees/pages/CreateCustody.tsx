import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, ArrowLeft, Banknote } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useCreateCustody, useUpdateCustody, useCustodyDetails } from "@/hooks/useCustody";
import { useUser } from "@/hooks/useAuth";
import { parseBackendError, getDirtyValues, preventNegative, clampToPositive } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

const formSchema = z.object({
  amount: z.string().min(1, "المبلغ مطلوب"),
  explanation: z.string().min(1, "التوضيح مطلوب"),
  needed_by: z.string().min(1, "تاريخ الحاجة مطلوب"),
  is_cash: z.boolean().default(false),
  is_bank: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCustody() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const createMutation = useCreateCustody();
  const updateMutation = useUpdateCustody();
  const { data: existingRequest, isLoading: isLoadingDetails } = useCustodyDetails(id!);
  const { data: currentUser } = useUser();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: "",
      explanation: "",
      needed_by: "",
      is_cash: false,
      is_bank: false,
    },
  });

  useEffect(() => {
    if (isEditing && existingRequest) {
      form.reset({
        amount: existingRequest.amount,
        explanation: existingRequest.explanation || "",
        needed_by: existingRequest.needed_by?.split("T")[0] || "",
        is_cash: existingRequest.is_cash,
        is_bank: existingRequest.is_bank,
      });
    }
  }, [isEditing, existingRequest, form]);




  // --- Auto-Save Draft (New Requests Only) ---
  useEffect(() => {
    if (!isEditing) {
      const draft = localStorage.getItem("custody-new-draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.amount || parsed.explanation) {
             form.reset({ ...form.getValues(), ...parsed });
             toast.info("تم استعادة مسودة سابقة غير محفوظة");
          }
        } catch {
          // مسودة تالفة أو JSON غير صالح — نتجاهل
        }
      }

      const subscription = form.watch((value) => {
         localStorage.setItem("custody-new-draft", JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [isEditing, form]);

  // Show confirmation before submit
  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = () => {
    if (!pendingFormData) return;
    const values = pendingFormData;
    if (!currentUser?.id) {
      toast.error("تعذر تحديد المستخدم الحالي");
      return;
    }

    if (isEditing && id) {
      const dirty = getDirtyValues(form.formState.dirtyFields, values);
      
      if (Object.keys(dirty).length === 0) {
        toast.info("لا توجد تعديلات للحفظ");
        return;
      }

      const payload: any = { ...dirty };

      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success("تم تحديث الطلب بنجاح");
            navigate("/custody");
          },
          onError: (error: any) => {
            toast.error("فشل تحديث الطلب", {
               description: parseBackendError(error)
            });
          },
        }
      );
    } else {
       const payload = {
        ...values,
        custodian: currentUser.id,
        amount: values.amount,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("تم إنشاء الطلب بنجاح");
          localStorage.removeItem("custody-new-draft");
          navigate("/custody");
        },
        onError: (error: any) => {
          toast.error("فشل إنشاء الطلب", {
            description: parseBackendError(error)
          });
        },
      });
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isEditing ? "تعديل طلب العهد" : "طلب عهد جديد"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "تعديل بيانات طلب العهد" : "إنشاء طلب عهد مالية جديد"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Info */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  بيانات الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المبلغ (ر.س)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00" 
                          {...field} 
                          onKeyDown={preventNegative}
                          onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needed_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاريخ الحاجة</FormLabel>
                      <FormControl>
                        <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />



                <FormField
                  control={form.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>التوضيح / السبب</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اشرح سبب طلب العهد..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payment Options */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>خيارات الدفع</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="is_cash"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="mt-0! cursor-pointer">نقدي</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_bank"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="mt-0! cursor-pointer">تحويل بنكي</FormLabel>
                    </FormItem>
                  )}
                />


              </CardContent>
            </Card>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            )}
            <Save className="ml-2 h-5 w-5" />
            {isEditing ? "حفظ التعديلات" : "إرسال الطلب"}
          </Button>
        </form>
      </Form>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد إرسال الطلب"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات؟" : "هل أنت متأكد من إرسال طلب العهد؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إرسال الطلب"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
