import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, Loader2, ArrowLeft, Factory, Package, X } from "lucide-react";
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
import { toast } from "sonner";
import { useCreateProductionOrder } from "@/hooks/useProductionOrders";
import {
  WashbasinSpecFields,
  washbasinSpecFormSchema,
  emptyWashbasinSpec,
  type WashbasinSpecForm,
} from "@/modules/sell_orders/pages/CreateSellOrder";
import { parseBackendError, preventNegative, clampToPositive } from "@/lib/utils";

const formSchema = z.object({
  finished_item: z.number().min(1, "الصنف المُصنّع مطلوب"),
  quantity: z.string().min(1, "الكمية مطلوبة"),
  unit_name: z.string().min(1, "الوحدة مطلوبة"),
  // Manufacturing specs (same as the auto production order from a sell order).
  // Held in a one-element `sell_order_items` array because WashbasinSpecFields
  // reads its values from that path (mirrors IssueWorkOrderSpecsModal).
  sell_order_items: z.array(z.object({ washbasin_spec: washbasinSpecFormSchema })),
});

type FormValues = z.infer<typeof formSchema>;

const strToNum = (s: string | undefined | null): number | null => {
  const n = parseFloat(String(s ?? ""));
  return Number.isFinite(n) ? n : null;
};

/** Form strings → API washbasin-spec payload (mirrors CreateSellOrder). */
function buildSpec(spec: WashbasinSpecForm) {
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
}

export default function CreateProductionOrder() {
  const navigate = useNavigate();
  const createMutation = useCreateProductionOrder();

  const form = useForm<FormValues>({
    // zod .default() inside the spec schema makes input/output types differ; cast
    // like the other forms in this codebase.
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      finished_item: 0,
      quantity: "",
      unit_name: "",
      sell_order_items: [{ washbasin_spec: emptyWashbasinSpec() }],
    },
  });

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormValues | null>(null);

  const handleSelectItem = (items: Item[]) => {
    const item = items[0];
    if (!item) return;
    setSelectedItem(item);
    form.setValue("finished_item", item.id, { shouldValidate: true });
    // Prefill the unit with the item's default unit if not set yet
    if (!form.getValues("unit_name")) {
      form.setValue("unit_name", item.default_unit_name);
    }
  };

  const removeSelectedItem = () => {
    setSelectedItem(null);
    form.setValue("finished_item", 0, { shouldValidate: true });
  };

  const handleFormSubmit = (values: FormValues) => {
    setPendingFormData(values);
    setIsConfirmOpen(true);
  };

  const onSubmit = () => {
    if (!pendingFormData) return;
    createMutation.mutate(
      {
        finished_item: pendingFormData.finished_item,
        quantity: pendingFormData.quantity,
        unit_name: pendingFormData.unit_name,
        washbasin_spec: buildSpec(pendingFormData.sell_order_items[0].washbasin_spec),
      },
      {
        onSuccess: (order) => {
          toast.success("تم إنشاء أمر التصنيع بنجاح");
          navigate(`/production-orders/${order.id}`);
        },
        onError: (error) => {
          toast.error("فشل إنشاء أمر التصنيع", {
            description: parseBackendError(error),
          });
        },
      },
    );
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            أمر تصنيع جديد
          </h1>
          <p className="text-muted-foreground mt-1">إنشاء أمر تصنيع يدوي لصنف</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                بيانات أمر التصنيع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Finished Item */}
              <FormField
                control={form.control}
                name="finished_item"
                render={() => (
                  <FormItem>
                    <FormLabel>الصنف المُصنّع</FormLabel>
                    {selectedItem ? (
                      <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-primary/5 border-primary/20">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{selectedItem.name}</p>
                            <p className="text-xs text-muted-foreground">
                              الوحدة الافتراضية: {selectedItem.default_unit_name}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={removeSelectedItem}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start h-11"
                        onClick={() => setIsItemModalOpen(true)}
                      >
                        <Package className="ml-2 h-4 w-4" />
                        اختر الصنف المُصنّع
                      </Button>
                    )}
                    <FormDescription>
                      اختر الصنف الذي سيتم تصنيعه (أصناف نوع «مخزون تفصيل» — تُنتَج وتُخزَّن ثم تُباع من المخزون)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الكمية</FormLabel>
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
                name="unit_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوحدة</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: piece, meter, sqm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Manufacturing specs — same fields as the auto production order from a sale */}
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5 text-primary" />
                تفاصيل التصنيع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WashbasinSpecFields form={form} index={0} />
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full max-w-2xl h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
            <Save className="ml-2 h-5 w-5" />
            إنشاء أمر التصنيع
          </Button>
        </form>
      </Form>

      <ProductSelectionModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSelect={handleSelectItem}
        filterProductionType="custom_stock"
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title="تأكيد الإنشاء"
        description="هل أنت متأكد من إنشاء أمر التصنيع؟"
        confirmText="إنشاء"
        variant="success"
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
