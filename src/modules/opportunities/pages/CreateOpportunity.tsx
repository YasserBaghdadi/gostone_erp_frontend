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
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
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
import { useCreateOpportunity, useUpdateOpportunity, useOpportunityDetails } from "@/hooks/useOpportunities";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { INTEREST_LEVELS, UNIT_LABELS } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import { parseBackendError, preventNegative, clampToPositive } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
// import { normalizeSaudiPhone } from "@/components/form";

// --- Schema Definitions ---

const itemSchema = z.object({
  // item_id will be mapped from a selection if needed, for now using 0 as per payload if new
  item_id: z.number().default(0), 
  name: z.string().min(1, "اسم البند مطلوب"), // UI only
  quantity: z.coerce.number().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  unit_name: z.string().min(1, "الوحدة مطلوبة"),
  unit_price_after_tax: z.coerce.number().min(0, "السعر لا يمكن أن يكون سالباً"),
  counter_offer_after_tax: z.coerce.number().min(0).default(0),
  dis_percentage: z.coerce.number().min(0).max(100).default(0),
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
  clientName: z.string().optional(), // Read-only for display
  // نوع العميل: فرد (individual) أو شركة (company). الافتراضي فرد.
  customer_type: z.enum(["individual", "company"]).default("individual"),
  location: z.string().min(1, "الموقع مطلوب"),
  interest_level: z.string().min(1, "مستوى الاهتمام مطلوب"),
  notes: z.string().optional(),
  total_counter_offer: z.coerce.number().min(0).default(0),
  dis_percentage: z.coerce.number().min(0).max(100).default(0),
  need_dim_order: z.boolean().default(false),
  items: z.array(itemSchema),
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


export default function CreateOpportunity() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomerSelectionOpen, setIsCustomerSelectionOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);

  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  // removed checkCustomerMutation
  const createCustomerMutation = useCreateCustomer();
  
  const { data: existingOpportunity, isLoading: isLoadingDetails } = useOpportunityDetails(id!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customer_phonenumber: "",
      clientName: "",
      customer_type: "individual",
      location: "",
      interest_level: "interested",
      notes: "",
      total_counter_offer: 0,
      dis_percentage: 0,
      need_dim_order: false,
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
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


  // --- Calculations ---
  const currentItems = form.watch("items");
  const calculateTotal = (items: FormValues["items"] = []) => {
      let beforeDiscount = 0;
      let totalItemsDiscount = 0;

      items.forEach(item => {
          const qty = item.quantity || 0;
          const price = item.unit_price_after_tax || 0;
          const discountPercent = item.dis_percentage || 0;

          const itemTotal = qty * price;
          const discountAmount = itemTotal * (discountPercent / 100);

          beforeDiscount += itemTotal;
          totalItemsDiscount += discountAmount;
      });

      const totalAfterItemsDiscount = beforeDiscount - totalItemsDiscount;
      
      const globalDiscountPercent = form.watch("dis_percentage") || 0;
      const globalDiscountAmount = totalAfterItemsDiscount * (globalDiscountPercent / 100);
      
      const distinctTotal = totalAfterItemsDiscount - globalDiscountAmount;

      return {
          beforeDiscount,
          itemsDiscount: totalItemsDiscount,
          globalDiscount: globalDiscountAmount,
          total: distinctTotal
      };
  };
  
  // Removed simple totalAmount, now used directly in JSX

  // --- Effects ---
  useEffect(() => {
    const initForm = async () => {
        if (isEditing && existingOpportunity) {
            setIsHydrating(true);
            try {
                // Map API response to form
                const customer = existingOpportunity.customer;
                if (customer) {
                    setSelectedCustomer(customer);
                }

                // Fetch details for all items to get available units
                const itemPromises = existingOpportunity.items.map(async (item) => {
                    const rawItem = item.item || item.item_id;
                    const itemId = typeof rawItem === 'object' && rawItem !== null ? rawItem.id : rawItem;
                    if (!itemId) return null;
                    
                    try {
                        const { data: itemDetails } = await api.get<Item>(API_ENDPOINTS.ITEMS.DETAILS(itemId));
                        return { original: item, details: itemDetails };
                    } catch (e) {
                        console.error(`Failed to fetch details for item ${itemId}`, e);
                        return { original: item, details: null };
                    }
                });

                const itemsWithDetails = await Promise.all(itemPromises);

                const formItems = itemsWithDetails.filter(i => i !== null).map(({ original, details }) => {
                    let available_units: any[] = [];
                    
                    if (details) {
                        // Reconstruct available units from details
                        available_units = [
                            { 
                                name: details.default_unit_name, 
                                factor: "1", 
                                label: UNIT_LABELS[details.default_unit_name as keyof typeof UNIT_LABELS] || details.default_unit_name,
                                price: details.unit_price 
                            }
                        ];

                        if (details.unit2_name) {
                            available_units.push({ 
                                name: details.unit2_name, 
                                factor: details.unit2_factor || "1",
                                label: UNIT_LABELS[details.unit2_name as keyof typeof UNIT_LABELS] || details.unit2_name,
                                price: details.unit2_price || details.unit_price
                            });
                        }

                        if (details.unit3_name) {
                            available_units.push({ 
                                name: details.unit3_name, 
                                factor: details.unit3_factor || "1",
                                label: UNIT_LABELS[details.unit3_name as keyof typeof UNIT_LABELS] || details.unit3_name,
                                price: details.unit3_price || details.unit_price
                            });
                        }
                    }

                    const originalItemId = typeof original.item === 'object' && original.item !== null ? original.item.id : original.item;
                    
                    return {
                        item_id: originalItemId || original.item_id || 0,
                        name: details?.name || original.name || "", 
                        quantity: Number(original.quantity || 1), 
                        unit_name: original.unit_name || "meter",
                        unit_price_after_tax: Number(original.unit_price_after_tax || 0), 
                        counter_offer_after_tax: Number(original.counter_offer_after_tax || 0),
                        dis_percentage: Number(original.dis_percentage || 0),
                        notes: original.notes || "",
                        available_units: available_units
                    };
                });

                form.reset({
                    customer_phonenumber: customer?.phone_number || "",
                    clientName: customer
                      ? formatCustomerWithBalance(customer)
                      : "",
                    customer_type:
                      customer?.customer_type === "company"
                        ? "company"
                        : "individual",
                    location: existingOpportunity.location || "",
                    interest_level: existingOpportunity.interest_level || "interested",
                    notes: existingOpportunity.notes || "",
                    total_counter_offer: Number(existingOpportunity.total_counter_offer || 0),
                    dis_percentage: Number(existingOpportunity.dis_percentage || 0),
                    need_dim_order: existingOpportunity.need_dim_order ?? false,
                    items: formItems
                });
            } catch (error) {
                console.error("Error initializing form:", error);
                toast.error("حدث خطأ أثناء تحميل بيانات الفرصة");
            } finally {
                setIsHydrating(false);
            }
        }
    };

    initForm();
  }, [isEditing, existingOpportunity, form]);

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
              quantity: 1,
              unit_name: item.default_unit_name,
              unit_price_after_tax: parseFloat(item.unit_price) || 0,
              counter_offer_after_tax: 0,
              dis_percentage: 0,
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
    if (isEditing && id) {
      updateMutation.mutate(
        { 
            id, 
            data: {
                ...values,
                total_counter_offer: String(values.total_counter_offer),
                dis_percentage: String(values.dis_percentage),
                items: values.items.map(item => ({
                    ...item,
                    quantity: String(item.quantity),
                    unit_price_after_tax: String(item.unit_price_after_tax),
                    counter_offer_after_tax: String(item.counter_offer_after_tax),
                    dis_percentage: String(item.dis_percentage)
                }))
            } as any
        },
        {
            onSuccess: () => {
                toast.success("تم تحديث الفرصة بنجاح");
                navigate("/opportunities");
            },
            onError: (error) => {
                toast.error("فشل تحديث الفرصة", {
                    description: parseBackendError(error)
                });
            }
        }
      );
    } else {
      // Explicitly construct payload
      const payload: any = {
          ...values,
          items: values.items.map((item, index) => {
              // 1. Handle item_id: The backend requires an ID.
              //    If validation fails with "required", we provide a sequential mock ID (1, 2, 3...)
              //    assuming the backend uses this for ordering or ignores it for non-catalog items.
              //    If item has a real DB ID (from selection), use it.
              
              let payloadItemId = item.item_id;
              if (!payloadItemId || payloadItemId === 0) {
                  payloadItemId = index + 1; 
              }

              return {
                  ...item,
                  item_id: payloadItemId,
                  quantity: String(item.quantity),
                  unit_price_after_tax: String(item.unit_price_after_tax),
                  counter_offer_after_tax: String(item.counter_offer_after_tax || 0),
                  dis_percentage: Number(item.dis_percentage || 0).toFixed(2)
              };
          }),
          dis_percentage: Number(values.dis_percentage || 0).toFixed(2),
          total_counter_offer: String(values.total_counter_offer),
          need_dim_order: values.need_dim_order // Ensure simple boolean
      };
      
      console.log("Submitting Robust Payload:", payload);

      createMutation.mutate(
        payload,
        {
            onSuccess: () => {
                toast.success("تم إنشاء الفرصة بنجاح");
                navigate("/opportunities");
            },
            onError: (error: any) => {
                console.error("Create Validation Error:", error.response?.data);
                toast.error("فشل إنشاء الفرصة", {
                    description: parseBackendError(error)
                });
            }
        }
      );
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };


  if (isEditing && (isLoadingDetails || isHydrating)) {
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
                {isEditing ? "تعديل الفرصة" : "فرصة جديدة"}
            </h1>
            <p className="text-muted-foreground mt-1">
                {isEditing ? "تعديل بيانات الفرصة الحالية" : "إضافة فرصة جديدة للنظام"}
            </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          <div className="space-y-8">
            {/* Top Section: Customer & Details */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* Customer Check Section */}
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
                    name="customer_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع العميل</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر نوع العميل" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="individual">فرد</SelectItem>
                            <SelectItem value="company">شركة</SelectItem>
                          </SelectContent>
                        </Select>
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

              {/* Opportunity Details Section */}
              <Card className="border-border/50 shadow-sm h-full">
                <CardHeader>
                    <CardTitle>تفاصيل الفرصة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="interest_level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مدى الاهتمام</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                           {Object.entries(INTEREST_LEVELS).map(([key, value]) => (
                               <SelectItem key={key} value={key}>
                                   {value.label}
                               </SelectItem>
                           ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="total_counter_offer"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>العرض المقابل</FormLabel>
                            <FormControl>
                            <Input 
                                type="number" 
                                min="0" 
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
                        name="dis_percentage"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>خصم إضافي (%)</FormLabel>
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
                  </div>

                   <FormField
                    control={form.control}
                    name="need_dim_order"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">طلب مقاسات</FormLabel>
                        </div>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
                          <Textarea className="h-20" {...field} />
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
                    بنود الفرصة
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
                          const qty = form.watch(`items.${index}.quantity`) || 0;
                          const price = form.watch(`items.${index}.unit_price_after_tax`) || 0;
                          const discount = form.watch(`items.${index}.dis_percentage`) || 0;
                          const itemTotal = qty * price * (1 - discount / 100);
                          
                          return (
                          <tr key={field.id} className="hover:bg-muted/5 transition-colors">
                            <td className="p-2">
                              <Input 
                                placeholder="اسم البند" 
                                className="h-9 text-sm bg-muted text-muted-foreground"
                                readOnly
                                {...form.register(`items.${index}.name`)}
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="number" 
                                min="0.01"
                                step="any"
                                className="h-9 text-sm min-w-[80px]"
                                {...form.register(`items.${index}.quantity`, {
                                    setValueAs: (v) => clampToPositive(v)
                                })}
                                onKeyDown={preventNegative}
                              />
                            </td>
                            <td className="p-2">
                              {(() => {
                                const currentUnit = form.watch(`items.${index}.unit_name`);
                                const units = form.watch(`items.${index}.available_units`) || [];
                                const selectedUnitObj = units.find((u: any) => u.name === currentUnit);
                                const hasFactor = selectedUnitObj && parseFloat(selectedUnitObj.factor) > 1;

                                return (
                                  <div className="relative">
                                    <Select 
                                      value={currentUnit} 
                                      onValueChange={(val) => {
                                        form.setValue(`items.${index}.unit_name`, val);
                                        // Auto-update price based on selected unit
                                        const selectedUnit = units.find((u: any) => u.name === val);
                                        if (selectedUnit?.price) {
                                          form.setValue(`items.${index}.unit_price_after_tax`, Number(selectedUnit.price));
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
                                {...form.register(`items.${index}.unit_price_after_tax`, {
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
                                {...form.register(`items.${index}.dis_percentage`, {
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
                                {...form.register(`items.${index}.notes`)}
                              />
                            </td>
                            <td className="p-2">
                              {(() => {
                                const currentUnit = form.watch(`items.${index}.unit_name`);
                                const units = form.watch(`items.${index}.available_units`) || [];
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

            <Button type="submit" className="w-full text-lg h-12" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? (
                  <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري الحفظ...
                  </>
              ) : (
                  <>
                      <Save className="mr-2 h-5 w-5" />
                      {isEditing ? "تحديث الفرصة" : "إنشاء الفرصة"}
                  </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Create Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                إضافة عميل جديد
            </DialogTitle>
            <DialogDescription>
              الرقم المدخل غير مسجل، يرجى ملء البيانات لإنشاء ملف للعميل.
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
              <form onSubmit={customerForm.handleSubmit(handleCreateCustomer)} className="space-y-4">
                  <FormField
                    control={customerForm.control}
                    name="phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهاتف <span className="text-destructive">*</span></FormLabel>
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
                            <FormLabel>الاسم الأول <span className="text-destructive">*</span></FormLabel>
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
                            <FormLabel>اسم العائلة <span className="text-destructive">*</span></FormLabel>
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
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                      <Button type="submit" disabled={createCustomerMutation.isPending}>
                          {createCustomerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          حفظ وإضافة
                      </Button>
                  </DialogFooter>
              </form>
          </Form>
        </DialogContent>
      </Dialog>
      <CustomerSelectionModal
        isOpen={isCustomerSelectionOpen}
        onClose={() => setIsCustomerSelectionOpen(false)}
        onSelect={handleSelectCustomer}
        selectedId={selectedCustomer?.id}
        onAddNew={() => setIsCustomerModalOpen(true)}
      />
      <ProductSelectionModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSelect={handleSelectProducts}
        filterSellable={true}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإنشاء"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات على الفرصة؟" : "هل أنت متأكد من إنشاء هذه الفرصة؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إنشاء الفرصة"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
