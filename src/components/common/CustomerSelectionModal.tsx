import { useState, useEffect } from "react";
import { Search, Loader2, Check, UserPlus } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { Pagination } from "@/components/shared/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types";
import { customerAccentColor } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  selectedId?: number;
  onAddNew?: () => void;
}

export function CustomerSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedId,
  onAddNew
}: CustomerSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);
  
  const { data, isLoading } = useCustomers({
    search,
    page,
    page_size: PAGE_SIZE,
  });

  const customers = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختيار العميل</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم العميل أو رقم الهاتف..."
            className="pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Customers List */}
        <div className="h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
              <p>لا يوجد عملاء مطابقين للبحث "{search}"</p>
              {onAddNew && (
                <Button variant="outline" size="sm" onClick={() => { onClose(); onAddNew(); }}>
                  <UserPlus className="ml-2 h-4 w-4" />
                  إضافة عميل جديد
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelect(customer)}
                  className={`flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border p-3 text-right transition-colors
                    ${selectedId === customer.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <div
                    className="h-10 w-1.5 shrink-0 rounded-full self-center"
                    style={{
                      backgroundColor: customerAccentColor(customer.color),
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {formatCustomerWithBalance(customer)}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                      {customer.phone_number}
                    </p>
                  </div>
                  {selectedId === customer.id && (
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalCount > 0 && (
          <div className="[&_nav]:border-t-0 [&_nav]:mt-2 [&_nav]:pt-0 px-1">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              isLoading={isLoading}
              entityName="عميل"
            />
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
          {onAddNew && (
            <Button variant="default" size="sm" onClick={() => { onClose(); onAddNew(); }}>
              <UserPlus className="ml-2 h-4 w-4" />
              عميل جديد
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
