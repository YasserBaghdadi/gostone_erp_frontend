import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Save, AlertCircle, UploadCloud, X, FileIcon } from "lucide-react";
import { useCreateJournalEntry, useUploadJournalEntryAttachment } from "@/hooks/useJournalEntries";
import { AccountSelectionModal } from "../components/AccountSelectionModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useCan } from "@/hooks/usePermissions";
import type { Account } from "@/types";

interface JournalItem {
  id: string; // Temp ID for UI
  account: Account | null;
  debit: string;
  credit: string;
  note: string;
}

let journalRowIdSeq = 0;

function createEmptyJournalRow(): JournalItem {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `row-${++journalRowIdSeq}`,
    account: null,
    debit: "",
    credit: "",
    note: "",
  };
}

export default function CreateJournalEntry() {
  const navigate = useNavigate();
  const { can } = useCan();
  const createMutation = useCreateJournalEntry();

  const [items, setItems] = useState<JournalItem[]>(() => [
    createEmptyJournalRow(),
    createEmptyJournalRow(),
  ]);

  const uploadMutation = useUploadJournalEntryAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entryNote, setEntryNote] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const addFiles = (files: FileList | File[]) => {
    setAttachmentFiles(prev => [...prev, ...Array.from(files)]);
  };

  const removeFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Totals
  const totalDebit = items.reduce((sum, item) => sum + parseFloat(item.debit || "0"), 0);
  const totalCredit = items.reduce((sum, item) => sum + parseFloat(item.credit || "0"), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const difference = Math.abs(totalDebit - totalCredit);

  // Add new item row
  const addItem = () => {
    setItems([...items, createEmptyJournalRow()]);
  };

  // Remove item row
  const removeItem = (id: string) => {
    setItems(items => items.filter((item) => item.id !== id));
  };

  // Update item
  const updateItem = <K extends keyof JournalItem>(id: string, field: K, value: JournalItem[K]) => {
    setItems(prev => {
      const newItems = prev.map((item) => 
        item.id === id ? { ...item, [field]: value } : item
      );

      // Auto-add new row if the last item is being modified and has value
      const lastItem = newItems[newItems.length - 1];
      if (lastItem.id === id && value && newItems.length < 50) { // Limit to 50 rows preventing infinite loops
        return [...newItems, createEmptyJournalRow()];
      }
      
      return newItems;
    });
  };

  // Update item amount (atomic update for debit/credit mutual exclusion)
  const updateItemAmount = (id: string, type: 'debit' | 'credit', value: string) => {
    setItems(prev => {
      const newItems = prev.map(item => {
        if (item.id !== id) return item;
        const updates: Partial<JournalItem> = { [type]: value };
        // Clear the other field if value is entered
        if (value && parseFloat(value) > 0) {
          updates[type === 'debit' ? 'credit' : 'debit'] = "";
        }
        return { ...item, ...updates };
      });

      // Auto-add new row if the last item is being modified and has value
      const lastItem = newItems[newItems.length - 1];
      if (lastItem.id === id && value && parseFloat(value) > 0 && newItems.length < 50) {
        return [...newItems, createEmptyJournalRow()];
      }

      return newItems;
    });
  };

  // Open account modal for specific item
  const openAccountModal = (itemId: string) => {
    setActiveItemId(itemId);
    setAccountModalOpen(true);
  };

  // Handle account selection
  const handleAccountSelect = (account: Account) => {
    if (activeItemId) {
      updateItem(activeItemId, "account", account);
    }
  };

  // Validate and show confirmation
  const handlePreSubmit = () => {
    // Filter out completely empty rows (no account and no values)
    const validItems = items.filter(item => {
      const hasAccount = !!item.account;
      const hasValue = (parseFloat(item.debit || "0") > 0) || (parseFloat(item.credit || "0") > 0);
      return hasAccount || hasValue;
    });

    // Validation
    if (validItems.length < 2) {
      toast.error("يجب أن يحتوي القيد على بندين على الأقل");
      return;
    }

    const hasEmptyAccounts = validItems.some((item) => !item.account);
    if (hasEmptyAccounts) {
      toast.error("يجب اختيار حساب لكل بند");
      return;
    }

    const hasNoAmounts = validItems.every((item) => 
      parseFloat(item.debit || "0") === 0 && parseFloat(item.credit || "0") === 0
    );
    if (hasNoAmounts) {
      toast.error("يجب إدخال مبالغ في البنود");
      return;
    }

    // Recalculate balance for valid items only
    const validDebit = validItems.reduce((sum, item) => sum + parseFloat(item.debit || "0"), 0);
    const validCredit = validItems.reduce((sum, item) => sum + parseFloat(item.credit || "0"), 0);
    // Use a small epsilon for float comparison, though exact check might be fine if strings are used
    const isValidBalanced = Math.abs(validDebit - validCredit) < 0.001 && validDebit > 0;

    if (!isValidBalanced) {
      toast.error("القيد غير متوازن - يجب أن يتساوى المدين والدائن");
      return;
    }

    setIsConfirmOpen(true);
  };

  // Submit
  const handleSubmit = () => {
    // Filter out completely empty rows
    const validItems = items.filter(item => {
      const hasAccount = !!item.account;
      const hasValue = (parseFloat(item.debit || "0") > 0) || (parseFloat(item.credit || "0") > 0);
      return hasAccount || hasValue;
    });

    // Validation
    if (validItems.length < 2) {
      toast.error("يجب أن يحتوي القيد على بندين على الأقل");
      return;
    }

    const hasEmptyAccounts = validItems.some((item) => !item.account);
    if (hasEmptyAccounts) {
      toast.error("يجب اختيار حساب لكل بند");
      return;
    }

    const hasNoAmounts = validItems.every((item) => 
      parseFloat(item.debit || "0") === 0 && parseFloat(item.credit || "0") === 0
    );
    if (hasNoAmounts) {
      toast.error("يجب إدخال مبالغ في البنود");
      return;
    }

    // Double check balance incase items changed (unlikely here but safe)
    const validDebit = validItems.reduce((sum, item) => sum + parseFloat(item.debit || "0"), 0);
    const validCredit = validItems.reduce((sum, item) => sum + parseFloat(item.credit || "0"), 0);
    if (Math.abs(validDebit - validCredit) >= 0.001 || validDebit <= 0) {
       toast.error("القيد غير متوازن");
       return;
    }

    // Transform to expected payload structure
    // Note: The previous code had a different structure (items array). 
    // I need to match the backend expectation. 
    // Looking at the previous code: it constructed `payload` with `items` map.
    // Ensure the mutation expects this structure. 
    
    // Assuming backend expects:
    /*
      {
        date: ...,
        description: ...,
        entries: [ ... ]
      }
    */
    // Wait, the previous code (lines 160-166) showed:
    /*
      const payload = {
        items: items.map(...)
      }
    */
    // But my previous thought on `createMutation.mutate` in the replaced block had:
    /*
      createMutation.mutate({
        date: ...,
        entries: ...
      })
    */
    // I should stick to what was there in the file if I'm not sure, OR improve it if I know the API.
    // The previous file content showed:
    /*
    const payload = {
      items: items.map((item) => ({
        account: item.account!.id,
        debit: item.debit || "0",
        credit: item.credit || "0",
      })),
    };
    createMutation.mutate(payload, ...);
    */
    // So I should stick to `items` key and this structure unless I know otherwise.
    
    const payload = {
      ...(entryNote.trim() ? { note: entryNote.trim() } : {}),
      items: validItems.map((item) => ({
        account: item.account!.id,
        debit: item.debit || "0",
        credit: item.credit || "0",
        ...(item.note.trim() ? { note: item.note.trim() } : {}),
      })),
    };

    createMutation.mutate(payload, {
      onSuccess: async (created) => {
        if (attachmentFiles.length > 0) {
          const uploads = attachmentFiles.map(file =>
            uploadMutation.mutateAsync({ id: created.id, file }).catch(() => {
              toast.error(`فشل رفع "${file.name}"`);
            }),
          );
          await Promise.allSettled(uploads);
        }
        toast.success("تم إنشاء القيد بنجاح");
        navigate("/journal-entries");
      },
      onError: (error) => {
        toast.error(parseBackendError(error));
      },
    });
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            قيد جديد
          </h1>
          <p className="text-muted-foreground mt-1">إضافة سند قيد محاسبي</p>
        </div>
      </div>

      {/* Balance Indicator */}
      <Card className={`border-2 ${isBalanced ? 'border-success bg-success-light' : 'border-warning bg-warning-light'}`}>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isBalanced ? (
                <Badge className="bg-success text-success-foreground px-3 py-1">✓ متوازن</Badge>
              ) : (
                <Badge className="bg-warning text-warning-foreground px-3 py-1">
                  <AlertCircle className="h-4 w-4 ml-1" />
                  غير متوازن
                </Badge>
              )}
              {!isBalanced && difference > 0 && (
                <span className="text-sm text-warning-dark">
                  الفرق: <span className="font-mono font-bold">{difference.toLocaleString()}</span>
                </span>
              )}
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">إجمالي المدين: </span>
                <span className="font-mono font-bold text-success">{totalDebit.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">إجمالي الدائن: </span>
                <span className="font-mono font-bold text-destructive">{totalCredit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>بنود القيد</CardTitle>
              <CardDescription>يجب أن يتساوى إجمالي المدين مع إجمالي الدائن</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addItem} className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة بند
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border bg-muted/20 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* Row number */}
                <div className="md:col-span-1 flex items-center justify-center">
                  <Badge variant="secondary" className="rounded-full w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                </div>

                {/* Account Selection */}
                <div className="md:col-span-5">
                  <label className="text-sm text-muted-foreground mb-1 block">الحساب</label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start h-10"
                    onClick={() => openAccountModal(item.id)}
                  >
                    {item.account ? (
                      <span className="truncate">
                        {item.account.name} <span className="text-muted-foreground">({item.account.number})</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">اختر الحساب...</span>
                    )}
                  </Button>
                </div>

                {/* Debit */}
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">مدين</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.debit}
                    onChange={(e) => updateItemAmount(item.id, "debit", e.target.value)}
                    className="font-mono"
                    disabled={!!item.credit && parseFloat(item.credit) > 0}
                  />
                </div>

                {/* Credit */}
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">دائن</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={item.credit}
                    onChange={(e) => updateItemAmount(item.id, "credit", e.target.value)}
                    className="font-mono"
                    disabled={!!item.debit && parseFloat(item.debit) > 0}
                  />
                </div>

                {/* Delete */}
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Item Note */}
              <div className="md:mr-[calc(100%/12)]">
                <Input
                  placeholder="ملاحظة على البند (اختياري)"
                  value={item.note}
                  onChange={(e) => updateItem(item.id, "note", e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Entry Note */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>ملاحظات القيد</CardTitle>
          <CardDescription>ملاحظات عامة على سند القيد (اختياري)</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="أدخل ملاحظات القيد..."
            value={entryNote}
            onChange={(e) => setEntryNote(e.target.value)}
            className="min-h-[80px] resize-y"
          />
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>المرفقات</CardTitle>
          <CardDescription>إرفاق ملفات بسند القيد (اختياري)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachmentFiles.length > 0 && (
            <div className="space-y-2">
              {attachmentFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="bg-primary/10 p-2 rounded-md text-primary shrink-0">
                    <FileIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              const input = e.target;
              if (input.files && input.files.length > 0) {
                addFiles(input.files);
              }
              requestAnimationFrame(() => { input.value = ""; });
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">اضغط أو اسحب ملفات لإرفاقها</p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {can("journal_entries.create") && (
        <Button
          onClick={handlePreSubmit}
          disabled={!isBalanced || createMutation.isPending}
          className="w-full h-12 text-lg rounded-xl shadow-lg shadow-primary/20"
        >
          {createMutation.isPending && <Loader2 className="ml-2 h-5 w-5 animate-spin" />}
          <Save className="ml-2 h-5 w-5" />
          حفظ القيد
        </Button>
      )}

      {/* Account Selection Modal */}
      <AccountSelectionModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSelect={handleAccountSelect}
        selectedId={activeItemId ? items.find(i => i.id === activeItemId)?.account?.id : undefined}
      />
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="تأكيد إنشاء القيد"
        description="هل أنت متأكد من حفظ هذا القيد المحاسبي؟"
        confirmText="حفظ القيد"
        variant="success"
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
