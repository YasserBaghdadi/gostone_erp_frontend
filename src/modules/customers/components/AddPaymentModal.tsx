import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddCustomerPayment } from "@/hooks/useCustomers";
import { 
  useCashRegisters, 
  useCardMachines, 
  useBanks, 
  useBuyNowPayLaters 
} from "@/hooks/usePaymentMethods";
import { Loader2} from "lucide-react";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import { FileUploader } from "@/components/ui/file-uploader";

// Schema Configuration
const paymentSchema = z.object({
  // Cash
  cash_amount: z.string().default(""),
  cash_register: z.string().optional(),

  // Card
  card_amount: z.string().default(""),
  card_machine: z.string().optional(),
  card_amount_file: z.any().optional(),

  // Transfer
  transfer_amount: z.string().default(""),
  bank: z.string().optional(),
  transfer_amount_file: z.any().optional(),



  // BNPL
  buy_now_pay_later_amount: z.string().default(""),
  buy_now_pay_later: z.string().optional(),
  buy_now_pay_later_file: z.any().optional(),
}).superRefine((data, ctx) => {
  // Cash Validation
  if (Number(data.cash_amount) > 0 && !data.cash_register) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب اختيار الصندوق",
      path: ["cash_register"],
    });
  }

  // Card Validation
  if (Number(data.card_amount) > 0) {
    if (!data.card_machine) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار جهاز الشبكة",
        path: ["card_machine"],
      });
    }
  }

  // Transfer Validation
  if (Number(data.transfer_amount) > 0) {
    if (!data.bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار البنك",
        path: ["bank"],
      });
    }
  }

  // Tabby Validation (No logic needed if file is optional)

  // BNPL Validation
  if (Number(data.buy_now_pay_later_amount) > 0) {
    if (!data.buy_now_pay_later) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "يجب اختيار مزود الخدمة",
        path: ["buy_now_pay_later"],
      });
    }
  }

  // At least one amount > 0
  const total = 
    Number(data.cash_amount) + 
    Number(data.card_amount) + 
    Number(data.transfer_amount) + 
    Number(data.buy_now_pay_later_amount);
  
  if (total <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب إدخال مبلغ واحد على الأقل",
      path: ["cash_amount"], // Focus error somewhere generally
    });
  }
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface AddPaymentModalProps {
  customerId: number;
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
}

export function AddPaymentModal({ customerId, isOpen, onClose, customerName }: AddPaymentModalProps) {
  const { mutate: addPayment, isPending } = useAddCustomerPayment();
  
  // Data Fetching
  const { data: cashRegisters } = useCashRegisters();
  const { data: cardMachines } = useCardMachines();
  const { data: banks } = useBanks();
  const { data: bnplProviders } = useBuyNowPayLaters();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as any,
    defaultValues: {
      cash_amount: "",
      cash_register: undefined,
      card_amount: "",
      card_machine: undefined,
      transfer_amount: "",
      bank: undefined,

      buy_now_pay_later_amount: "",
      buy_now_pay_later: undefined,
    },
  });

  const onSubmit = (data: PaymentFormValues) => {
    const formData = new FormData();
    
    // Cash
    if(Number(data.cash_amount) > 0) {
        formData.append("cash_amount", data.cash_amount);
        if (data.cash_register) formData.append("cash_register", data.cash_register); 
    }

    // Card
    if(Number(data.card_amount) > 0) {
        formData.append("card_amount", data.card_amount);
        if (data.card_machine) formData.append("card_machine", data.card_machine);
        // Explicitly check for File object
        if (data.card_amount_file instanceof File) {
            formData.append("card_amount_file", data.card_amount_file);
        }
    }

    // Transfer
    if(Number(data.transfer_amount) > 0) {
        formData.append("transfer_amount", data.transfer_amount);
        if (data.bank) formData.append("bank", data.bank);
        if (data.transfer_amount_file instanceof File) {
            formData.append("transfer_amount_file", data.transfer_amount_file);
        }
    }



    // BNPL
    if(Number(data.buy_now_pay_later_amount) > 0) {
        formData.append("buy_now_pay_later_amount", data.buy_now_pay_later_amount);
        if (data.buy_now_pay_later) formData.append("buy_now_pay_later", data.buy_now_pay_later);
        if (data.buy_now_pay_later_file instanceof File) {
            formData.append("buy_now_pay_later_file", data.buy_now_pay_later_file);
        }
    }

    addPayment(
      { id: customerId, data: formData },
      {
        onSuccess: () => {
          toast.success("تم إضافة الدفعة بنجاح");
          form.reset();
          onClose();
        },
        onError: (error) => {
            const errorMessage = parseBackendError(error);
            toast.error(errorMessage || "فشل إضافة الدفعة");
            console.error(error);
        }
      }
    );
  };

  const watchCash = form.watch("cash_amount");
  const watchCard = form.watch("card_amount");
  const watchTransfer = form.watch("transfer_amount");

  const watchBNPL = form.watch("buy_now_pay_later_amount");




// Inside the component
  const acceptTypes = {
    "image/*": [],
    "application/pdf": [".pdf"]
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة دفعة للعميل: {customerName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Cash Section */}
            <div className="space-y-3 p-4 border rounded-xl bg-muted/5">
                <h3 className="font-semibold text-sm">نقدي (كاش)</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cash_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">المبلغ</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {Number(watchCash) > 0 && (
                        <FormField
                        control={form.control}
                        name="cash_register"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">الصندوق *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="اختر الصندوق" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {cashRegisters?.results.map((reg) => (
                                        <SelectItem key={reg.id} value={reg.id.toString()}>{reg.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
            </div>

            {/* Card Section */}
            <div className="space-y-3 p-4 border rounded-xl bg-muted/5">
                <h3 className="font-semibold text-sm">شبكة (Cards)</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="card_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">المبلغ</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {Number(watchCard) > 0 && (
                        <FormField
                        control={form.control}
                        name="card_machine"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">جهاز الشبكة *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="اختر الجهاز" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {cardMachines?.results.map((mach) => (
                                        <SelectItem key={mach.id} value={mach.id.toString()}>{mach.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
                {Number(watchCard) > 0 && (
                    <FileUploader
                        control={form.control}
                        name="card_amount_file"
                        label="إرفاق إيصال الدفع"
                        accept={acceptTypes}
                    />
                )}
            </div>

            {/* Transfer Section */}
            <div className="space-y-3 p-4 border rounded-xl bg-muted/5">
                <h3 className="font-semibold text-sm">حوالة بنكية</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="transfer_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">المبلغ</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {Number(watchTransfer) > 0 && (
                        <FormField
                        control={form.control}
                        name="bank"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">البنك *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="اختر البنك" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {banks?.results.map((bank) => (
                                        <SelectItem key={bank.id} value={bank.id.toString()}>{bank.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
                {Number(watchTransfer) > 0 && (
                     <FileUploader
                        control={form.control}
                        name="transfer_amount_file"
                        label="إرفاق إيصال التحويل"
                        accept={acceptTypes}
                    />
                )}
            </div>



             {/* BNPL Section */}
             <div className="space-y-3 p-4 border rounded-xl bg-info-light">
                <h3 className="font-semibold text-sm text-info-dark">اشتري الآن وادفع لاحقاً</h3>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="buy_now_pay_later_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">المبلغ</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min={0} {...field} className="h-9" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {Number(watchBNPL) > 0 && (
                        <FormField
                        control={form.control}
                        name="buy_now_pay_later"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-xs">مزود الخدمة *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="اختر المزود" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {bnplProviders?.results.map((prov) => (
                                        <SelectItem key={prov.id} value={prov.id.toString()}>{prov.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    )}
                </div>
                {Number(watchBNPL) > 0 && (
                     <FileUploader
                        control={form.control}
                        name="buy_now_pay_later_file"
                        label="إرفاق الإيصال"
                        accept={acceptTypes}
                    />
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2 px-8">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                إضافة الدفعة
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
