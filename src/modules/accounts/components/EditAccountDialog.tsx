import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUpdateAccount } from "@/hooks/useAccounts";
import type { Account } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  note: z.string().optional(),
});

interface EditAccountDialogProps {
  account: Account | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: EditAccountDialogProps) {
  const { mutate: updateAccount, isPending } = useUpdateAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", note: "" },
  });

  // Prefill with the account's current values whenever it changes / dialog opens.
  useEffect(() => {
    if (account && open) {
      form.reset({ name: account.name || "", note: account.note || "" });
    }
  }, [account, open, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!account) return;
    updateAccount(
      { id: account.id, data: { name: values.name, note: values.note } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الحساب</DialogTitle>
          <DialogDescription>
            رقم الحساب والحساب الرئيسي غير قابلين للتعديل.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Number (read-only — plain markup, NOT FormItem/FormLabel which
                require a surrounding FormField context). */}
            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الحساب</label>
              <Input value={account?.number || ""} disabled readOnly />
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الحساب</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: الصندوق" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="ملاحظات إضافية..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
