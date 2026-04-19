import { useState } from "react";
import { Search, Loader2, Check, ShoppingCart } from "lucide-react";
import { useSellOrders } from "@/hooks/useSellOrders";
import { Pagination } from "@/components/shared/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SellOrder } from "@/types";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";

interface SellOrderSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sellOrder: SellOrder) => void;
  selectedId?: number;
}

export function SellOrderSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedId,
}: SellOrderSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset to first page when user changes search.
  // Doing this inside the onChange handler avoids a setState-in-effect lint.

  const { data, isLoading } = useSellOrders({
    search,
    page,
    page_size: PAGE_SIZE,
  });

  const sellOrders = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSelect = (order: SellOrder) => {
    onSelect(order);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            اختيار أمر البيع
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث برقم الأمر أو اسم العميل..."
            className="pr-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            autoFocus
          />
        </div>

        <div className="h-[350px] overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : sellOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
              <ShoppingCart className="h-8 w-8 opacity-30" />
              <p>لا يوجد أوامر بيع مطابقة</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sellOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleSelect(order)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-right
                    ${selectedId === order.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{order.id}
                      </Badge>
                      <span className="font-medium">
                        {order.customer
                          ? formatCustomerWithBalance(order.customer)
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono" dir="ltr">{order.customer.phone_number}</span>
                      <span className="font-bold text-primary font-mono">
                        {parseFloat(order.total_price_after_tax || "0").toLocaleString()} ر.س
                      </span>
                    </div>
                  </div>
                  {selectedId === order.id && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="[&_nav]:border-t-0 [&_nav]:mt-2 [&_nav]:pt-0 px-1">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              isLoading={isLoading}
              entityName="أمر بيع"
            />
          </div>
        )}

        <div className="flex justify-end pt-2 border-t">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
