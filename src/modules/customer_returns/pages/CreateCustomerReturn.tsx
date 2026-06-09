import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Save,
  Loader2,
  ArrowLeft,
  Search,
  PackageOpen,
  Calendar,
  ShoppingCart,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SellOrderSelectionModal } from "@/components/common/SellOrderSelectionModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useSellOrderDetails } from "@/hooks/useSellOrders";
import { formatCustomerReturnPartyLabel, formatCustomerWithBalance } from "@/lib/partyDisplay";
import {
  useCreateCustomerReturn,
  useUpdateCustomerReturn,
  useCustomerReturnDetails,
} from "@/hooks/useCustomerReturns";
import { useStorageAreas } from "@/hooks/useStorageAreas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseBackendError, preventNegative } from "@/lib/utils";
import type { SellOrder } from "@/types";

const returnItemSchema = z.object({
  sell_order_item: z.number(),
  item_name: z.string(),
  original_quantity: z.string(),
  unit_name: z.string(),
  unit_price: z.string(),
  quantity: z.coerce.string().min(1, "الكمية مطلوبة"),
  notes: z.string().optional(),
  selected: z.boolean().default(false),
});

const formSchema = z.object({
  sell_order: z.number().min(1, "يجب اختيار أمر بيع"),
  sell_order_display: z.string().optional(),
  return_date: z.string().min(1, "تاريخ المرتجع مطلوب"),
  notes: z.string().optional(),
  storage_area: z.number().optional(),
  items: z.array(returnItemSchema),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCustomerReturn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const preselectedSellOrderId = searchParams.get("sell_order");

  const [isSellOrderModalOpen, setIsSellOrderModalOpen] = useState(false);
  const [selectedSellOrderId, setSelectedSellOrderId] = useState<number | null>(
    preselectedSellOrderId ? Number(preselectedSellOrderId) : null,
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(
    null,
  );

  const createMutation = useCreateCustomerReturn();
  const updateMutation = useUpdateCustomerReturn();
  const { data: warehousesData } = useStorageAreas({ page_size: 200 });
  const warehouses = warehousesData?.results ?? [];

  const { data: existingReturn, isLoading: isLoadingDetails } =
    useCustomerReturnDetails(id!);
  const { data: sellOrderDetails, isLoading: isLoadingSellOrder } =
    useSellOrderDetails(selectedSellOrderId ? String(selectedSellOrderId) : "");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      sell_order: preselectedSellOrderId ? Number(preselectedSellOrderId) : 0,
      sell_order_display: "",
      return_date: new Date().toISOString().split("T")[0],
      notes: "",
      items: [],
    },
  });

  // Default the return warehouse to «المخزن الرئيسي».
  useEffect(() => {
    if (!form.getValues("storage_area") && warehouses.length) {
      const def = warehouses.find((w) => w.is_default) ?? warehouses[0];
      if (def) form.setValue("storage_area", def.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouses.length]);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // When editing, load existing data
  useEffect(() => {
    if (isEditing && existingReturn) {
      setSelectedSellOrderId(existingReturn.sell_order);
      form.reset({
        sell_order: existingReturn.sell_order,
        sell_order_display: `أمر بيع #${existingReturn.sell_order} - ${formatCustomerReturnPartyLabel(existingReturn)}`,
        return_date: existingReturn.return_date,
        notes: existingReturn.notes || "",
        items: existingReturn.items.map((item) => ({
          sell_order_item: item.sell_order_item,
          item_name: item.item_name,
          original_quantity: item.sell_order_item_original_quantity,
          unit_name: item.unit_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          notes: item.notes || "",
          selected: true,
        })),
      });
    }
  }, [isEditing, existingReturn, form]);

  // When sell order details load (new mode), populate items
  useEffect(() => {
    if (!isEditing && sellOrderDetails && selectedSellOrderId) {
      const display = `أمر بيع #${sellOrderDetails.id} - ${formatCustomerWithBalance(sellOrderDetails.customer)}`;
      form.setValue("sell_order", sellOrderDetails.id);
      form.setValue("sell_order_display", display);

      const items = sellOrderDetails.sell_order_items.map((item) => ({
        sell_order_item: item.id,
        item_name:
          typeof item.item === "object" ? item.item.name : `بند #${item.id}`,
        original_quantity: item.quantity,
        unit_name: item.unit_name,
        unit_price: item.price_after_tax,
        quantity: item.quantity,
        notes: "",
        selected: false,
      }));
      replace(items);
    }
  }, [sellOrderDetails, selectedSellOrderId, isEditing, form, replace]);

  const handleSelectSellOrder = (order: SellOrder) => {
    setSelectedSellOrderId(order.id);
  };

  const watchedItems = form.watch("items");
  const selectedItems = watchedItems.filter((item) => item.selected);

  const orderLineTotalsByItemId = new Map<number, string>(
    (sellOrderDetails?.sell_order_items ?? []).map((i) => [i.id, i.total_price_after_tax]),
  );

  const toNumber = (value: unknown): number => {
    const n =
      typeof value === "number"
        ? value
        : typeof value === "string"
          ? parseFloat(value)
          : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  /**
   * Total of the returned qty for a sell-order line.
   * We prefer the backend-computed line total (`total_price_after_tax`) and prorate it by return qty.
   * This avoids frontend rounding/discount/tax mismatches.
   */
  const getReturnedLineTotal = (sellOrderItemId: number, qty: number, originalQty: number, fallbackUnitPrice: number) => {
    const backendLineTotal = toNumber(orderLineTotalsByItemId.get(sellOrderItemId));
    if (backendLineTotal > 0 && originalQty > 0) {
      return (qty / originalQty) * backendLineTotal;
    }
    return qty * fallbackUnitPrice;
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const qty = toNumber(item.quantity);
      const price = toNumber(item.unit_price);
      const originalQty = toNumber(item.original_quantity);
      return sum + getReturnedLineTotal(item.sell_order_item, qty, originalQty, price);
    }, 0);
  };

  const handleFormSubmit = (values: FormValues) => {
    const selected = values.items.filter((i) => i.selected);
    if (selected.length === 0) {
      toast.error("يجب اختيار بند واحد على الأقل");
      return;
    }
    for (const item of selected) {
      const qty = parseFloat(item.quantity || "0");
      const originalQty = parseFloat(item.original_quantity || "0");
      if (!Number.isFinite(qty) || qty <= 0) {
        toast.error(`الكمية يجب أن تكون أكبر من صفر للبند: ${item.item_name}`);
        return;
      }
      if (qty > originalQty) {
        toast.error(
          `الكمية لا يمكن أن تتجاوز الكمية الأصلية (${originalQty}) للبند: ${item.item_name}`,
        );
        return;
      }
    }
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = () => {
    if (!pendingFormData) return;
    const values = pendingFormData;

    const selectedReturnItems = values.items
      .filter((i) => i.selected)
      .map((item) => ({
        sell_order_item: item.sell_order_item,
        quantity: String(item.quantity),
        notes: item.notes || "",
      }));

    const payload = {
      sell_order: values.sell_order,
      return_date: values.return_date,
      notes: values.notes || "",
      storage_area: values.storage_area,
      items: selectedReturnItems,
    };

    if (isEditing && id) {
      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success("تم تحديث المرتجع بنجاح");
            navigate(`/customer-returns/${id}`);
          },
          onError: (error) => {
            toast.error("فشل تحديث المرتجع", {
              description: parseBackendError(error),
            });
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("تم إنشاء المرتجع بنجاح");
          navigate("/customer-returns");
        },
        onError: (error) => {
          toast.error("فشل إنشاء المرتجع", {
            description: parseBackendError(error),
          });
        },
      });
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  if (isEditing && isLoadingDetails) {
    return (
      <div className='flex items-center justify-center min-h-[50vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate(-1)}
          className='rounded-full'
        >
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
            {isEditing ? "تعديل المرتجع" : "إنشاء مرتجع جديد"}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {isEditing ? "تعديل بيانات المرتجع" : "إنشاء طلب مرتجع لأمر بيع"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className='space-y-8'
        >
          <div className='grid gap-6 lg:grid-cols-2'>
            {/* Sell Order Selection */}
            <Card className='border-border/50 shadow-sm h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShoppingCart className='h-5 w-5 text-primary' />
                  أمر البيع
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='sell_order_display'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>أمر البيع المرتبط</FormLabel>
                      <FormControl>
                        <div className='flex gap-2'>
                          <Input
                            placeholder='اختر أمر بيع...'
                            readOnly
                            className='bg-muted cursor-pointer'
                            onClick={() =>
                              !isEditing && setIsSellOrderModalOpen(true)
                            }
                            {...field}
                          />
                          {!isEditing && (
                            <Button
                              type='button'
                              variant='outline'
                              onClick={() => setIsSellOrderModalOpen(true)}
                              className='px-3'
                            >
                              <Search className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sellOrderDetails && !isEditing && (
                  <div className='p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>العميل</span>
                      <span className='font-medium'>
                        {formatCustomerWithBalance(sellOrderDetails.customer)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>الإجمالي</span>
                      <span className='font-bold text-primary font-mono'>
                        {parseFloat(
                          sellOrderDetails.total_price_after_tax || "0",
                        ).toLocaleString()}{" "}
                        ر.س
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>عدد البنود</span>
                      <Badge variant='outline' className='font-mono text-xs'>
                        {sellOrderDetails.sell_order_items.length}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Return Details */}
            <Card className='border-border/50 shadow-sm h-full'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5 text-primary' />
                  تفاصيل المرتجع
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <FormField
                  control={form.control}
                  name='return_date'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Calendar className='inline h-4 w-4 ml-1' />
                        تاريخ المرتجع
                      </FormLabel>
                      <FormControl>
                        <Input type='date' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='storage_area'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المخزن (يُرجَع إليه)</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : undefined}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <FormControl>
                          <SelectTrigger className='w-full'>
                            <SelectValue placeholder='اختر المخزن' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={String(w.id)}>
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='notes'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات</FormLabel>
                      <FormControl>
                        <Textarea
                          className='h-28'
                          placeholder='أي ملاحظات إضافية...'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Items Selection */}
          <Card className='border-border/50 shadow-sm'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <PackageOpen className='h-5 w-5 text-primary' />
                بنود المرتجع
                {selectedItems.length > 0 && (
                  <Badge variant='secondary' className='mr-2 font-mono'>
                    {selectedItems.length} مختار
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              {isLoadingSellOrder ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary' />
                  <span className='mr-2 text-muted-foreground text-sm'>
                    جاري تحميل البنود...
                  </span>
                </div>
              ) : fields.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground'>
                  <PackageOpen className='h-10 w-10 mb-3 opacity-20' />
                  <p className='font-medium'>لا توجد بنود</p>
                  <p className='text-sm mt-1'>
                    اختر أمر بيع أولاً لعرض البنود المتاحة للإرجاع
                  </p>
                </div>
              ) : (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted/50 border-b'>
                      <tr className='text-right'>
                        <th className='p-3 font-medium text-muted-foreground w-[50px]'></th>
                        <th className='p-3 font-medium text-muted-foreground'>
                          البند
                        </th>
                        <th className='p-3 font-medium text-muted-foreground w-[100px] text-center'>
                          الكمية الأصلية
                        </th>
                        <th className='p-3 font-medium text-muted-foreground w-[100px] text-center'>
                          كمية الإرجاع
                        </th>
                        <th className='p-3 font-medium text-muted-foreground w-[80px] text-center'>
                          الوحدة
                        </th>
                        <th className='p-3 font-medium text-muted-foreground w-[100px] text-center'>
                          السعر
                        </th>
                        <th className='p-3 font-medium text-muted-foreground w-[100px] text-center'>
                          الإجمالي
                        </th>
                        <th className='p-3 font-medium text-muted-foreground'>
                          ملاحظات
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y'>
                      {fields.map((field, index) => {
                        const isSelected = form.watch(
                          `items.${index}.selected`,
                        );
                        const qty = parseFloat(
                          form.watch(`items.${index}.quantity`) || "0",
                        );
                        const price = parseFloat(
                          form.watch(`items.${index}.unit_price`) || "0",
                        );
                        const originalQtyRaw = parseFloat(
                          form.watch(`items.${index}.original_quantity`) || "0",
                        );
                        const lineTotal = getReturnedLineTotal(
                          Number(form.watch(`items.${index}.sell_order_item`) || 0),
                          Number.isFinite(qty) ? qty : 0,
                          Number.isFinite(originalQtyRaw) ? originalQtyRaw : 0,
                          Number.isFinite(price) ? price : 0,
                        );
                        const maxQty =
                          Number.isFinite(originalQtyRaw) && originalQtyRaw > 0
                            ? Math.floor(originalQtyRaw)
                            : undefined;

                        return (
                          <tr
                            key={field.id}
                            className={`transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/5 opacity-60"}`}
                          >
                            <td className='p-2 text-center'>
                              <FormField
                                control={form.control}
                                name={`items.${index}.selected`}
                                render={({ field: checkField }) => (
                                  <Checkbox
                                    checked={checkField.value}
                                    onCheckedChange={checkField.onChange}
                                  />
                                )}
                              />
                            </td>
                            <td className='p-2'>
                              <span className='font-medium'>
                                {form.watch(`items.${index}.item_name`)}
                              </span>
                            </td>
                            <td className='p-2 text-center'>
                              <Badge
                                variant='outline'
                                className='font-mono text-xs'
                              >
                                {form.watch(`items.${index}.original_quantity`)}
                              </Badge>
                            </td>
                            <td className='p-2'>
                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => {
                                  const commitQty = (raw: string) => {
                                    if (raw === "") {
                                      field.onChange("");
                                      return;
                                    }
                                    const n = parseFloat(raw);
                                    if (!Number.isFinite(n) || n <= 0) {
                                      field.onChange("");
                                      return;
                                    }
                                    if (
                                      typeof maxQty === "number" &&
                                      n > maxQty
                                    ) {
                                      field.onChange(String(maxQty));
                                      return;
                                    }
                                    field.onChange(String(n));
                                  };

                                  return (
                                    <FormItem className='space-y-0'>
                                      <FormControl>
                                        <Input
                                          type='number'
                                          inputMode='decimal'
                                          min={0.01}
                                          max={maxQty}
                                          step='any'
                                          className='h-9 text-sm min-w-[80px] text-center'
                                          disabled={!isSelected}
                                          name={field.name}
                                          ref={field.ref}
                                          value={field.value ?? ""}
                                          onKeyDown={preventNegative}
                                          onChange={(e) => {
                                            if (!isSelected) return;
                                            // allow free decimal typing (digits + a single dot); normalize on blur
                                            const raw = e.currentTarget.value
                                              .replace(/[^\d.]/g, "")
                                              .replace(/(\..*)\./g, "$1");
                                            field.onChange(raw);
                                          }}
                                          onBlur={(e) => {
                                            field.onBlur();
                                            if (!isSelected) return;
                                            const raw = e.currentTarget.value;
                                            if (raw === "") {
                                              field.onChange("1");
                                              return;
                                            }
                                            commitQty(raw);
                                          }}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  );
                                }}
                              />
                            </td>
                            <td className='p-2 text-center text-muted-foreground text-xs'>
                              {form.watch(`items.${index}.unit_name`)}
                            </td>
                            <td className='p-2 text-center font-mono text-xs'>
                              {parseFloat(
                                form.watch(`items.${index}.unit_price`) || "0",
                              ).toLocaleString()}
                            </td>
                            <td className='p-2 text-center'>
                              <div
                                className={`h-9 flex items-center justify-center font-medium text-sm rounded-md px-2 ${isSelected ? "bg-primary/10 text-primary" : "bg-muted/50"}`}
                              >
                                {isSelected
                                  ? `${lineTotal.toLocaleString()} ر.س`
                                  : "-"}
                              </div>
                            </td>
                            <td className='p-2'>
                              <Input
                                placeholder='ملاحظات'
                                className='h-9 text-sm'
                                disabled={!isSelected}
                                {...form.register(`items.${index}.notes`)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            {selectedItems.length > 0 && (
              <CardFooter className='bg-muted/50 border-t flex justify-between items-center px-6 py-4'>
                <div className='flex flex-col items-end gap-1 w-full'>
                  <div className='flex justify-between w-full text-sm text-muted-foreground'>
                    <span>عدد البنود المختارة:</span>
                    <span className='font-mono'>{selectedItems.length}</span>
                  </div>
                  <div className='flex justify-between w-full font-bold text-xl text-primary border-t pt-2 mt-2'>
                    <span>إجمالي المرتجع:</span>
                    <span className='font-mono'>
                      {calculateTotal().toLocaleString()} ر.س
                    </span>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>

          <Button
            type='submit'
            className='w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20'
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className='ml-2 h-5 w-5 animate-spin' />
            )}
            <Save className='ml-2 h-5 w-5' />
            {isEditing ? "حفظ التعديلات" : "إنشاء المرتجع"}
          </Button>
        </form>
      </Form>

      <SellOrderSelectionModal
        isOpen={isSellOrderModalOpen}
        onClose={() => setIsSellOrderModalOpen(false)}
        onSelect={handleSelectSellOrder}
        selectedId={selectedSellOrderId ?? undefined}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإنشاء"}
        description={
          isEditing
            ? "هل أنت متأكد من حفظ التعديلات على المرتجع؟"
            : `هل أنت متأكد من إنشاء مرتجع بـ ${selectedItems.length} بند بإجمالي ${calculateTotal().toLocaleString()} ر.س؟`
        }
        confirmText={isEditing ? "حفظ التعديلات" : "إنشاء المرتجع"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
