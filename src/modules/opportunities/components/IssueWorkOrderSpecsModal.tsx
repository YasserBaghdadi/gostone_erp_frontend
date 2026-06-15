import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, PackagePlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  WashbasinSpecFields,
  washbasinSpecFormSchema,
  emptyWashbasinSpec,
  type WashbasinSpecForm,
} from "@/modules/sell_orders/pages/CreateSellOrder";

export interface SpecItem {
  opportunity_item_id: number;
  name: string;
}

interface Props {
  items: SpecItem[];
  open: boolean;
  onClose: () => void;
  /** Receives the specs map keyed by opportunity-item id, then issues the order. */
  onSubmit: (specs: Record<string, unknown>) => void;
  isSubmitting?: boolean;
}

const modalSchema = z.object({
  sell_order_items: z.array(z.object({ washbasin_spec: washbasinSpecFormSchema })),
});
type ModalValues = z.infer<typeof modalSchema>;

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

/**
 * Shown when issuing a work order from an opportunity that has custom (تفصيل)
 * washbasins: collects «تفاصيل التصنيع» for each one, then issues the order.
 */
export default function IssueWorkOrderSpecsModal({
  items,
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: Props) {
  const form = useForm<ModalValues>({
    // zod .default() makes the schema input/output types differ; cast like the
    // other forms in this codebase.
    resolver: zodResolver(modalSchema) as never,
    defaultValues: {
      sell_order_items: items.map(() => ({ washbasin_spec: emptyWashbasinSpec() })),
    },
  });

  // Re-seed the form whenever the set of custom items changes.
  useEffect(() => {
    form.reset({
      sell_order_items: items.map(() => ({ washbasin_spec: emptyWashbasinSpec() })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.opportunity_item_id).join(",")]);

  const handle = (values: ModalValues) => {
    const specs: Record<string, unknown> = {};
    items.forEach((it, i) => {
      specs[String(it.opportunity_item_id)] = buildSpec(
        values.sell_order_items[i].washbasin_spec,
      );
    });
    onSubmit(specs);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            تفاصيل التصنيع
          </DialogTitle>
          <DialogDescription>
            عبّئ تفاصيل التصنيع لكل مغسلة تفصيل، ثم احفظ لإصدار الأمر.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handle)} className="space-y-5">
          {items.map((it, i) => (
            <div key={it.opportunity_item_id} className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {i + 1}. {it.name}
              </p>
              <WashbasinSpecFields form={form} index={i} />
            </div>
          ))}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : null}
              حفظ وإصدار الأمر
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
