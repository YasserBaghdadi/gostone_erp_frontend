import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { useCreateStorageArea, useUpdateStorageArea } from "@/hooks/useStorageAreas";
import type { StorageArea } from "@/types";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "اسم المخزن مطلوب"),
});

type FormValues = z.infer<typeof formSchema>;

interface StorageAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storageArea?: StorageArea | null; // If present, we are editing
}

export function StorageAreaDialog({ open, onOpenChange, storageArea }: StorageAreaDialogProps) {
  const isEditing = !!storageArea;
  const createMutation = useCreateStorageArea();
  const updateMutation = useUpdateStorageArea();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: storageArea?.name || "",
      });
    }
  }, [open, storageArea, form]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && storageArea) {
      updateMutation.mutate(
        { id: storageArea.id, data: values },
        {
          onSuccess: () => {
            toast.success("تم تحديث المخزن بنجاح");
            onOpenChange(false);
          },
          onError: (error) => {
             toast.error(parseBackendError(error) || "فشل تحديث المخزن");
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("تم إضافة المخزن بنجاح");
          onOpenChange(false);
        },
        onError: (error) => {
            toast.error(parseBackendError(error) || "فشل إضافة المخزن");
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل المخزن" : "إضافة مخزن جديد"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "تعديل بيانات المخزن الحالي" : "أدخل بيانات المخزن الجديد"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المخزن</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: المخزن الرئيسي" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {isEditing ? "حفظ التعديلات" : "إضافة المخزن"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
