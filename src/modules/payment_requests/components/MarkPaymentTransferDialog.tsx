import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAllAccounts } from "@/hooks/useAccounts";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import type { Account } from "@/types";
import { cn } from "@/lib/utils";

type MarkPaymentTransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sourceAccountId: number) => void;
  isSubmitting: boolean;
};

function sortAccountsByName(accounts: Account[]) {
  return [...accounts].sort((a, b) =>
    a.name.localeCompare(b.name, "ar", { sensitivity: "base" }),
  );
}

export function MarkPaymentTransferDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
}: MarkPaymentTransferDialogProps) {
  const [accountId, setAccountId] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const { data: accounts, isLoading, isError } = useAllAccounts();

  const sorted = useMemo(
    () => sortAccountsByName(accounts ?? []),
    [accounts],
  );

  const selectedAccount = useMemo(
    () => sorted.find((a) => String(a.id) === accountId),
    [sorted, accountId],
  );

  useEffect(() => {
    if (!open) {
      setAccountId("");
      setComboOpen(false);
    }
  }, [open]);

  const handleConfirm = () => {
    const n = parseInt(accountId, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onConfirm(n);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' dir='rtl'>
        <DialogHeader>
          <DialogTitle>تأكيد تم التحويل</DialogTitle>
          <DialogDescription>
            اختر حساب المصدر (الحساب الذي تم السحب منه) لإرساله في الطلب إلى الخادم.
            يمكنك البحث بالاسم أو برقم الحساب.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3 py-1'>
          {isLoading ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : isError ? (
            <p className='text-sm text-destructive text-center py-4'>
              تعذر تحميل قائمة الحسابات. حاول مرة أخرى أو أعد فتح النافذة.
            </p>
          ) : sorted.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-4'>
              لا توجد حسابات متاحة.
            </p>
          ) : (
            <div className='space-y-2'>
              <Label htmlFor='mark-transfer-account-trigger'>حساب المصدر</Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id='mark-transfer-account-trigger'
                    variant='outline'
                    role='combobox'
                    aria-expanded={comboOpen}
                    className='w-full justify-between font-normal h-11 rounded-xl'
                  >
                    <span className='truncate text-right'>
                      {selectedAccount
                        ? `${selectedAccount.name} (${selectedAccount.number})`
                        : "اختر الحساب"}
                    </span>
                    <ChevronsUpDown className='mr-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className='w-(--radix-popover-trigger-width) p-0'
                  align='start'
                  dir='rtl'
                >
                  <Command>
                    <CommandInput
                      placeholder='بحث بالاسم أو رقم الحساب...'
                      className='h-11'
                    />
                    <CommandList className='max-h-64'>
                      <CommandEmpty>لا يوجد حساب يطابق البحث.</CommandEmpty>
                      <CommandGroup>
                        {sorted.map((a) => (
                          <CommandItem
                            key={a.id}
                            value={`${a.name} ${a.number}`}
                            keywords={[
                              a.name,
                              a.number,
                              a.number.replace(/\s/g, ""),
                            ]}
                            onSelect={() => {
                              setAccountId(String(a.id));
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                accountId === String(a.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className='flex-1 truncate text-right'>
                              {a.name}
                            </span>
                            <span
                              className='font-mono text-xs text-muted-foreground shrink-0'
                              dir='ltr'
                            >
                              {a.number}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        <DialogFooter className='flex-col-reverse sm:flex-row gap-2 sm:justify-start'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type='button'
            className='bg-success text-white hover:bg-success/90'
            disabled={
              !accountId ||
              isSubmitting ||
              isLoading ||
              isError ||
              sorted.length === 0
            }
            onClick={handleConfirm}
          >
            {isSubmitting ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : null}
            تأكيد التحويل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
