import { useState } from "react";
import { Search, Loader2, Check } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Account } from "@/types";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: Account) => void;
  selectedId?: number;
}

export function AccountSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedId 
}: AccountSelectionModalProps) {
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useAccounts({
    search,
    page: 1,
    page_size: 50,
  });

  const accounts = data?.results || [];

  const handleSelect = (account: Account) => {
    onSelect(account);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختيار الحساب</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن حساب..."
            className="pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Accounts List */}
        <div className="h-[300px] pr-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا توجد حسابات مطابقة
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelect(account)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-right
                    ${selectedId === account.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      رقم: {account.number}
                    </p>
                  </div>
                  {selectedId === account.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button variant="ghost" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
