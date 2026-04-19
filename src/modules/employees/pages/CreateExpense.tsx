import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Save, Loader2, Wallet, Coins, Building2, ArrowLeftRight, Paperclip, CheckCircle2, Tag, ShoppingCart, X, Phone } from "lucide-react";
import { FileUploader } from "@/components/ui/file-uploader";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDisbursementTypes, useCreateDisbursement } from "@/hooks/useDisbursements";
import { SellOrderSelectionModal } from "@/components/common/SellOrderSelectionModal";
import type { SellOrder } from "@/types";
import { toast } from "sonner";
import { preventNegative, clampToPositive, parseBackendError } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

const toNumber = (val: unknown) => {
  if (val === "" || val === undefined || val === null) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

const disbursementSchema = z.object({
  source: z.enum(["custody", "transfer", "both"]),
  custody_amount: z.preprocess(toNumber, z.number().min(0, "مبلغ العهدة غير صالح")),
  transfer_amount: z.preprocess(toNumber, z.number().min(0, "مبلغ التحويل غير صالح")),
  type_id: z.preprocess(toNumber, z.number().min(1, "يرجى اختيار نوع الصرف")),
  sell_order_id: z.string().optional(),
  notes: z.string().optional(),
  file: z.any().optional(),
}).refine((data) => {
  if (data.source === "custody" && data.custody_amount <= 0) return false;
  if (data.source === "transfer" && data.transfer_amount <= 0) return false;
  if (data.source === "both" && (data.custody_amount <= 0 || data.transfer_amount <= 0)) return false;
  return true;
}, {
  message: "يرجى إدخال المبلغ المطلوب",
  path: ["custody_amount"],
});

type DisbursementFormValues = z.infer<typeof disbursementSchema>;

export default function CreateExpense() {
  const navigate = useNavigate();
  const { data: disbursementTypes, isLoading: isLoadingTypes } = useDisbursementTypes();
  const createMutation = useCreateDisbursement();
  

  // Sell Order Modal state
  const [isSellOrderModalOpen, setIsSellOrderModalOpen] = useState(false);
  const [selectedSellOrder, setSelectedSellOrder] = useState<SellOrder | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<DisbursementFormValues | null>(null);

  const form = useForm<DisbursementFormValues>({
    resolver: zodResolver(disbursementSchema) as any,
    defaultValues: {
      source: "custody",
      custody_amount: 0,
      transfer_amount: 0,
      type_id: 0,
      sell_order_id: "",
      notes: "",
      file: "", // Initialize as empty string or undefined as per schema
    },
  });

  const source = form.watch("source");

  // Show confirmation before submit
  const handleFormSubmit = (data: DisbursementFormValues) => {
    setPendingFormData(data);
    setIsConfirmOpen(true);
  };

  const onSubmit = async () => {
    if (!pendingFormData) return;
    const data = pendingFormData;
    try {
      // Build FormData
      const formData = new FormData();
      
      // Handle source amounts
      if (data.source === "custody") {
          formData.append("custody_amount", data.custody_amount.toString());
          formData.append("transfer_amount", "0");
      } else if (data.source === "transfer") {
          formData.append("custody_amount", "0");
          formData.append("transfer_amount", data.transfer_amount.toString());
      } else {
          formData.append("custody_amount", data.custody_amount.toString());
          formData.append("transfer_amount", data.transfer_amount.toString());
      }

      formData.append("type_id", data.type_id.toString());
      if (data.sell_order_id) {
          formData.append("sell_order_id", data.sell_order_id);
      }
      if (data.notes) {
          formData.append("notes", data.notes);
      }

      // Handle File
      // The FileUploader controls the 'file' field in react-hook-form.
      // It returns a File object (or null).
      const filePayload = data.file;
      if (filePayload instanceof File) {
          formData.append("file", filePayload);
      }

      await createMutation.mutateAsync(formData);
      
      toast.success("تم إنشاء طلب الصرف بنجاح");
      navigate("/employee-expenses");
    } catch (error) {
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage || "فشل إنشاء طلب الصرف");
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  const handleClearSellOrder = () => {
    setSelectedSellOrder(null);
    form.setValue("sell_order_id", "", { shouldDirty: true });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-primary/10 via-background to-background p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div className="space-y-1">
           <div className="flex items-center gap-3">
             <div className="bg-primary/10 p-2.5 rounded-xl">
               <ReceiptIcon className="w-6 h-6 text-primary" />
             </div>
             <h2 className="text-2xl font-bold tracking-tight text-foreground">
               تسجيل طلب صرف جديد
             </h2>
           </div>
           <p className="text-muted-foreground mr-14">
             إدخال بيانات طلب صرف جديد
           </p>
        </div>
        
        <Link to="/employee-expenses">
            <Button variant="outline" className="gap-2 rounded-xl group border-primary/20 hover:border-primary hover:bg-primary/5">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                العودة للقائمة
            </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <div className="grid gap-8">
                {/* Main Form Card */}
                <Card className="shadow-xl border-none ring-1 ring-border/40 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
                    <CardContent className="p-8 space-y-8">
                        
                        {/* Source Selection - Visual Cards (FIRST) */}
                        <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                            <FormItem className="space-y-4">
                                <Label className="text-lg font-semibold flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-primary" />
                                    مصدر الصرف
                                </Label>
                                <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    value={field.value}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                    dir="rtl"
                                >
                                    {[
                                        { value: "custody", label: "من العهدة", desc: "صرف نقدي مباشر", icon: Coins },
                                        { value: "transfer", label: "تحويل بنكي", desc: "لحساب المستفيد", icon: Building2 },
                                        { value: "both", label: "مختلط", desc: "عهدة + تحويل", icon: ArrowLeftRight },
                                    ].map((option) => (
                                        <FormItem key={option.value} className="space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value={option.value} id={`source-${option.value}`} className="sr-only peer" />
                                            </FormControl>
                                            <label htmlFor={`source-${option.value}`} className="cursor-pointer block">
                                                <div className={`
                                                    relative flex flex-col items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 h-full
                                                    ${field.value === option.value 
                                                        ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                                        : "border-muted bg-card hover:border-primary/50 hover:bg-muted/30"}
                                                `}>
                                                    {field.value === option.value && (
                                                        <div className="absolute top-3 right-3 text-primary">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <div className={`p-3 rounded-full ${field.value === option.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                                        <option.icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="font-bold text-base">{option.label}</p>
                                                        <p className="text-xs text-muted-foreground">{option.desc}</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        {/* Type Selection (SECOND) */}
                        <FormField
                            control={form.control}
                            name="type_id"
                            render={({ field }) => (
                            <FormItem className="space-y-4">
                                <Label className="text-lg font-semibold flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-primary" />
                                    نوع الصرف
                                </Label>
                                <FormControl>
                                  <Select 
                                    onValueChange={(val) => field.onChange(parseInt(val))}
                                    value={field.value ? field.value.toString() : undefined}
                                    disabled={isLoadingTypes}
                                  >
                                    <SelectTrigger className="w-full h-12 text-base">
                                      <SelectValue placeholder={isLoadingTypes ? "جاري التحميل..." : "اختر نوع الصرف"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {disbursementTypes?.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                          {type.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        {/* Sell Order Selection (THIRD) */}
                        <FormField
                          control={form.control}
                          name="sell_order_id"
                          render={() => (
                            <FormItem className="space-y-4">
                              <Label className="text-lg font-semibold flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                أمر البيع (اختياري)
                              </Label>
                              {selectedSellOrder ? (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="bg-primary/10 p-2 rounded-lg">
                                        <ShoppingCart className="w-5 h-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-foreground">
                                          أمر بيع #{selectedSellOrder.id}
                                        </p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                          <Phone className="h-3 w-3" />
                                          {selectedSellOrder.customer
                                            ? formatCustomerWithBalance(
                                                selectedSellOrder.customer,
                                              )
                                            : "—"}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                      onClick={handleClearSellOrder}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                      {parseFloat(selectedSellOrder.total_price_after_tax).toLocaleString()} ر.س
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full h-12 justify-start gap-3 text-muted-foreground hover:text-foreground border-dashed"
                                  onClick={() => setIsSellOrderModalOpen(true)}
                                >
                                  <ShoppingCart className="h-5 w-5" />
                                  اختر أمر بيع مرتبط (اختياري)
                                </Button>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Amount Inputs - Conditional based on source */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Custody Amount - show for custody or both */}
                            {(source === "custody" || source === "both") && (
                              <FormField
                                  control={form.control}
                                  name="custody_amount"
                                  render={({ field }) => (
                                  <FormItem className="animate-in slide-in-from-right-4 duration-300">
                                      <Label className="text-base font-semibold flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-info" />
                                        {source === "custody" ? "المبلغ" : "مبلغ العهدة"}
                                      </Label>
                                      <div className="relative">
                                          <FormControl>
                                              <Input 
                                                  type="number" 
                                                  min="0"
                                                  step="0.01" 
                                                  className="text-left pl-12 h-12 text-lg font-medium shadow-sm focus-visible:ring-primary/30 transition-shadow" 
                                                  dir="ltr" 
                                                  placeholder="0.00"
                                                  {...field} 
                                                  onKeyDown={preventNegative}
                                                  onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                                              />
                                          </FormControl>
                                          <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-muted/50 px-2 py-1 rounded text-xs font-bold text-muted-foreground pointer-events-none">
                                              ر.س
                                          </div>
                                      </div>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                            )}

                            {/* Transfer Amount - show for transfer or both */}
                            {(source === "transfer" || source === "both") && (
                              <FormField
                                  control={form.control}
                                  name="transfer_amount"
                                  render={({ field }) => (
                                  <FormItem className="animate-in slide-in-from-left-4 duration-300">
                                      <Label className="text-base font-semibold flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-success" />
                                        {source === "transfer" ? "المبلغ" : "مبلغ التحويل"}
                                      </Label>
                                      <div className="relative">
                                          <FormControl>
                                              <Input 
                                                  type="number" 
                                                  min="0"
                                                  step="0.01" 
                                                  className="text-left pl-12 h-12 text-lg font-medium shadow-sm focus-visible:ring-primary/30 transition-shadow" 
                                                  dir="ltr" 
                                                  placeholder="0.00"
                                                  {...field} 
                                                  onKeyDown={preventNegative}
                                                  onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                                              />
                                          </FormControl>
                                          <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-muted/50 px-2 py-1 rounded text-xs font-bold text-muted-foreground pointer-events-none">
                                              ر.س
                                          </div>
                                      </div>
                                      <FormMessage />
                                  </FormItem>
                                  )}
                              />
                            )}
                        </div>

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                            <FormItem>
                                <Label className="text-base font-semibold">الملاحظات</Label>
                                <FormControl>
                                <Textarea 
                                    placeholder="أدخل أي ملاحظات إضافية..." 
                                    className="min-h-[100px] resize-none shadow-sm focus-visible:ring-primary/30 transition-shadow text-base"
                                    {...field} 
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Attachment Section */}
                <Card className="shadow-lg border-none ring-1 ring-border/40">
                    <CardHeader className="bg-muted/10 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-primary" />
                            المرفقات والمستندات
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <FileUploader
                          control={form.control}
                          name="file"
                          label="إرفاق المستند (اختياري)"
                          description="اضغط للرفع أو اسحب الملفات (PDF, PNG, JPG)"
                          accept={{
                            "image/*": [],
                            "application/pdf": [".pdf"]
                          }}
                        />
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center justify-end gap-4 pt-6">
                <Link to="/employee-expenses">
                  <Button type="button" variant="outline" size="lg" className="min-w-[120px] rounded-xl">إلغاء</Button>
                </Link>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="min-w-[160px] rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      إرسال الطلب
                    </>
                  )}
                </Button>
            </div>
        </form>
      </Form>

      {/* Sell Order Selection Modal */}
      <SellOrderSelectionModal
        isOpen={isSellOrderModalOpen}
        onClose={() => setIsSellOrderModalOpen(false)}
        selectedId={selectedSellOrder?.id}
        onSelect={(order) => {
          setSelectedSellOrder(order);
          form.setValue("sell_order_id", order ? order.id.toString() : "", { shouldDirty: true });
        }}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title="تأكيد إرسال الطلب"
        description="هل أنت متأكد من إرسال طلب الصرف هذا؟"
        confirmText="إرسال الطلب"
        variant="success"
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

function ReceiptIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17V7" />
      </svg>
    )
  }
