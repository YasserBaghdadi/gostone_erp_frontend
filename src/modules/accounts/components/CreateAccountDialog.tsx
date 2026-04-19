
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { useAllAccounts, useCreateAccount, useNextAccountNumber } from "@/hooks/useAccounts";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  number: z.string().min(1, "رقم الحساب مطلوب"),
  parent: z.string().optional(), // Select value is string, will convert to number
  note: z.string().optional(),
});

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAccountDialog({ open, onOpenChange }: CreateAccountDialogProps) {
  const [parentId, setParentId] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const { data: allAccounts } = useAllAccounts();
  const sortedParentAccounts = useMemo(() => {
    if (!allAccounts) return [];
    return [...allAccounts].sort((a, b) => a.number.localeCompare(b.number));
  }, [allAccounts]);
  
  // Fetch next number suggestion when parent changes
  const { data: nextNumberData, isLoading: isLoadingNextNumber } = useNextAccountNumber(parentId);

  const { mutate: createAccount, isPending } = useCreateAccount();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      number: "",
      note: "",
      parent: undefined,
    },
  });

  // Update number when suggestion arrives
  useEffect(() => {
    if (nextNumberData?.next_number) {
      form.setValue("number", nextNumberData.next_number);
    }
  }, [nextNumberData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createAccount(
      {
        name: values.name,
        number: values.number,
        note: values.note,
        parent: values.parent ? parseInt(values.parent) : null,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          setParentId(null);
        },
      }
    );
  };

  const handleParentChange = (value: string) => {
      form.setValue("parent", value);
      setParentId(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حساب جديد</DialogTitle>
          <DialogDescription>
            قم بإدخال تفاصيل الحساب الجديد أدناه.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Parent Account */}
            <FormField
              control={form.control}
              name="parent"
              render={({ field }) => {
                const selectedAccount = sortedParentAccounts.find(a => a.id.toString() === field.value);
                
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>الحساب الرئيسي (اختياري)</FormLabel>
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={isPopoverOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value === "0" ? "-- بدون حساب رئيسي --" :
                             selectedAccount
                              ? `${selectedAccount.number} - ${selectedAccount.name || "بدون اسم"}`
                              : "اختر الحساب الرئيسي"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="end" sideOffset={4} style={{ width: "var(--radix-popover-trigger-width)" }}>
                        <Command>
                          <CommandInput placeholder="ابحث برقم أو اسم الحساب..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>لم يتم العثور على حساب.</CommandEmpty>
                            <CommandGroup className="max-h-[250px] overflow-auto">
                              <CommandItem
                                value="-- بدون حساب رئيسي --"
                                onSelect={() => {
                                  handleParentChange("0");
                                  setIsPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === "0" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                -- بدون حساب رئيسي --
                              </CommandItem>
                              {sortedParentAccounts.map((account) => (
                                <CommandItem
                                  key={account.id}
                                  value={`${account.number} ${account.name || ""}`}
                                  onSelect={() => {
                                    handleParentChange(account.id.toString());
                                    setIsPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === account.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {account.number} - {account.name || "بدون اسم"}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Account Number */}
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الحساب</FormLabel>
                  <div className="relative">
                    <FormControl>
                        <Input {...field} placeholder="000" />
                    </FormControl>
                    {isLoadingNextNumber && (
                        <div className="absolute left-2 top-2.5">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم الحساب</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="مثال: الصندوق" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="ملاحظات إضافية..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
