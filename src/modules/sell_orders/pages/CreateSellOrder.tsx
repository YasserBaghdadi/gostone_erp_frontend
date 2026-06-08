import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Trash2, Save, Loader2, ArrowLeft, Search, UserPlus, PackagePlus } from "lucide-react";
import { ProductSelectionModal } from "@/components/common/ProductSelectionModal";
import { CustomerSelectionModal } from "@/components/common/CustomerSelectionModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import type { Item, Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useCreateSellOrder,
  useUpdateSellOrder,
  useSellOrderDetails,
  sellOrderHasInvoice,
} from "@/hooks/useSellOrders";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { useBranches } from "@/hooks/useBranches";
import { UNIT_LABELS, HOLE_POSITION_LABELS, BOWL_TYPE_LABELS, FAUCET_HOLE_LABELS } from "@/types";
import type { WashbasinSpec } from "@/types";
import { parseBackendError, preventNegative, clampToPositive, formatPrice } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
// import { normalizeSaudiPhone } from "@/components/form";

// --- Schema ---
// مواصفات تصنيع المغسلة — تُخزَّن في حالة النموذج كنصوص (حقول إدخال) وتُحوَّل عند الإرسال.
const washbasinSpecFormSchema = z.object({
  surface_length: z.string().default(""),
  surface_width: z.string().default(""),
  has_custom_bowl_size: z.boolean().default(false),
  bowl_length: z.string().default(""),
  bowl_width: z.string().default(""),
  bowl_depth: z.string().default(""),
  hole_position: z.enum(["right", "center", "left"]).nullable().default(null),
  bowl_type: z
    .enum([
      "porcelain_square",
      "square_with_tile",
      "waterfall_pipe",
      "waterfall_slot",
      "ceramic_round",
      "ceramic_oval",
      "ceramic_square",
      "special",
    ])
    .nullable()
    .default(null),
  bowls_count: z.union([z.literal(1), z.literal(2)]).default(1),
  faucet_hole: z.enum(["wall", "basin"]).nullable().default(null),
  front_length: z.string().default(""),
  front_height: z.string().default(""),
  approved_color_number: z.string().default(""),
  supplier_company: z.string().default(""),
});

type WashbasinSpecForm = z.infer<typeof washbasinSpecFormSchema>;

const emptyWashbasinSpec = (): WashbasinSpecForm => ({
  surface_length: "",
  surface_width: "",
  has_custom_bowl_size: false,
  bowl_length: "",
  bowl_width: "",
  bowl_depth: "",
  hole_position: null,
  bowl_type: null,
  bowls_count: 1,
  faucet_hole: null,
  front_length: "",
  front_height: "",
  approved_color_number: "",
  supplier_company: "",
});

/** ISO datetime → قيمة <input type="datetime-local"> بالتوقيت المحلي (YYYY-MM-DDTHH:mm) */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** قيمة <input type="datetime-local"> (محلية) → ISO datetime، أو null إذا فارغة */
function datetimeLocalToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const itemSchema = z.object({
  item_id: z.number().default(0),
  name: z.string().min(1, "اسم البند مطلوب"),
  quantity: z.coerce.string().min(1, "الكمية مطلوبة"),
  unit_name: z.string().min(1, "الوحدة مطلوبة"),
  price_after_tax: z.coerce.string().min(1, "السعر مطلوب"),
  dis_percentage: z.coerce.string().default("0"),
  notes: z.string().optional(),
  production_type: z.enum(["ready", "custom"]).optional(),
  washbasin_spec: washbasinSpecFormSchema.optional(),
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
  /** موعد العميل (قيمة datetime-local المحلية) — اختياري */
  delivery_date: z.string().optional().nullable(),
  /** الفرع — يُستخدم في وضع التعديل فقط (null = بدون فرع). */
  branch: z.number().nullable().default(null),
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

// --- مواصفات تصنيع المغسلة (تظهر للبنود من نوع «تفصيل») ---
const NONE = "none";

function WashbasinSpecFields({
  form,
  index,
}: {
  form: UseFormReturn<FormValues>;
  index: number;
}) {
  const base = `sell_order_items.${index}.washbasin_spec` as const;
  const hasCustomBowl = form.watch(`${base}.has_custom_bowl_size`) ?? false;
  const holePosition = form.watch(`${base}.hole_position`) ?? null;
  const bowlType = form.watch(`${base}.bowl_type`) ?? null;
  const bowlsCount = form.watch(`${base}.bowls_count`) ?? 1;
  const faucetHole = form.watch(`${base}.faucet_hole`) ?? null;

  const numberInput = (
    field:
      | "surface_length"
      | "surface_width"
      | "bowl_length"
      | "bowl_width"
      | "bowl_depth"
      | "front_length"
      | "front_height",
    label: string,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min="0"
        step="any"
        className="h-9 text-sm"
        onKeyDown={preventNegative}
        {...form.register(`${base}.${field}`, {
          setValueAs: (v) => clampToPositive(v),
        })}
      />
    </div>
  );

  const textInput = (
    field: "approved_color_number" | "supplier_company",
    label: string,
  ) => (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="text"
        className="h-9 text-sm"
        {...form.register(`${base}.${field}`)}
      />
    </div>
  );

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4" dir="rtl">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <PackagePlus className="h-4 w-4" />
        تفاصيل التصنيع
      </h4>

      <div className="space-y-4">
        {/* منظور السطح */}
        <fieldset className="rounded-md border border-border/50 p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">منظور السطح</legend>
          <div className="grid grid-cols-2 gap-3">
            {numberInput("surface_length", "الطول")}
            {numberInput("surface_width", "العمق")}
          </div>
        </fieldset>

        {/* مقاس حوض خاص */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`custom-bowl-${index}`}
              checked={hasCustomBowl}
              onCheckedChange={(checked) =>
                form.setValue(`${base}.has_custom_bowl_size`, checked === true)
              }
            />
            <Label htmlFor={`custom-bowl-${index}`} className="cursor-pointer text-sm">
              مقاس حوض خاص
            </Label>
          </div>
          {hasCustomBowl && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {numberInput("bowl_length", "طول الحوض")}
              {numberInput("bowl_width", "عرض الحوض")}
              {numberInput("bowl_depth", "عمق الحوض")}
            </div>
          )}
        </div>

        {/* القوائم المنسدلة */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">مكان فتحة الحوض</Label>
            <Select
              value={holePosition ?? NONE}
              onValueChange={(val) =>
                form.setValue(
                  `${base}.hole_position`,
                  val === NONE ? null : (val as "right" | "center" | "left"),
                )
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {Object.entries(HOLE_POSITION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">نوع الحوض</Label>
            <Select
              value={bowlType ?? NONE}
              onValueChange={(val) =>
                form.setValue(
                  `${base}.bowl_type`,
                  val === NONE
                    ? null
                    : (val as NonNullable<WashbasinSpecForm["bowl_type"]>),
                )
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {Object.entries(BOWL_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">عدد الأحواض</Label>
            <Select
              value={String(bowlsCount)}
              onValueChange={(val) =>
                form.setValue(`${base}.bowls_count`, val === "2" ? 2 : 1)
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">حوض</SelectItem>
                <SelectItem value="2">حوضين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">فتحة الخلاط</Label>
            <Select
              value={faucetHole ?? NONE}
              onValueChange={(val) =>
                form.setValue(
                  `${base}.faucet_hole`,
                  val === NONE ? null : (val as "wall" | "basin"),
                )
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>—</SelectItem>
                {Object.entries(FAUCET_HOLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* منظور أمامي */}
        <fieldset className="rounded-md border border-border/50 p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">منظور أمامي</legend>
          <div className="grid grid-cols-2 gap-3">
            {numberInput("front_length", "الطول")}
            {numberInput("front_height", "الارتفاع")}
          </div>
        </fieldset>

        {/* المواد المطلوبة */}
        <fieldset className="rounded-md border border-border/50 p-3">
          <legend className="px-1 text-xs font-medium text-muted-foreground">المواد المطلوبة</legend>
          <div className="grid grid-cols-2 gap-3">
            {textInput("approved_color_number", "رقم اللون المعتمد")}
            {textInput("supplier_company", "الشركة الموردة")}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export default function CreateSellOrder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  // الفرع المحدّد للأمر الجديد (يُمرَّر من قائمة أوامر البيع عبر ?branch=<id>).
  const branchParam = searchParams.get("branch");
  const branchId = useMemo<number | null>(() => {
    const n = branchParam ? Number(branchParam) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [branchParam]);

  const { data: branches = [] } = useBranches();
  const selectedBranch = branches.find((b) => b.id === branchId) ?? null;

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
      // موعد العميل الافتراضي: 10 أيام من اليوم (قابل للتعديل)
      delivery_date: isoToDatetimeLocal(new Date(Date.now() + 10 * 86400000).toISOString()),
      branch: null,
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
        delivery_date: isoToDatetimeLocal(existingSellOrder.delivery_date),
        branch: existingSellOrder.branch ?? null,
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

          const isCustom = item.item?.production_type === "custom";
          const numToStr = (v: number | null | undefined) =>
            v === null || v === undefined ? "" : String(v);
          const existingSpec = item.washbasin_spec;
          const washbasin_spec: WashbasinSpecForm | undefined = isCustom
            ? existingSpec
              ? {
                  surface_length: numToStr(existingSpec.surface_length),
                  surface_width: numToStr(existingSpec.surface_width),
                  has_custom_bowl_size: Boolean(existingSpec.has_custom_bowl_size),
                  bowl_length: numToStr(existingSpec.bowl_length),
                  bowl_width: numToStr(existingSpec.bowl_width),
                  bowl_depth: numToStr(existingSpec.bowl_depth),
                  hole_position: existingSpec.hole_position ?? null,
                  bowl_type: existingSpec.bowl_type ?? null,
                  bowls_count: existingSpec.bowls_count === 2 ? 2 : 1,
                  faucet_hole: existingSpec.faucet_hole ?? null,
                  front_length: numToStr(existingSpec.front_length),
                  front_height: numToStr(existingSpec.front_height),
                  approved_color_number: existingSpec.approved_color_number ?? "",
                  supplier_company: existingSpec.supplier_company ?? "",
                }
              : emptyWashbasinSpec()
            : undefined;

          return {
            item_id: item.item?.id || 0,
            name: item.item?.name || "",
            quantity: item.quantity,
            unit_name: item.unit_name,
            price_after_tax: formatPrice(item.price_after_tax),
            dis_percentage: item.dis_percentage,
            notes: item.notes,
            production_type: item.item?.production_type,
            washbasin_spec,
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

          const isCustom = item.production_type === "custom";
          append({
              item_id: item.id,
              name: item.name,
              quantity: "1",
              unit_name: item.default_unit_name,
              price_after_tax: formatPrice(item.unit_price),
              dis_percentage: "0",
              notes: "",
              production_type: item.production_type,
              washbasin_spec: isCustom ? emptyWashbasinSpec() : undefined,
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

    // تحويل مواصفات التصنيع من حالة النموذج (نصوص) إلى الشكل الذي يتوقعه الباك اند.
    const strToNum = (v: string | undefined): number | null => {
      const t = (v ?? "").trim();
      if (t === "") return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };
    const buildWashbasinSpec = (spec: WashbasinSpecForm): WashbasinSpec => {
      const hasCustomBowl = Boolean(spec.has_custom_bowl_size);
      return {
        surface_length: strToNum(spec.surface_length),
        surface_width: strToNum(spec.surface_width),
        has_custom_bowl_size: hasCustomBowl,
        bowl_length: hasCustomBowl ? strToNum(spec.bowl_length) : null,
        bowl_width: hasCustomBowl ? strToNum(spec.bowl_width) : null,
        bowl_depth: hasCustomBowl ? strToNum(spec.bowl_depth) : null,
        hole_position: spec.hole_position ?? null,
        bowl_type: spec.bowl_type ?? null,
        bowls_count: spec.bowls_count === 2 ? 2 : 1,
        faucet_hole: spec.faucet_hole ?? null,
        front_length: strToNum(spec.front_length),
        front_height: strToNum(spec.front_height),
        approved_color_number: spec.approved_color_number?.trim() || null,
        supplier_company: spec.supplier_company?.trim() || null,
      };
    };

    const deliveryDate = datetimeLocalToIso(values.delivery_date);

    const payload: any = {
      customer_phonenumber: values.customer_phonenumber,
      location: values.location,
      notes: values.notes,
      dis_percentage: parseFloat(values.dis_percentage || "0").toFixed(2),
      delivery_date: deliveryDate,
      sell_order_items: values.sell_order_items.map((item, index) => {
        const line: Record<string, unknown> = {
          item_id: item.item_id || index + 1,
          quantity: String(item.quantity),
          price_after_tax: String(item.price_after_tax),
          unit_name: item.unit_name,
          notes: item.notes || "",
          dis_percentage: parseFloat(item.dis_percentage || "0").toFixed(2),
        };
        if (item.production_type === "custom" && item.washbasin_spec) {
          line.washbasin_spec = buildWashbasinSpec(item.washbasin_spec);
        }
        return line;
      }),
    };

    if (isEditing && id) {
      // في وضع التعديل فقط: نُرسل الفرع المختار (id أو null لإزالته/تركه بدون فرع).
      const updatePayload = { ...payload, branch: values.branch ?? null };
      updateMutation.mutate(
        { id, data: updatePayload },
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
      const createPayload =
        branchId != null ? { ...payload, branch: branchId } : payload;
      createMutation.mutate(createPayload, {
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
        {!isEditing && branchId != null && (
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <Building2 className="h-4 w-4" />
            الفرع: {selectedBranch?.name ?? `#${branchId}`}
          </Badge>
        )}
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
                  {isEditing && (
                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الفرع</FormLabel>
                          <Select
                            value={
                              field.value == null ? NONE : String(field.value)
                            }
                            onValueChange={(val) =>
                              field.onChange(val === NONE ? null : Number(val))
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="بدون فرع" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NONE}>بدون فرع</SelectItem>
                              {branches.map((branch) => (
                                <SelectItem
                                  key={branch.id}
                                  value={String(branch.id)}
                                >
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
                    name="delivery_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موعد العميل</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
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
                          const isCustomLine = form.watch(`sell_order_items.${index}.production_type`) === "custom";

                          return (
                          <Fragment key={field.id}>
                          <tr className="hover:bg-muted/5 transition-colors">
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
                          {isCustomLine && (
                            <tr>
                              <td colSpan={9} className="p-2 pt-0">
                                <WashbasinSpecFields form={form} index={index} />
                              </td>
                            </tr>
                          )}
                          </Fragment>
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
