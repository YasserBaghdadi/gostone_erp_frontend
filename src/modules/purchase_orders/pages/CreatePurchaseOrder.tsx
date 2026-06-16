import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Trash2,
  Save,
  Loader2,
  ArrowLeft,
  Plus,
  Package,
  ShoppingCart,
  Search,
  FileText,
  Truck,
  Users,
  UserCog,
} from "lucide-react";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { SupplierSelectionModal } from "@/components/common/SupplierSelectionModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { Item, SellOrder, Supplier } from "@/types";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  usePurchaseOrderDetails,
} from "@/hooks/usePurchaseOrders";
import { useSellOrders } from "@/hooks/useSellOrders";
import { useStorageAreas } from "@/hooks/useStorageAreas";
import { UNIT_LABELS } from "@/types";
import {
  parseBackendError,
  preventNegative,
  clampToPositive,
  formatPrice,
} from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { Badge } from "@/components/ui/badge";

// --- Schema ---
const itemSchema = z.object({
  item: z.number().min(1, "البند مطلوب"),
  item_name: z.string().optional(),
  quantity: z.coerce.string().min(1, "الكمية مطلوبة"),
  unit_name: z.string().min(1, "الوحدة مطلوبة"),
  purchase_price: z.coerce.string().min(1, "السعر مطلوب"),
  notes: z.string().optional(),
  line_supplier: z.coerce.number(),
  line_supplier_name: z.string().optional(),
  available_units: z
    .array(
      z.object({
        name: z.string(),
        factor: z.string(),
        label: z.string().optional(),
        price: z.string().optional(),
      }),
    )
    .optional(),
});

const formSchema = z
  .object({
    supplierMode: z.enum(["order", "per_line"]),
    supplier: z.coerce.number().min(0),
    supplier_name: z.string().optional(),
    sell_order: z.coerce.number().optional(),
    sell_order_display: z.string().optional(),
    notes: z.string().optional(),
    storage_area: z.coerce.number().min(1, "يجب اختيار المخزن (المستودع)"),
    purchase_type: z.enum(["LOCAL", "FOREIGN"]).default("LOCAL"),
    items: z.array(itemSchema).min(1, "يجب إضافة بند واحد على الأقل"),
  })
  .superRefine((data, ctx) => {
    if (data.supplierMode === "order") {
      if (!data.supplier || data.supplier < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "اختر مورد الطلب",
          path: ["supplier"],
        });
      }
    }
    if (data.supplierMode === "per_line") {
      data.items.forEach((item, idx) => {
        if (!item.line_supplier || item.line_supplier < 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "حدد المورد لهذا البند",
            path: ["items", idx, "line_supplier"],
          });
        }
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

const EMPTY_ITEMS: FormValues["items"] = [];

export default function CreatePurchaseOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSellOrderModalOpen, setIsSellOrderModalOpen] = useState(false);
  const [sellOrderSearch, setSellOrderSearch] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(
    null,
  );

  /**
   * في وضع per_line: المورد الذي ستُضاف أصنافه عند فتح نافذة المنتجات.
   * في وضع order: غير مستخدم (المورد من حقل الفورم).
   */
  const [activeGroupSupplier, setActiveGroupSupplier] = useState<{
    id: number;
    name: string;
  } | null>(null);

  type SupplierModalPurpose =
    | "order"
    | "new_group"
    | "add_to_group"
    | "change_group_supplier";
  const [supplierModalPurpose, setSupplierModalPurpose] =
    useState<SupplierModalPurpose>("order");
  /** فهارس البنود التي سيُحدَّث موردها بعد اختيار مورد من النافذة */
  const [changeSupplierLineIndices, setChangeSupplierLineIndices] = useState<
    number[] | null
  >(null);

  const createMutation = useCreatePurchaseOrder();
  const updateMutation = useUpdatePurchaseOrder();
  const { data: warehousesData } = useStorageAreas({ page_size: 200 });
  const warehouses = warehousesData?.results ?? [];

  const { data: existingOrder, isLoading: isLoadingDetails } =
    usePurchaseOrderDetails(id!);
  const { data: sellOrdersData } = useSellOrders({
    page_size: 50,
    search: sellOrderSearch,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      supplierMode: "order",
      supplier: 0,
      supplier_name: "",
      sell_order: undefined,
      sell_order_display: "",
      notes: "",
      purchase_type: "LOCAL",
      items: [],
    },
  });

  // Warehouse is now mandatory — no silent default; the user must pick it consciously.

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const supplierMode = form.watch("supplierMode");
  const orderSupplierId = form.watch("supplier");
  const orderSupplierName = form.watch("supplier_name");
  /** useWatch يضمن إعادة التصيير عند تغيير مورد بند (مجموعات الموردين تتحدّث فوراً) */
  const itemsFromWatch = useWatch({ control: form.control, name: "items" });
  const watchedItems = itemsFromWatch ?? EMPTY_ITEMS;

  /** تجميع البنود حسب المورد (للعرض فقط في وضع per_line) */
  const supplierGroups = useMemo(() => {
    if (supplierMode !== "per_line") return [];
    const map = new Map<
      number,
      { name: string; indices: number[] }
    >();
    watchedItems.forEach((item, idx) => {
      const sid = item.line_supplier || 0;
      if (!map.has(sid)) {
        map.set(sid, {
          name: item.line_supplier_name || `مورد #${sid}`,
          indices: [],
        });
      }
      map.get(sid)!.indices.push(idx);
    });
    return Array.from(map.entries());
  }, [supplierMode, watchedItems]);

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existingOrder) {
      const rawItems = existingOrder.items || [];
      // Single-supplier POs only: always load in order mode.
      const mode: "order" | "per_line" = "order";
      const mappedItems = rawItems.map((item) => ({
        item: item.item,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_name: item.unit_name,
        purchase_price: formatPrice(item.purchase_price),
        notes: item.notes || "",
        line_supplier: item.supplier ?? existingOrder.supplier,
        line_supplier_name:
          item.supplier_name || existingOrder.supplier_name || "",
        available_units: [],
      }));
      form.reset({
        supplierMode: mode,
        supplier: mode === "order" ? existingOrder.supplier : 0,
        supplier_name:
          mode === "order" ? existingOrder.supplier_name || "" : "",
        sell_order: existingOrder.sell_order,
        sell_order_display: existingOrder.sell_order
          ? `${existingOrder.sell_order}`
          : "",
        notes: existingOrder.notes || "",
        purchase_type: existingOrder.purchase_type ?? "LOCAL",
        items: mappedItems,
      });
    }
  }, [isEditing, existingOrder, form]);

  /** وضع مورد واحد للطلب: مزامنة المورد على كل البنود */
  useEffect(() => {
    if (supplierMode !== "order" || !orderSupplierId || orderSupplierId < 1)
      return;
    const items = form.getValues("items");
    items.forEach((_, i) => {
      form.setValue(`items.${i}.line_supplier`, orderSupplierId);
      form.setValue(`items.${i}.line_supplier_name`, orderSupplierName || "");
    });
  }, [supplierMode, orderSupplierId, orderSupplierName, form]);

  // --- Helpers ---
  const buildAvailableUnits = (product: Item) => {
    const units = [
      {
        name: product.default_unit_name,
        factor: "1",
        label:
          UNIT_LABELS[
            product.default_unit_name as keyof typeof UNIT_LABELS
          ] || product.default_unit_name,
        price: product.unit_price,
      },
    ];
    if (product.unit2_name) {
      units.push({
        name: product.unit2_name,
        factor: product.unit2_factor || "1",
        label:
          UNIT_LABELS[product.unit2_name as keyof typeof UNIT_LABELS] ||
          product.unit2_name,
        price: product.unit2_price || product.unit_price,
      });
    }
    if (product.unit3_name) {
      units.push({
        name: product.unit3_name,
        factor: product.unit3_factor || "1",
        label:
          UNIT_LABELS[product.unit3_name as keyof typeof UNIT_LABELS] ||
          product.unit3_name,
        price: product.unit3_price || product.unit_price,
      });
    }
    return units;
  };

  // --- Handlers ---
  const handleProductsSelect = (products: Item[]) => {
    let sid = 0;
    let sName = "";

    if (supplierMode === "order") {
      sid = form.getValues("supplier");
      sName = form.getValues("supplier_name") || "";
    } else if (activeGroupSupplier) {
      sid = activeGroupSupplier.id;
      sName = activeGroupSupplier.name;
    }

    if (!sid || sid < 1) {
      toast.error("لم يتم تحديد المورد");
      return;
    }

    products.forEach((product) => {
      append({
        item: product.id,
        item_name: product.name,
        quantity: "1",
        unit_name: product.default_unit_name,
        purchase_price: formatPrice(product.unit_price),
        notes: "",
        line_supplier: sid,
        line_supplier_name: sName,
        available_units: buildAvailableUnits(product),
      });
    });
    setIsProductModalOpen(false);
    setActiveGroupSupplier(null);
  };

  const handleSelectSellOrder = (sellOrder: SellOrder) => {
    form.setValue("sell_order", sellOrder.id);
    form.setValue(
      "sell_order_display",
      `${sellOrder.customer?.first_name || ""} ${sellOrder.customer?.last_name || ""}`,
    );
    setIsSellOrderModalOpen(false);
  };

  const handleSupplierPicked = (supplier: Supplier) => {
    if (supplierModalPurpose === "change_group_supplier" && changeSupplierLineIndices?.length) {
      const targetIndices = changeSupplierLineIndices;
      targetIndices.forEach((i) => {
        const row = form.getValues(`items.${i}`);
        update(i, {
          ...row,
          line_supplier: supplier.id,
          line_supplier_name: supplier.display_name,
        });
      });
      setChangeSupplierLineIndices(null);
      setIsSupplierModalOpen(false);
      toast.success(
        targetIndices.length === 1
          ? "تم تحديث مورد البند"
          : "تم تحديث المورد لجميع البنود المحددة",
      );
      return;
    }
    if (supplierModalPurpose === "order") {
      form.setValue("supplier", supplier.id);
      form.setValue("supplier_name", supplier.display_name);
      setIsSupplierModalOpen(false);
    } else {
      // new_group or add_to_group → set active and open products
      setActiveGroupSupplier({
        id: supplier.id,
        name: supplier.display_name,
      });
      setIsSupplierModalOpen(false);
      setTimeout(() => setIsProductModalOpen(true), 200);
    }
  };

  /** تغيير المورد لبند أو لمجموعة بنود (وضع مورد لكل مجموعة) */
  const openChangeLinesSupplier = (indices: number[]) => {
    if (!indices.length) return;
    setSupplierModalPurpose("change_group_supplier");
    setChangeSupplierLineIndices(indices);
    setIsSupplierModalOpen(true);
  };

  /** إضافة أصناف لمورد موجود بالفعل في البنود */
  const openAddItemsForGroup = (supplierId: number, supplierName: string) => {
    setActiveGroupSupplier({ id: supplierId, name: supplierName });
    setIsProductModalOpen(true);
  };

  /** فتح نافذة إضافة بنود — وضع مورد واحد */
  const openAddItemsOrderMode = () => {
    const sid = form.getValues("supplier");
    if (!sid || sid < 1) {
      toast.error("اختر مورد الطلب أولاً");
      return;
    }
    setIsProductModalOpen(true);
  };

  /** إضافة مورد جديد وأصنافه */
  const openNewSupplierGroup = () => {
    setSupplierModalPurpose("new_group");
    setIsSupplierModalOpen(true);
  };

  const removeSupplierGroup = (supplierId: number) => {
    const items = form.getValues("items");
    const indicesToRemove = items
      .map((item, idx) => (item.line_supplier === supplierId ? idx : -1))
      .filter((i) => i >= 0)
      .reverse();
    indicesToRemove.forEach((idx) => remove(idx));
  };

  const calculateTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity || "0");
      const price = parseFloat(item.purchase_price || "0");
      return sum + qty * price;
    }, 0);
  };

  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = async () => {
    if (!pendingFormData) return;
    const values = pendingFormData;
    const isOrderMode = values.supplierMode === "order";
    const payload = {
      ...(isOrderMode ? { supplier: values.supplier } : {}),
      sell_order: values.sell_order || undefined,
      notes: values.notes,
      storage_area: values.storage_area,
      purchase_type: values.purchase_type,
      items: values.items.map((item) => ({
        item: item.item,
        ...(isOrderMode ? {} : { supplier: item.line_supplier }),
        quantity: String(item.quantity),
        purchase_price: String(item.purchase_price),
        unit_name: item.unit_name,
        notes: item.notes ?? "",
      })),
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: id!, data: payload },
        {
          onSuccess: () => {
            toast.success("تم تحديث طلب الشراء بنجاح");
            navigate(`/purchase-orders/${id}`);
          },
          onError: (error) => {
            toast.error("فشل تحديث طلب الشراء", {
              description: parseBackendError(error),
            });
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("تم إنشاء طلب الشراء بنجاح");
          navigate("/purchase-orders");
        },
        onError: (error: any) => {
          toast.error("فشل إنشاء طلب الشراء", {
            description: parseBackendError(error),
          });
        },
      });
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  // --- Item Row Renderer ---
  const renderItemRow = (fieldIdx: number) => {
    const field = fields[fieldIdx];
    if (!field) return null;
    const qty = parseFloat(
      form.watch(`items.${fieldIdx}.quantity`) || "0",
    );
    const price = parseFloat(
      form.watch(`items.${fieldIdx}.purchase_price`) || "0",
    );
    const itemTotal = qty * price;
    const currentUnit = form.watch(`items.${fieldIdx}.unit_name`);
    const units = form.watch(`items.${fieldIdx}.available_units`) || [];

    return (
      <tr key={field.id} className='hover:bg-muted/5 transition-colors'>
        <td className='p-2'>
          <Input
            placeholder='اسم البند'
            className='h-9 text-sm bg-muted text-muted-foreground'
            readOnly
            {...form.register(`items.${fieldIdx}.item_name`)}
          />
        </td>
        <td className='p-2'>
          <Input
            type='number'
            min='0.01'
            step='any'
            className='h-9 text-sm'
            {...form.register(`items.${fieldIdx}.quantity`, {
              setValueAs: (v) => clampToPositive(v),
            })}
            onKeyDown={preventNegative}
          />
        </td>
        <td className='p-2'>
          {units.length > 1 ? (
            <Select
              value={currentUnit}
              onValueChange={(val) => {
                form.setValue(`items.${fieldIdx}.unit_name`, val);
                const selectedUnit = units.find(
                  (u: any) => u.name === val,
                );
                if (selectedUnit?.price) {
                  form.setValue(
                    `items.${fieldIdx}.purchase_price`,
                    formatPrice(selectedUnit.price),
                  );
                }
              }}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit: any) => (
                  <SelectItem key={unit.name} value={unit.name}>
                    {unit.label || unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              className='h-9 text-sm bg-muted'
              readOnly
              value={
                UNIT_LABELS[currentUnit as keyof typeof UNIT_LABELS] ||
                currentUnit
              }
            />
          )}
        </td>
        <td className='p-2'>
          <Input
            type='number'
            min='0'
            step='0.01'
            className='h-9 text-sm'
            {...form.register(`items.${fieldIdx}.purchase_price`, {
              setValueAs: (v) => clampToPositive(v),
            })}
            onKeyDown={preventNegative}
          />
        </td>
        <td className='p-2 text-center'>
          <Badge variant='secondary' className='font-mono text-xs'>
            {itemTotal.toLocaleString()}
          </Badge>
        </td>
        <td className='p-2 align-top min-w-[140px] max-w-[220px]'>
          <Textarea
            placeholder='ملاحظات البند…'
            className='min-h-16 max-h-32 resize-y text-sm py-2'
            rows={2}
            {...form.register(`items.${fieldIdx}.notes`)}
          />
        </td>
        <td className='p-2 align-top'>
          <div className='flex items-center justify-end gap-0.5'>
            {supplierMode === "per_line" && (
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => openChangeLinesSupplier([fieldIdx])}
                className='h-8 w-8 text-muted-foreground hover:text-primary'
                title='تغيير مورد هذا البند'
                aria-label='تغيير مورد هذا البند'
              >
                <UserCog className='h-4 w-4' />
              </Button>
            )}
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={() => remove(fieldIdx)}
              className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
              aria-label='حذف البند'
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  // --- Table Header ---
  const tableHeader = (
    <thead className='bg-muted/30'>
      <tr className='border-b text-right'>
        <th className='p-3 font-medium text-muted-foreground min-w-[140px]'>
          البند
        </th>
        <th className='p-3 font-medium text-muted-foreground w-[11%] whitespace-nowrap'>
          الكمية
        </th>
        <th className='p-3 font-medium text-muted-foreground w-[14%] whitespace-nowrap'>
          الوحدة
        </th>
        <th className='p-3 font-medium text-muted-foreground w-[12%] whitespace-nowrap'>
          سعر الشراء
        </th>
        <th className='p-3 font-medium text-muted-foreground w-[10%] whitespace-nowrap'>
          الإجمالي
        </th>
        <th className='p-3 font-medium text-muted-foreground min-w-[140px] max-w-[220px]'>
          ملاحظات البند
        </th>
        <th
          className={
            supplierMode === "per_line" ? "p-3 min-w-[96px]" : "p-3 w-[40px]"
          }
        />
      </tr>
    </thead>
  );

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
            {isEditing ? "تعديل طلب الشراء" : "طلب شراء جديد"}
          </h1>
          <p className='text-muted-foreground mt-1'>
            {isEditing
              ? "تعديل بيانات طلب الشراء الحالي"
              : "إنشاء طلب شراء جديد من المورد"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className='space-y-8'
        >
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* ───────── Left Column ───────── */}
            <div className='lg:col-span-1 space-y-6'>
              <Card className='border-border/50 shadow-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ShoppingCart className='h-5 w-5 text-primary' />
                    بيانات الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-5'>
                  {/* Single supplier per purchase order. */}
                  {supplierMode === "order" && (
                    <FormField
                      control={form.control}
                      name='supplier'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المورد</FormLabel>
                          <div className='flex gap-2'>
                            <FormControl>
                              <Input
                                placeholder='اختر المورد...'
                                value={
                                  orderSupplierName
                                    ? orderSupplierName
                                    : field.value && field.value > 0
                                      ? `مورد #${field.value}`
                                      : ""
                                }
                                readOnly
                                className='bg-muted cursor-pointer'
                                onClick={() => {
                                  setSupplierModalPurpose("order");
                                  setIsSupplierModalOpen(true);
                                }}
                              />
                            </FormControl>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              onClick={() => {
                                setSupplierModalPurpose("order");
                                setIsSupplierModalOpen(true);
                              }}
                            >
                              <Search className='h-4 w-4' />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Linked Sell Order */}
                  <FormField
                    control={form.control}
                    name='sell_order'
                    render={() => (
                      <FormItem>
                        <FormLabel>أمر بيع مرتبط (اختياري)</FormLabel>
                        <div className='flex gap-2'>
                          <FormControl>
                            <Input
                              placeholder='اختر أمر البيع...'
                              value={form.watch("sell_order_display") || ""}
                              readOnly
                              className='bg-muted cursor-pointer'
                              onClick={() => setIsSellOrderModalOpen(true)}
                            />
                          </FormControl>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={() => setIsSellOrderModalOpen(true)}
                          >
                            <FileText className='h-4 w-4' />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Receiving warehouse */}
                  <FormField
                    control={form.control}
                    name='storage_area'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          المخزن (يُستلَم فيه){" "}
                          <span className="text-destructive">*</span>
                        </FormLabel>
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

                  {/* Purchase type: local (601) / foreign (602) */}
                  <FormField
                    control={form.control}
                    name='purchase_type'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع الشراء</FormLabel>
                        <Select
                          value={field.value ?? "LOCAL"}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <FormControl>
                            <SelectTrigger className='w-full'>
                              <SelectValue placeholder='اختر نوع الشراء' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value='LOCAL'>محلي</SelectItem>
                            <SelectItem value='FOREIGN'>خارجي</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ملاحظات</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='ملاحظات إضافية...'
                            className='min-h-[100px]'
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

            {/* ───────── Right Column - Items ───────── */}
            <div className='lg:col-span-2 space-y-6'>
              {/* ════ ORDER MODE ════ */}
              {supplierMode === "order" && (
                <Card className='border-border/50 shadow-sm'>
                  <CardHeader className='flex flex-row items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      <Package className='h-5 w-5 text-primary' />
                      البنود ({fields.length})
                    </CardTitle>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={openAddItemsOrderMode}
                      className='gap-2'
                    >
                      <Plus className='h-4 w-4' />
                      إضافة بند
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {fields.length > 0 ? (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                          {tableHeader}
                          <tbody className='divide-y'>
                            {fields.map((_, idx) => renderItemRow(idx))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl'>
                        <Package className='h-10 w-10 mb-2 opacity-30' />
                        <p>لا توجد بنود</p>
                        <Button
                          type='button'
                          variant='link'
                          onClick={openAddItemsOrderMode}
                          className='mt-2'
                        >
                          إضافة بند جديد
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className='flex justify-between items-center border-t bg-muted/30 p-4'>
                    <span className='font-semibold text-muted-foreground'>
                      التكلفة الإجمالية شامل الضريبة:
                    </span>
                    <span className='text-2xl font-bold text-primary'>
                      {calculateTotal().toLocaleString()}{" "}
                      <span className='text-sm font-normal text-muted-foreground'>
                        ر.س
                      </span>
                    </span>
                  </CardFooter>
                </Card>
              )}

              {/* ════ PER-LINE MODE — grouped by supplier ════ */}
              {supplierMode === "per_line" && (
                <div className='space-y-4'>
                  {supplierGroups.length > 0 ? (
                    supplierGroups.map(([sid, group]) => (
                      <Card
                        key={sid}
                        className='border-border/50 shadow-sm overflow-hidden'
                      >
                        {/* Supplier group header */}
                        <div className='flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3'>
                          <div className='flex items-center gap-2.5 min-w-0'>
                            <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10'>
                              <Truck className='h-4 w-4 text-primary' />
                            </div>
                            <div className='min-w-0'>
                              <p className='font-semibold text-sm leading-tight truncate'>
                                {group.name}
                              </p>
                              <p className='text-[11px] text-muted-foreground'>
                                {group.indices.length} بند
                              </p>
                            </div>
                          </div>
                          <div className='flex shrink-0 items-center gap-1.5 flex-wrap justify-end'>
                            <Button
                              type='button'
                              variant='outline'
                              size='sm'
                              className='h-8 gap-1 text-xs'
                              onClick={() => openChangeLinesSupplier(group.indices)}
                            >
                              <UserCog className='h-3.5 w-3.5' />
                              تغيير المورد
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-8 gap-1 text-xs'
                              onClick={() =>
                                openAddItemsForGroup(sid, group.name)
                              }
                            >
                              <Plus className='h-3.5 w-3.5' />
                              إضافة أصناف
                            </Button>
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10'
                              onClick={() => removeSupplierGroup(sid)}
                              aria-label='حذف مجموعة المورد'
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </div>

                        <CardContent className='p-0'>
                          <div className='overflow-x-auto'>
                            <table className='w-full text-sm'>
                              {tableHeader}
                              <tbody className='divide-y'>
                                {group.indices.map((idx) =>
                                  renderItemRow(idx),
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className='border-border/50 shadow-sm'>
                      <CardContent className='py-12'>
                        <div className='flex flex-col items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-xl py-10'>
                          <Users className='h-10 w-10 mb-3 opacity-30' />
                          <p className='font-medium'>لا توجد بنود بعد</p>
                          <p className='text-sm mt-1'>
                            أضف مورداً ثم اختر أصنافه
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Add new supplier group */}
                  <Button
                    type='button'
                    variant='outline'
                    className='w-full gap-2 border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/50'
                    onClick={openNewSupplierGroup}
                  >
                    <Plus className='h-5 w-5' />
                    إضافة مورد جديد وأصنافه
                  </Button>

                  {/* Total */}
                  {fields.length > 0 && (
                    <Card className='border-border/50 shadow-sm'>
                      <CardFooter className='flex justify-between items-center p-4'>
                        <span className='font-semibold text-muted-foreground'>
                          التكلفة الإجمالية شامل الضريبة:
                        </span>
                        <span className='text-2xl font-bold text-primary'>
                          {calculateTotal().toLocaleString()}{" "}
                          <span className='text-sm font-normal text-muted-foreground'>
                            ر.س
                          </span>
                        </span>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className='flex justify-end gap-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => navigate(-1)}
                >
                  إلغاء
                </Button>
                <Button
                  type='submit'
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className='gap-2'
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='h-4 w-4' />
                  )}
                  {isEditing ? "حفظ التعديلات" : "إنشاء الطلب"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* ── Product Selection Modal ── */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setActiveGroupSupplier(null);
        }}
        onSelect={handleProductsSelect}
        filterPurchable={true}
        filterSupplier={
          supplierMode === "order"
            ? orderSupplierId > 0
              ? orderSupplierId
              : undefined
            : activeGroupSupplier && activeGroupSupplier.id > 0
              ? activeGroupSupplier.id
              : undefined
        }
        excludeIds={watchedItems.map((row) => row.item)}
      />

      {/* ── Supplier Selection Modal ── */}
      <SupplierSelectionModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setChangeSupplierLineIndices(null);
        }}
        onSelect={handleSupplierPicked}
        selectedId={
          supplierModalPurpose === "order" ? orderSupplierId : undefined
        }
      />

      {/* ── Sell Order Modal ── */}
      <Dialog
        open={isSellOrderModalOpen}
        onOpenChange={setIsSellOrderModalOpen}
      >
        <DialogContent className='max-w-lg max-h-[80vh] overflow-hidden flex flex-col'>
          <DialogHeader>
            <DialogTitle>اختيار أمر البيع</DialogTitle>
            <DialogDescription>
              اختر أمر البيع المرتبط بطلب الشراء
            </DialogDescription>
          </DialogHeader>
          <div className='py-2'>
            <Input
              placeholder='بحث...'
              value={sellOrderSearch}
              onChange={(e) => setSellOrderSearch(e.target.value)}
              className='mb-4'
            />
          </div>
          <div className='flex-1 overflow-y-auto space-y-2 min-h-[200px]'>
            {sellOrdersData?.results?.map((order) => (
              <div
                key={order.id}
                className='p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors'
                onClick={() => handleSelectSellOrder(order)}
              >
                <div className='flex justify-between items-center'>
                  <span className='font-medium'>أمر بيع #{order.id}</span>
                  <Badge variant='outline'>
                    {parseFloat(
                      order.total_price_after_tax || "0",
                    ).toLocaleString()}{" "}
                    ر.س
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground mt-1'>
                  {order.customer
                    ? formatCustomerWithBalance(order.customer)
                    : "—"}
                </p>
              </div>
            ))}
            {(!sellOrdersData?.results ||
              sellOrdersData.results.length === 0) && (
              <div className='text-center py-8 text-muted-foreground'>
                لا توجد أوامر بيع
              </div>
            )}
          </div>
          <DialogFooter className='border-t pt-4'>
            <Button
              variant='outline'
              onClick={() => {
                form.setValue("sell_order", undefined);
                form.setValue("sell_order_display", "");
                setIsSellOrderModalOpen(false);
              }}
            >
              مسح الاختيار
            </Button>
            <Button
              variant='ghost'
              onClick={() => setIsSellOrderModalOpen(false)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإنشاء"}
        description={
          isEditing
            ? "هل أنت متأكد من حفظ التعديلات على طلب الشراء؟"
            : "هل أنت متأكد من إنشاء طلب الشراء هذا؟"
        }
        confirmText={isEditing ? "حفظ التعديلات" : "إنشاء الطلب"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
