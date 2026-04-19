import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Save, Loader2, ArrowLeft, Search, UserPlus, PackagePlus } from "lucide-react";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { CustomerSelectionModal } from "@/components/common/CustomerSelectionModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { Item, Customer } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useCreateSellOrder,
  useUpdateSellOrder,
  useSellOrderDetails,
  sellOrderHasInvoice,
} from "@/hooks/useSellOrders";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { UNIT_LABELS } from "@/types";
import { parseBackendError, preventNegative, clampToPositive, formatPrice } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
// import { normalizeSaudiPhone } from "@/components/form";

// --- Schema ---
const itemSchema = z.object({
  item_id: z.number().default(0),
  name: z.string().min(1, "اسم البند مطلوب"),
  quantity: z.coerce.string().min(1, "الكمية مطلوبة"),
  unit_name: z.string().min(1, "الوحدة مطلوبة"),
  price_after_tax: z.coerce.string().min(1, "السعر مطلوب"),
  dis_percentage: z.coerce.string().default("0"),
  notes: z.string().optional(),
  available_units: z.array(z.object({
    name: z.string(),
    factor: z.string(),
    label: z.string().optional(),
    price: z.string().optional()
  })).optional(),
});

const formSchema = z.object({
  customer_phonenumber: z.string().min(9, "رقم الهاتف مطلوب"),
  clientName: z.string().optional(),
  location: z.string().min(1, "الموقع مطلوب"),
  notes: z.string().optional(),
  dis_percentage: z.string().default("0"),
  sell_order_items: z.array(itemSchema),
});

type FormValues = z.infer<typeof formSchema>;

const customerSchema = z.object({
  phone_number: z.string().min(9, "رقم الهاتف مطلوب"),
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name: z.string().min(2, "اسم العائلة مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  phone_number2: z.string().optional(),
  phone_number3: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export default function CreateSellOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const createMutation = useCreateSellOrder();
  const updateMutation = useUpdateSellOrder();
  // removed checkCustomerMutation
  const createCustomerMutation = useCreateCustomer();
  
  const { data: existingSellOrder, isLoading: isLoadingDetails } = useSellOrderDetails(id!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customer_phonenumber: "",
      clientName: "",
      location: "",
      notes: "",
      dis_percentage: "0",
      sell_order_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sell_order_items",
  });

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phone_number: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number2: "",
      phone_number3: "",
    }
  });

  // --- Effects ---
  useEffect(() => {
    if (!isEditing || !existingSellOrder) return;
    if (id && sellOrderHasInvoice(existingSellOrder)) {
      toast.info("لا يمكن تعديل أمر البيع بعد رفع الفاتورة.");
      navigate(`/sell-orders/${id}`, { replace: true });
      return;
    }
    const customer = existingSellOrder.customer;
    form.reset({
        customer_phonenumber: customer?.phone_number || "",
        clientName: customer
          ? formatCustomerWithBalance(customer)
          : "",
        location: existingSellOrder.location || "",
        notes: existingSellOrder.notes || "",
        dis_percentage: existingSellOrder.dis_percentage || "0",
        sell_order_items: existingSellOrder.sell_order_items.map(item => {
          const available_units = [
            { name: item.item?.default_unit_name, factor: "1", label: UNIT_LABELS[item.item?.default_unit_name as keyof typeof UNIT_LABELS] || item.item?.default_unit_name, price: item.item?.unit_price }
          ];
          if (item.item?.unit2_name) {
            available_units.push({ name: item.item.unit2_name, factor: item.item.unit2_factor || "1", label: UNIT_LABELS[item.item.unit2_name as keyof typeof UNIT_LABELS] || item.item.unit2_name, price: item.item.unit2_price || item.item.unit_price });
          }
          if (item.item?.unit3_name) {
            available_units.push({ name: item.item.unit3_name, factor: item.item.unit3_factor || "1", label: UNIT_LABELS[item.item.unit3_name as keyof typeof UNIT_LABELS] || item.item.unit3_name, price: item.item.unit3_price || item.item.unit_price });
          }

          return {
            item_id: item.item?.id || 0,
            name: item.item?.name || "",
            quantity: item.quantity,
            unit_name: item.unit_name,
            price_after_tax: formatPrice(item.price_after_tax),
            dis_percentage: item.dis_percentage,
            notes: item.notes,
            available_units
          };
        })
    });
    if (customer) {
      setSelectedCustomer(customer);
    }
  }, [isEditing, existingSellOrder, form, id, navigate]);

  // --- Calculations ---
  const currentItems = form.watch("sell_order_items");
  const calculateTotal = (items: FormValues["sell_order_items"] = []) => {
    let beforeDiscount = 0;
    let totalItemsDiscount = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity || "0");
      const price = parseFloat(item.price_after_tax || "0");
      const discountPercent = parseFloat(item.dis_percentage || "0");

      const itemTotal = qty * price;
      const discountAmount = itemTotal * (discountPercent / 100);

      beforeDiscount += itemTotal;
      totalItemsDiscount += discountAmount;
    });

    const totalAfterItemsDiscount = beforeDiscount - totalItemsDiscount;
    const globalDiscountPercent = parseFloat(form.watch("dis_percentage") || "0");
    const globalDiscountAmount = totalAfterItemsDiscount * (globalDiscountPercent / 100);
    const distinctTotal = totalAfterItemsDiscount - globalDiscountAmount;

    return {
      beforeDiscount,
      itemsDiscount: totalItemsDiscount,
      globalDiscount: globalDiscountAmount,
      total: distinctTotal
    };
  };

  // --- Handlers ---
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    form.setValue("clientName", formatCustomerWithBalance(customer));
    form.setValue("customer_phonenumber", customer.phone_number);
  };

  const handleCreateCustomer = (values: CustomerFormValues) => {
    createCustomerMutation.mutate(values, {
      onSuccess: (data) => {
        toast.success("تم إضافة العميل بنجاح");
        setIsCustomerModalOpen(false);
        handleSelectCustomer(data);
        customerForm.reset();
      },
      onError: (error) => {
        toast.error("فشل إضافة العميل", {
          description: parseBackendError(error)
        });
        console.error(error);
      }
    });
  };

  const handleSelectProducts = (selectedItems: Item[]) => {
      selectedItems.forEach(item => {
          const available_units = [
              { 
                name: item.default_unit_name, 
                factor: "1", 
                label: UNIT_LABELS[item.default_unit_name as keyof typeof UNIT_LABELS] || item.default_unit_name,
                price: item.unit_price 
              }
          ];

          if (item.unit2_name) {
              available_units.push({ 
                  name: item.unit2_name, 
                  factor: item.unit2_factor || "1",
                  label: UNIT_LABELS[item.unit2_name as keyof typeof UNIT_LABELS] || item.unit2_name,
                  price: item.unit2_price || item.unit_price
              });
          }

          if (item.unit3_name) {
              available_units.push({ 
                  name: item.unit3_name, 
                  factor: item.unit3_factor || "1",
                  label: UNIT_LABELS[item.unit3_name as keyof typeof UNIT_LABELS] || item.unit3_name,
                  price: item.unit3_price || item.unit_price
              });
          }

          append({
              item_id: item.id,
              name: item.name,
              quantity: "1",
              unit_name: item.default_unit_name,
              price_after_tax: formatPrice(item.unit_price),
              dis_percentage: "0",
              notes: "",
              available_units
          });
      });
  };


  // Form validation - show confirmation
  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = () => {
    if (!pendingFormData) return;
    const values = pendingFormData;
    const payload: any = {
      customer_phonenumber: values.customer_phonenumber,
      location: values.location,
      notes: values.notes,
      dis_percentage: parseFloat(values.dis_percentage || "0").toFixed(2),
      sell_order_items: values.sell_order_items.map((item, index) => ({
        item_id: item.item_id || index + 1,
        quantity: String(item.quantity),
        price_after_tax: String(item.price_after_tax),
        unit_name: item.unit_name,
        notes: item.notes || "",
        dis_percentage: parseFloat(item.dis_percentage || "0").toFixed(2)
      })),
    };

    if (isEditing && id) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success("تم تحديث أمر البيع بنجاح");
            navigate("/sell-orders");
          },
          onError: (error) => {
            toast.error("فشل تحديث أمر البيع", {
              description: parseBackendError(error)
            });
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("تم إنشاء أمر البيع بنجاح");
          navigate("/sell-orders");
        },
        onError: (error: any) => {
          console.error("Create Error:", error.response?.data);
          toast.error("فشل إنشاء أمر البيع", {
            description: parseBackendError(error)
          });
        }
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {isEditing ? "تعديل أمر البيع" : "أمر بيع جديد"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "تعديل بيانات أمر البيع" : "إنشاء أمر بيع جديد"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          <div className="space-y-8">
            {/* Top Section: Customer & Details */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* Customer Section */}
              <Card className="border-border/50 shadow-sm h-full">
                <CardHeader>
                  <CardTitle>بيانات العميل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 items-end">
                    <FormField
                      control={form.control}
                      name="customer_phonenumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                            <Input 
                              placeholder="05xxxxxxxx" 
                              dir="ltr" 
                              {...field} 
                              readOnly
                              className="bg-muted cursor-pointer"
                              onClick={() => setIsCustomerSelectionOpen(true)}
                            />
                            <Button 
                              type="button" 
                              variant="outline"
                              onClick={() => setIsCustomerSelectionOpen(true)}
                              className="px-3"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="clientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العميل</FormLabel>
                        <FormControl>
                          <Input readOnly className="bg-muted" placeholder="سيظهر الاسم هنا عند التحقق" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
                        <FormControl>
                          <Input placeholder="المدينة، الحي..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Details Section */}
              <Card className="border-border/50 shadow-sm h-full">
                <CardHeader>
                  <CardTitle>تفاصيل إضافية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dis_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>خصم إضافي على الإجمالي (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="any"
                            placeholder="0" 
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات عامة</FormLabel>
                        <FormControl>
                          <Textarea className="h-32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Items */}
            <div className="space-y-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Save className="h-5 w-5 text-primary" />
                    بنود أمر البيع
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr className="text-right">
                          <th className="p-3 font-medium text-muted-foreground">البند</th>
                          <th className="p-3 font-medium text-muted-foreground w-[80px]">الكمية</th>
                          <th className="p-3 font-medium text-muted-foreground w-[100px]">الوحدة</th>
                          <th className="p-3 font-medium text-muted-foreground w-[100px]">السعر</th>
                          <th className="p-3 font-medium text-muted-foreground w-[70px]">خصم %</th>
                          <th className="p-3 font-medium text-muted-foreground w-[100px]">الإجمالي</th>
                          <th className="p-3 font-medium text-muted-foreground">ملاحظات</th>
                          <th className="p-3 font-medium text-muted-foreground w-[90px]">التحويل</th>
                          <th className="p-3 w-[40px]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {fields.map((field, index) => {
                          const qty = parseFloat(form.watch(`sell_order_items.${index}.quantity`) || "0");
                          const price = parseFloat(form.watch(`sell_order_items.${index}.price_after_tax`) || "0");
                          const discount = parseFloat(form.watch(`sell_order_items.${index}.dis_percentage`) || "0");
                          const itemTotal = qty * price * (1 - discount / 100);
                          
                          return (
                          <tr key={field.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-2">
                              <Input 
                                placeholder="اسم البند" 
                                className="h-9 text-sm bg-muted text-muted-foreground"
                                readOnly
                                {...form.register(`sell_order_items.${index}.name`)}
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                min="0.01"
                                step="any"
                                className="h-9 text-sm min-w-[80px]"
                                {...form.register(`sell_order_items.${index}.quantity`, {
                                  setValueAs: (v) => clampToPositive(v)
                                })}
                                onKeyDown={preventNegative}
                              />
                            </td>
                            <td className="p-2">
                              {(() => {
                                const currentUnit = form.watch(`sell_order_items.${index}.unit_name`);
                                const units = form.watch(`sell_order_items.${index}.available_units`) || [];
                                const selectedUnitObj = units.find((u: any) => u.name === currentUnit);
                                const hasFactor = selectedUnitObj && parseFloat(selectedUnitObj.factor) > 1;

                                return (
                                  <div className="relative">
                                    <Select 
                                      value={currentUnit} 
                                      onValueChange={(val) => {
                                        form.setValue(`sell_order_items.${index}.unit_name`, val);
                                        // Auto-update price based on selected unit
                                        const selectedUnit = units.find((u: any) => u.name === val);
                                        if (selectedUnit?.price) {
                                          form.setValue(`sell_order_items.${index}.price_after_tax`, formatPrice(selectedUnit.price));
                                        }
                                      }}
                                    >
                                      <SelectTrigger className={`h-9 text-sm ${hasFactor ? 'border-primary/50 bg-primary/5' : ''}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.length > 0 ? (
                                          units.map((u: any) => {
                                            const factorNum = parseFloat(u.factor);
                                            return (
                                            <SelectItem key={u.name} value={u.name}>
                                              <div className="flex items-center justify-between w-full gap-3">
                                                <span>{u.label || u.name}</span>
                                                {factorNum > 1 && (
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                                    ×{factorNum}
                                                  </span>
                                                )}
                                              </div>
                                            </SelectItem>
                                          )})
                                        ) : (
                                          Object.entries(UNIT_LABELS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                    {hasFactor && (
                                      <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-bold shadow-sm">
                                        {parseFloat(selectedUnitObj.factor)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                min="0"
                                step="any"
                                className="h-9 text-sm min-w-[110px]"
                                {...form.register(`sell_order_items.${index}.price_after_tax`, {
                                  setValueAs: (v) => clampToPositive(v)
                                })}
                                onKeyDown={preventNegative}
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                min="0"
                                max="100"
                                step="any"
                                className="h-9 text-sm min-w-[70px]"
                                {...form.register(`sell_order_items.${index}.dis_percentage`, {
                                  setValueAs: (v) => clampToPositive(v)
                                })}
                                onKeyDown={preventNegative}
                              />
                            </td>
                            <td className="p-2">
                              <div className={`h-9 flex items-center justify-center font-medium text-sm rounded-md px-2 min-w-[100px] ${discount > 0 ? 'bg-success-light text-success' : 'bg-muted/50'}`}>
                                {itemTotal.toLocaleString()} ر.س
                              </div>
                            </td>
                            <td className="p-2">
                              <Input 
                                placeholder="ملاحظات" 
                                className="h-9 text-sm"
                                {...form.register(`sell_order_items.${index}.notes`)}
                              />
                            </td>
                            <td className="p-2">
                              {(() => {
                                const currentUnit = form.watch(`sell_order_items.${index}.unit_name`);
                                const units = form.watch(`sell_order_items.${index}.available_units`) || [];
                                const selectedUnitObj = units.find((u: any) => u.name === currentUnit);
                                const defaultUnit = units[0]; // First unit is always the default
                                const factor = parseFloat(selectedUnitObj?.factor || "1");
                                
                                if (factor > 1 && defaultUnit) {
                                  return (
                                    <div className="text-xs text-muted-foreground text-center bg-muted/30 rounded-md px-2 py-1">
                                      = {factor} {UNIT_LABELS[defaultUnit.name as keyof typeof UNIT_LABELS] || defaultUnit.name}
                                    </div>
                                  );
                                }
                                return <span className="text-muted-foreground/50 text-center block">-</span>;
                              })()}
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="p-4 border-t flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed max-w-md"
                      onClick={() => setIsProductModalOpen(true)}
                    >
                      <PackagePlus className="mr-2 h-4 w-4" />
                      اختيار منتجات من القائمة
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 border-t flex justify-between items-center px-6 py-4">
                  <div className="flex flex-col items-end gap-1 w-full">
                    <div className="flex justify-between w-full text-sm text-muted-foreground">
                      <span>الإجمالي قبل الخصم:</span>
                      <span>{calculateTotal(currentItems).beforeDiscount.toLocaleString()} ر.س</span>
                    </div>
                    {calculateTotal(currentItems).itemsDiscount > 0 && (
                      <div className="flex justify-between w-full text-sm text-success">
                        <span>خصم البنود:</span>
                        <span>- {calculateTotal(currentItems).itemsDiscount.toLocaleString()} ر.س</span>
                      </div>
                    )}
                    {calculateTotal(currentItems).globalDiscount > 0 && (
                      <div className="flex justify-between w-full text-sm text-info">
                        <span>خصم كلي ({form.watch('dis_percentage')}%) :</span>
                        <span>- {calculateTotal(currentItems).globalDiscount.toLocaleString()} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full font-bold text-xl text-primary border-t pt-2 mt-2">
                      <span>الإجمالي النهائي شامل الضريبة:</span>
                      <span>{calculateTotal(currentItems).total.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </CardFooter>
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
              {isEditing ? "حفظ التعديلات" : "إنشاء أمر البيع"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Create Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              إضافة عميل جديد
            </DialogTitle>
            <DialogDescription>
              العميل غير موجود في النظام. يرجى إضافة بياناته للمتابعة.
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
            <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-4">
              <FormField
                control={customerForm.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <Input dir="ltr" placeholder="05xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={customerForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الأول</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={customerForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم العائلة</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={customerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>البريد الإلكتروني (اختياري)</FormLabel>
                    <FormControl>
                      <Input type="email" dir="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createCustomerMutation.isPending}>
                  {createCustomerMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إضافة العميل
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ProductSelectionModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleSelectProducts}
        filterSellable={true}
      />
      <CustomerSelectionModal
        isOpen={isCustomerSelectionOpen}
        onClose={() => setIsCustomerSelectionOpen(false)}
        onSelect={handleSelectCustomer}
        selectedId={selectedCustomer?.id}
        onAddNew={() => setIsCustomerModalOpen(true)}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإنشاء"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات على أمر البيع؟" : "هل أنت متأكد من إنشاء أمر البيع هذا؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إنشاء أمر البيع"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
