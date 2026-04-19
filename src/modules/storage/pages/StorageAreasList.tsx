import { useState } from "react";
import { Plus, Search, Loader2, Package, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStorageAreas, useDeleteStorageArea } from "@/hooks/useStorageAreas";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { ServerErrorPage, isServerError } from "@/components/common/ServerErrorPage";
import { StorageAreaDialog } from "../components/StorageAreaDialog";
import type { StorageArea } from "@/types";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { parseBackendError } from "@/lib/utils";

export default function StorageAreasList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStorageArea, setSelectedStorageArea] = useState<StorageArea | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch } = useStorageAreas({
    search: searchTerm,
    page,
    page_size: pageSize,
  });

  const deleteMutation = useDeleteStorageArea();

  const handleCreate = () => {
    setSelectedStorageArea(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (area: StorageArea) => {
    setSelectedStorageArea(area);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          deleteMutation.mutate(deleteId, {
              onSuccess: () => {
                  toast.success("تم حذف المخزن بنجاح");
                  setDeleteId(null);
              },
              onError: (err) => {
                  toast.error(parseBackendError(err) || "فشل حذف المخزن");
              }
          });
      }
  };

  const storageAreas = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isError && isServerError(error)) {
    return <ServerErrorPage onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card/50 p-6 rounded-3xl border border-white/10 backdrop-blur-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة المخازن
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            قائمة بجميع المخازن المتاحة في النظام
          </p>
        </div>
        <Button size="lg" onClick={handleCreate} className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
          <Plus className="ml-2 h-5 w-5" />
          مخزن جديد
        </Button>
      </div>

      <div className="bg-card p-4 rounded-2xl border shadow-sm space-y-4">
        <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم المخزن..."
              value={searchTerm}
              onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
              }}
              className="pr-9 h-11 bg-background/50 border-transparent hover:border-border focus:border-primary transition-colors max-w-sm"
            />
        </div>

        {/* Mobile View (Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground min-h-[200px]">
                    <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p>جاري تحميل المخازن...</p>
                </div>
            ) : isError ? (
                <div className="text-center p-8 text-destructive border rounded-xl bg-destructive/5">
                    فشل تحميل البيانات
                </div>
            ) : storageAreas.length === 0 ? (
                <div className="text-center p-12 bg-muted/20 rounded-xl border border-dashed">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">لا يوجد مخازن</p>
                </div>
            ) : (
                storageAreas.map((area) => (
                    <div
                      key={area.id}
                      className="bg-card border rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex items-center justify-between group cursor-pointer"
                      onClick={() => handleEdit(area)}
                      title="فتح تفاصيل المخزن"
                    >
                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
                                <Package className="h-5 w-5" />
                             </div>
                             <div className="space-y-1">
                                 <h3 className="font-bold text-lg text-foreground leading-none">{area.name}</h3>
                                 <p className="text-xs text-muted-foreground font-mono">#{area.id}</p>
                             </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary rounded-lg"
                              onClick={() => handleEdit(area)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                              onClick={() => handleDelete(area.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="hidden lg:block rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50px] text-right">#</TableHead>
                <TableHead className="text-right">اسم المخزن</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">جاري التحميل...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                  <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-destructive">
                      فشل تحميل البيانات
                  </TableCell>
                </TableRow>
              ) : storageAreas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>لا يوجد مخازن مطابقة للبحث</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                storageAreas.map((area) => (
                  <TableRow
                    key={area.id}
                    className="group hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleEdit(area)}
                    title="فتح تفاصيل المخزن"
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground text-right">
                      {area.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {area.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleEdit(area)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-8 w-8 text-muted-foreground hover:text-destructive"
                           onClick={() => handleDelete(area.id)}
                         >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          entityName="مخزن"
        />
      </div>

      <StorageAreaDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        storageArea={selectedStorageArea} 
      />

       <ConfirmModal
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={confirmDelete}
            title="حذف المخزن"
            description="هل أنت متأكد أنك تريد حذف هذا المخزن؟ لا يمكن التراجع عن هذا الإجراء."
            variant="destructive"
            confirmText="حذف"
        />
    </div>
  );
}
