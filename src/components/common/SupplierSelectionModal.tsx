import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ChevronLeft, ChevronRight, X, User, Check, Building2, Phone } from "lucide-react";
import { useSuppliers } from "@/hooks/useSuppliers";
import type { Supplier } from "@/types";
import { formatSupplierWithBalance } from "@/lib/partyDisplay";

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (supplier: Supplier) => void;
  selectedId?: number;
}

export function SupplierSelectionModal({ isOpen, onClose, onSelect, selectedId }: SupplierSelectionModalProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); 
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useSuppliers({
    page,
    search: debouncedSearch,
    page_size: 10,
  });

  const suppliers = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const handleSelect = (supplier: Supplier) => {
    onSelect(supplier);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl" dir="rtl">
        
        {/* Header Section */}
        <div className="p-6 border-b bg-muted/30 flex-none space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              اختيار المورد
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none" />
                <Input
                placeholder="ابحث باسم المورد أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10 h-11 text-lg bg-background shadow-sm border-muted-foreground/20 focus-visible:ring-primary/20 rounded-xl"
                />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/5">
            {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p>جاري تحميل الموردين...</p>
                </div>
            ) : isError ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-destructive">
                    <p className="font-bold">فشل تحميل الموردين</p>
                    <Button variant="ghost" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
                </div>
            ) : suppliers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground grayscale transition-all">
                    <User className="h-16 w-16 opacity-20" />
                    <p className="text-lg">لم يتم العثور على موردين</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-2">
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            onClick={() => handleSelect(supplier)}
                            className={`
                                flex items-center justify-between p-4 cursor-pointer rounded-2xl transition-all duration-200 group
                                ${selectedId === supplier.id 
                                    ? "bg-primary text-primary-foreground shadow-md" 
                                    : "bg-background hover:bg-primary/5 border border-border/50 hover:border-primary/20"}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${selectedId === supplier.id ? "bg-white/20" : "bg-muted group-hover:bg-primary/10"}`}>
                                    <Building2 className={`h-6 w-6 ${selectedId === supplier.id ? "text-white" : "text-primary/70"}`} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-base leading-none italic">
                                      {formatSupplierWithBalance(supplier)}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs opacity-80">
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {supplier.phone_number}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {supplier.contact_name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {selectedId === supplier.id && (
                                <div className="bg-white/20 p-2 rounded-full">
                                    <Check className="h-5 w-5" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Footer / Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between flex-none">
                <span className="text-xs text-muted-foreground font-medium">
                    صفحة {page} من {totalPages}
                </span>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => p - 1)}
                        className="rounded-lg h-9 px-4"
                    >
                        <ChevronRight className="h-4 w-4 ml-1" />
                        السابق
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={page >= totalPages} 
                        onClick={() => setPage(p => p + 1)}
                        className="rounded-lg h-9 px-4"
                    >
                        التالي
                        <ChevronLeft className="h-4 w-4 mr-1" />
                    </Button>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
