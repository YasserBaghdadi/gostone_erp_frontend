import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, ArrowLeft, Package, Link, X, Plus } from "lucide-react";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { Item } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateItem, useUpdateItem, useItemDetails, useItems } from "@/hooks/useItems";
import { parseBackendError, preventNegative, clampToPositive } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "اسم المنتج مطلوب"),
  is_sellable: z.boolean().default(true),
  is_purchable: z.boolean().default(true),
  unit_price: z.string().min(1, "السعر مطلوب"),
  default_unit_name: z.string().min(1, "الوحدة الافتراضية مطلوبة"),
  unit2_name: z.string().optional().nullable(),
  unit2_factor: z.string().optional().nullable(),
  unit2_price: z.string().optional().nullable(),
  unit3_name: z.string().optional().nullable(),
  unit3_factor: z.string().optional().nullable(),
  unit3_price: z.string().optional().nullable(),
  linked_purchasable_items: z.array(z.number()).optional().default([]),
  linked_sellable_items: z.array(z.number()).optional().default([]),
  thickness: z.string().optional().nullable(),
  production_type: z.enum(["ready", "custom"]).default("ready"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const { data: existingItem, isLoading: isLoadingDetails } = useItemDetails(id!);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      is_sellable: false,
      is_purchable: false,
      unit_price: "",
      default_unit_name: "",
      unit2_name: "",
      unit2_factor: "",
      unit2_price: "",
      unit3_name: "",
      unit3_factor: "",
      unit3_price: "",
      linked_purchasable_items: [],
      linked_sellable_items: [],
      thickness: "",
      production_type: "ready",
    },
  });

  // State for modals and linked item objects (for display purposes)
  const [isPurchasableModalOpen, setIsPurchasableModalOpen] = useState(false);
  const [isSellableModalOpen, setIsSellableModalOpen] = useState(false);
  const [linkedPurchasableObjects, setLinkedPurchasableObjects] = useState<Item[]>([]);
  const [linkedSellableObjects, setLinkedSellableObjects] = useState<Item[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  // Fetch all items to resolve linked item IDs to names
  const { data: allItemsData } = useItems({ page_size: 1000, page: 1 });

  useEffect(() => {
    if (isEditing && existingItem) {
      form.reset({
        name: existingItem.name,
        is_sellable: existingItem.is_sellable,
        is_purchable: existingItem.is_purchable,
        unit_price: existingItem.unit_price,
        default_unit_name: existingItem.default_unit_name,
        unit2_name: existingItem.unit2_name || "",
        unit2_factor: existingItem.unit2_factor || "",
        unit2_price: existingItem.unit2_price || "",
        unit3_name: existingItem.unit3_name || "",
        unit3_factor: existingItem.unit3_factor || "",
        unit3_price: existingItem.unit3_price || "",
        linked_purchasable_items: existingItem.linked_purchasable_items || [],
        linked_sellable_items: existingItem.linked_sellable_items || [],
        thickness: existingItem.thickness || "",
        production_type: existingItem.production_type || "ready",
      });
    }
  }, [isEditing, existingItem, form]);

  // Resolve linked item IDs to full Item objects for display
  useEffect(() => {
    if (isEditing && existingItem && allItemsData?.results) {
      const allItems = allItemsData.results;
      if (existingItem.linked_purchasable_items?.length) {
        const purchasableObjects = allItems.filter(item =>
          existingItem.linked_purchasable_items.includes(item.id)
        );
        setLinkedPurchasableObjects(purchasableObjects);
      }
      if (existingItem.linked_sellable_items?.length) {
        const sellableObjects = allItems.filter(item =>
          existingItem.linked_sellable_items.includes(item.id)
        );
        setLinkedSellableObjects(sellableObjects);
      }
    }
  }, [isEditing, existingItem, allItemsData]);

  const handleSelectPurchasableProducts = (selectedItems: Item[]) => {
    setLinkedPurchasableObjects(selectedItems);
    form.setValue("linked_purchasable_items", selectedItems.map(i => i.id));
  };

  const handleSelectSellableProducts = (selectedItems: Item[]) => {
    setLinkedSellableObjects(selectedItems);
    form.setValue("linked_sellable_items", selectedItems.map(i => i.id));
  };

  const removeLinkedPurchasable = (itemId: number) => {
    setLinkedPurchasableObjects(prev => prev.filter(i => i.id !== itemId));
    form.setValue("linked_purchasable_items", form.getValues("linked_purchasable_items")?.filter(id => id !== itemId) || []);
  };

  const removeLinkedSellable = (itemId: number) => {
    setLinkedSellableObjects(prev => prev.filter(i => i.id !== itemId));
    form.setValue("linked_sellable_items", form.getValues("linked_sellable_items")?.filter(id => id !== itemId) || []);
  };

  // Show confirmation before submit
  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = () => {
    if (!pendingFormData) return;
    const values = pendingFormData;
    // Helper to filter out empty/null values
    const helperCleanValues = (obj: any) => {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        // Keep falsy boolean values (false) but remove empty strings, nulls, undefined
        if (value !== null && value !== undefined && value !== "") {
           // Special check for arrays (linked items)
           if (Array.isArray(value) && value.length === 0) {
             return; // Skip empty arrays
           }
           newObj[key] = value;
        }
      });
      return newObj;
    };

    const rawPayload = {
      ...values,
      unit2_name: values.unit2_name || null,
      unit2_factor: values.unit2_factor || null,
      unit2_price: values.unit2_price || null,
      unit3_name: values.unit3_name || null,
      unit3_factor: values.unit3_factor || null,
      unit3_price: values.unit3_price || null,
      thickness: values.thickness || null,
    };

    const payload = helperCleanValues(rawPayload);

    if (isEditing && id) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success("تم تحديث المنتج بنجاح");
            navigate("/items");
          },
          onError: (error) => {
            toast.error("فشل تحديث المنتج", {
              description: parseBackendError(error)
            });
          }
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("تم إنشاء المنتج بنجاح");
          navigate("/items");
        },
        onError: (error) => {
          toast.error("فشل إنشاء المنتج", {
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
            {isEditing ? "تعديل المنتج" : "منتج جديد"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "تعديل بيانات المنتج" : "إضافة منتج جديد للنظام"}
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
                  <Package className="h-5 w-5 text-primary" />
                  البيانات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المنتج</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: نافذة ألومنيوم" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السعر (ر.س)</FormLabel>
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
                  name="default_unit_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوحدة الافتراضية</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: piece, meter, sqm" {...field} />
                      </FormControl>
                      <FormDescription>
                        الوحدة المستخدمة افتراضياً عند إضافة المنتج
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="production_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المنتج</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="اختر نوع المنتج" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ready">جاهزة</SelectItem>
                          <SelectItem value="custom">تفصيل</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        «جاهزة» للأصناف الجاهزة و«تفصيل» للأصناف التي تُصنّع حسب الطلب
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="thickness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>السمك (مم) <span className="text-muted-foreground text-xs">(اختياري)</span></FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                              type="number"
                              min="0"
                              step="any"
                              placeholder="مثال: 10" 
                              {...field} 
                              value={field.value || ""}
                              onKeyDown={preventNegative}
                              onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                              className="pl-10"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">مم</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-6 pt-4">
                  <FormField
                    control={form.control}
                    name="is_sellable"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">قابل للبيع</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_purchable"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">قابل للشراء</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Units */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>الوحدات الإضافية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="unit2_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوحدة الثانية</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: box" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit2_factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معامل التحويل {form.watch("default_unit_name") ? <span className="text-muted-foreground text-xs">(بالنسبة الي {form.watch("default_unit_name")})</span> : null}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="any"
                            placeholder="مثال: 5" 
                            {...field} 
                            value={field.value || ""} 
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
                    name="unit2_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (ر.س)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field} 
                            value={field.value || ""} 
                            onKeyDown={preventNegative}
                            onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="unit3_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الوحدة الثالثة</FormLabel>
                        <FormControl>
                          <Input placeholder="اختياري" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit3_factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>معامل التحويل {form.watch("default_unit_name") ? <span className="text-muted-foreground text-xs">(بالنسبة الي {form.watch("default_unit_name")})</span> : null}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="any"
                            placeholder="اختياري" 
                            {...field} 
                            value={field.value || ""} 
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
                    name="unit3_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السعر (ر.س)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01"
                            placeholder="اختياري" 
                            {...field} 
                            value={field.value || ""} 
                            onKeyDown={preventNegative}
                            onChange={(e) => field.onChange(clampToPositive(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Linked Products Section */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                ربط المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Linked Purchasable Items (Show if Sellable is checked) */}
              {form.watch("is_sellable") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-muted-foreground">المنتجات القابلة للشراء المرتبطة (مكونات)</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsPurchasableModalOpen(true)}>
                      <Plus className="h-4 w-4 ml-1.5" /> إضافة
                    </Button>
                  </div>
                  {linkedPurchasableObjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {linkedPurchasableObjects.map(item => (
                        <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info-light border border-info/20 text-info text-sm font-medium">
                          {item.name}
                          <button type="button" onClick={() => removeLinkedPurchasable(item.id)} className="hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">لم يتم تحديد منتجات مرتبطة بعد.</p>
                  )}
                </div>
              )}

              {/* Linked Sellable Items (Show if Purchasable is checked - rare case but requested) */}
              {form.watch("is_purchable") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-muted-foreground">المنتجات القابلة للبيع المرتبطة</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsSellableModalOpen(true)}>
                      <Plus className="h-4 w-4 ml-1.5" /> إضافة
                    </Button>
                  </div>
                  {linkedSellableObjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {linkedSellableObjects.map(item => (
                        <div key={item.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-light border border-success/20 text-success text-sm font-medium">
                          {item.name}
                          <button type="button" onClick={() => removeLinkedSellable(item.id)} className="hover:text-destructive transition-colors">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">لم يتم تحديد منتجات مرتبطة بعد.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="ml-2 h-5 w-5 animate-spin" />
            )}
            <Save className="ml-2 h-5 w-5" />
            {isEditing ? "حفظ التعديلات" : "إضافة المنتج"}
          </Button>
        </form>
      </Form>

      {/* Product Selection Modals */}
      <ProductSelectionModal
        isOpen={isPurchasableModalOpen}
        onClose={() => setIsPurchasableModalOpen(false)}
        onSelect={handleSelectPurchasableProducts}
        excludeIds={isEditing && id ? [Number(id)] : []}
        filterPurchable={true}
      />
      <ProductSelectionModal
        isOpen={isSellableModalOpen}
        onClose={() => setIsSellableModalOpen(false)}
        onSelect={handleSelectSellableProducts}
        excludeIds={isEditing && id ? [Number(id)] : []}
        filterSellable={true}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإنشاء"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات على المنتج؟" : "هل أنت متأكد من إضافة هذا المنتج؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إضافة المنتج"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
