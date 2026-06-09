import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInventoryAdjustment } from "@/hooks/useAccounts";

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InventoryAdjustmentDialog({
  open,
  onOpenChange,
}: InventoryAdjustmentDialogProps) {
  const [value, setValue] = useState("");
  const adjust = useInventoryAdjustment();

  const submit = () => {
    if (!value) return;
    adjust.mutate(value, {
      onSuccess: () => {
        setValue("");
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسوية جرد آخر المدة</DialogTitle>
          <DialogDescription>
            أدخل قيمة المخزون الفعلي آخر الفترة. يُسجَّل القيد تلقائياً (مدين «المخزون» /
            دائن «تكلفة المبيعات») فيظهر مخزونك في الميزانية وتتعدّل التكلفة في قائمة الدخل.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">قيمة مخزون آخر المدة (ر.س)</label>
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={submit} disabled={adjust.isPending || !value}>
              {adjust.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تسجيل التسوية
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
