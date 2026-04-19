import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, User, Phone, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useCreateSupplier } from "@/hooks/useSuppliers";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import type { Supplier } from "@/types";

const quickSupplierSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name: z.string().optional(),
  contact_name: z.string().min(2, "جهة الاتصال مطلوبة"),
  phone_number: z.string().min(9, "رقم الهاتف مطلوب"),
});

type FormValues = z.infer<typeof quickSupplierSchema>;

interface QuickCreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: Supplier) => void;
}

export function QuickCreateSupplierModal({ isOpen, onClose, onSelect }: QuickCreateSupplierModalProps) {
  const createMutation = useCreateSupplier();

  const form = useForm<FormValues>({
    resolver: zodResolver(quickSupplierSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      contact_name: "",
      phone_number: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    // Basic payload for quick create
    const payload = {
      ...values,
      // Default empty values for required fields not in quick form
      email: "",
      vat_number: "",
      tax_number: "",
      cr_number: "",
      street: "",
      building_number: "",
      district: "",
      secondary_number: "",
      postal_code: "",
      city: "",
      address_file: null,
      national_address: "",
      national_address_file: null,
      commercial_registration: "",
      commercial_registration_file: null,
      tax_file: null,
      notes: ""
    };

    createMutation.mutate(payload, {
      onSuccess: (data: any) => {
        // Data might be the supplier object directly or wrapped
        // Adjust based on your API response structure, assuming it returns the created object
        const newSupplier = data as Supplier; 
        toast.success("تم إنشاء المورد بنجاح");
        onSelect(newSupplier);
        onClose();
        form.reset();
      },
      onError: (error: any) => {
        toast.error("فشل إنشاء المورد", {
            description: parseBackendError(error)
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مورد جديد سريع</DialogTitle>
          <DialogDescription>
            أدخل البيانات الأساسية للمورد. يمكنك إضافة المزيد من التفاصيل لاحقاً من صفحة الموردين.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>الاسم الأول <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="مثال: شركة" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>اسم العائلة / الشركة</FormLabel>
                    <FormControl>
                        <Input placeholder="مثال: المتحدة" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="contact_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>جهة الاتصال <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                        <User className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pr-9" placeholder="اسم المسؤول..." {...field} />
                    </div>
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
                  <FormLabel>رقم الهاتف <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                        <Phone className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pr-9" placeholder="05xxxxxxxx" {...field} dir="ltr" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Save className="h-4 w-4 ml-2" />
                )}
                حفظ واختيار
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
