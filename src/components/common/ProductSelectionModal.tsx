import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  X,
  Package,
  Check,
  Inbox,
} from "lucide-react";
import { useItems } from "@/hooks/useItems";
import type { Item } from "@/types";
import { cn } from "@/lib/utils";
// Assuming useDebounce exists, if not I'll just use simple timeout or effect.
// Actually I don't recall seeing useDebounce. I'll implement a simple local debounce or just onKeyDown Enter.
// To be safe, I'll stick to 'Enter' or simple state with delay using setTimeout.

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (items: Item[]) => void;
  excludeIds?: number[]; // IDs to exclude from selection (e.g., current product ID)
  filterSellable?: boolean; // Only show sellable products
  filterPurchable?: boolean; // Only show purchasable products
  /** عند التمرير (>0) تُجلب أصناف المورد فقط */
  filterSupplier?: number;
  /** تصفية حسب نوع المنتج: 'ready' (جاهزة)، 'custom' (تفصيل)، أو 'custom_stock' (مخزون تفصيل) */
  filterProductionType?: "ready" | "custom" | "custom_stock";
}

export function ProductSelectionModal({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
  filterSellable,
  filterPurchable,
  filterSupplier,
  filterProductionType,
}: ProductSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedItems([]);
      setSearch("");
      setDebouncedSearch("");
      setPage(1);
    }
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filterSupplier]);

  const { data, isLoading, isError } = useItems({
    page,
    search: debouncedSearch,
    page_size: 10,
    is_sellable: filterSellable,
    is_purchable: filterPurchable,
    ...(filterSupplier && filterSupplier > 0 ? { supplier: filterSupplier } : {}),
    ...(filterProductionType ? { production_type: filterProductionType } : {}),
  });

  const handleSelect = (item: Item, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, item]);
    } else {
      setSelectedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handleConfirm = () => {
    onSelect(selectedItems);
    setSelectedItems([]); // Reset selection? Or keep it? Usually reset.
    onClose();
  };

  const handleClose = () => {
    setSelectedItems([]);
    onClose();
  };

  const isSelected = (id: number) => selectedItems.some((i) => i.id === id);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className='sm:max-w-[800px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl'>
        {/* Header Section */}
        <div className='p-6 border-b bg-muted/30 flex-none space-y-4'>
          <div className='flex items-center justify-between'>
            <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
              <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                <PackageSearch className='h-5 w-5 text-primary' />
              </div>
              اختيار المنتجات
            </DialogTitle>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleClose}
              className='rounded-full hover:bg-muted'
            >
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='relative'>
            <Search className='absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none' />
            <Input
              placeholder='ابحث عن منتج بالاسم...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pr-10 h-11 text-lg bg-background shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20'
            />
          </div>
        </div>

        {/* Content Section */}
        <div className='flex-1 overflow-y-auto p-4 bg-muted/10'>
          {isLoading ? (
            <div className='h-full flex flex-col items-center justify-center gap-3 text-muted-foreground animate-in fade-in'>
              <Loader2 className='h-10 w-10 animate-spin text-primary' />
              <p>جاري تحميل المنتجات...</p>
            </div>
          ) : isError ? (
            <div className='h-full flex flex-col items-center justify-center gap-2 text-destructive animate-in fade-in'>
              <span className='text-lg font-medium'>حدث خطأ</span>
              <p className='text-sm opacity-80'>
                لا يمكن تحميل قائمة المنتجات حالياً
              </p>
            </div>
          ) : data?.results.length === 0 ? (
            <div className='h-full flex flex-col items-center justify-center gap-4 text-muted-foreground animate-in fade-in'>
              <div className='h-20 w-20 rounded-full bg-muted flex items-center justify-center'>
                <Inbox className='h-10 w-10 opacity-50' />
              </div>
              <p className='text-lg font-medium'>لا توجد منتجات مطابقة للبحث</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 gap-3'>
              {data?.results
                .filter((item) => !excludeIds.includes(item.id))
                .map((item) => {
                  const isItemChecked = isSelected(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item, !isItemChecked)}
                      className={cn(
                        "group relative flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                        isItemChecked
                          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                          : "border-border bg-card hover:border-primary/50 hover:shadow-sm",
                      )}
                    >
                      {/* Selection Indicator */}
                      <div
                        className={cn(
                          "absolute inset-y-0 right-0 w-1 bg-primary transition-opacity duration-200",
                          isItemChecked ? "opacity-100" : "opacity-0",
                        )}
                      />

                      <div className='flex items-center gap-4 flex-1'>
                        <div
                          className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center transition-colors",
                            isItemChecked
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-muted/80",
                          )}
                        >
                          {isItemChecked ? (
                            <Check className='h-6 w-6' />
                          ) : (
                            <Package className='h-6 w-6' />
                          )}
                        </div>

                        <div className='flex flex-col gap-1'>
                          <span className='font-bold text-base text-foreground group-hover:text-primary transition-colors wrap-break-word'>
                            {item.name}
                          </span>
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <span className='bg-muted px-2 py-0.5 rounded-md text-xs font-medium'>
                              {item.default_unit_name}
                            </span>
                            {item.is_sellable && (
                              <span className='text-xs text-success font-medium'>
                                قابل للبيع
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className='text-left pl-4'>
                        <div className='font-bold text-lg text-primary'>
                          {parseFloat(item.unit_price).toLocaleString()}{" "}
                          <span className='text-xs text-muted-foreground font-normal'>
                            ر.س
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className='p-4 border-t bg-background flex flex-col sm:flex-row gap-4 items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className='h-8 w-8'
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
            <span className='text-sm font-medium min-w-[3ch] text-center'>
              {page}
            </span>
            <Button
              variant='outline'
              size='icon'
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.next || isLoading}
              className='h-8 w-8'
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
          </div>

          <div className='flex w-full sm:w-auto gap-3'>
            <Button
              variant='outline'
              onClick={handleClose}
              className='flex-1 sm:flex-none'
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedItems.length === 0}
              className='flex-1 sm:flex-none min-w-[140px] shadow-lg shadow-primary/20'
            >
              {selectedItems.length > 0 ? (
                <>إضافة ({selectedItems.length}) منتجات</>
              ) : (
                "أضف المنتجات"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
