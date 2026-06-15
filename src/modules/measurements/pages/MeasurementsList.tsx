import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateOpportunity } from "@/hooks/useOpportunities";
import { useDimRequests, useUploadDimensions, type DimRequest } from "@/hooks/useMeasurements";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FileUploader } from "@/components/ui/file-uploader";
import { Ruler, FileCheck, MapPin, Phone, Search, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/shared";
import { toast } from "sonner";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { useCan } from "@/hooks/usePermissions";

const measurementSchema = z.object({
  notes: z.string().optional(),
  file: z.any().refine((file) => {
    // Accept File objects
    if (file instanceof File) return true;
    // Also accept FileList or array with files
    if (file?.length > 0) return true;
    return false;
  }, "يرجى إرفاق ملف المقاسات"),
});

type MeasurementFormValues = z.infer<typeof measurementSchema>;

export default function MeasurementsList() {
  const { can } = useCan();
  const navigate = useNavigate();
  const [selectedOpp, setSelectedOpp] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { page, pageSize, setPage, setPageSize } = usePagination();

  const form = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      notes: "",
      file: undefined,
    },
  });

  // Fetch dimension requests
  const { data, isLoading } = useDimRequests({ page, page_size: pageSize });
  
  const dimRequests = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const updateMutation = useUpdateOpportunity();
  const uploadMutation = useUploadDimensions();

  // Filter logic
  const filteredRequests = dimRequests.filter((req: DimRequest) => { // Type explicitly
       if (!searchQuery) return true;
       const searchLower = searchQuery.toLowerCase();
       const customerName = req.customer ? `${req.customer.first_name} ${req.customer.last_name}` : "";
       const phone = req.customer?.phone_number || "";
       const location = req.location || "";
       
       return customerName.toLowerCase().includes(searchLower) || 
              phone.includes(searchLower) || 
              location.toLowerCase().includes(searchLower);
  });


  const onSubmit = (data: MeasurementFormValues) => {
    if (selectedOpp) {
      const request = dimRequests.find((r: DimRequest) => r.id === selectedOpp);
      // DimRequest.id is the opportunity ID since dim requests are fetched for opportunities
      const opportunityId = request?.id;
      
      if (!opportunityId) {
          toast.error("لم يتم العثور على رقم الفرصة لهذه الطلبية");
          return;
      }

      // Handle file - could be File object or array
      let file = data.file;
      if (Array.isArray(file) && file.length > 0) {
        file = file[0]; // Get first file from array
      }
      
      if (!file || !(file instanceof File)) {
        toast.error("يرجى اختيار ملف صالح");
        console.error("Invalid file:", data.file);
        return;
      }

      console.log("Uploading file:", file.name, file.size, file.type);

      // Reset progress
      setUploadProgress(0);
      
      uploadMutation.mutate({
          opportunityId,
          file: file,
          notes: data.notes,
          onProgress: (percent) => setUploadProgress(percent)
      }, {
          onSuccess: () => {
              toast.success("تم رفع المقاسات بنجاح");
              
              // Close dialog and reset state immediately
              setIsDialogOpen(false);
              setUploadProgress(0);
              setSelectedOpp(null);
              form.reset();
          },
          onError: (error: any) => {
              console.error("Upload error:", error);
              toast.error("فشل رفع ملف المقاسات");
          }
      });
    }
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-10" dir="rtl">
        
       {/* Header with Glassmorphism */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-background/60 backdrop-blur-xl p-4 md:p-6 rounded-2xl border shadow-sm sticky top-4 z-10 transition-all">
            <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    طلبات المقاسات
                </h2>
                <p className="text-sm text-muted-foreground">
                    إدارة طلبات الرفع الميداني والمقاسات
                </p>
            </div>
            
            <div className="relative w-full md:w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="بحث عن عميل أو موقع..."
                    className="pr-9 rounded-xl border-muted-foreground/20 bg-background/50 focus:bg-background transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
      </div>


      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
            <div className="col-span-full flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : filteredRequests.length > 0 ? (
          filteredRequests.map((request: DimRequest) => (
            <Card
              key={request.id}
              className="group overflow-hidden border-none ring-1 ring-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b from-card to-muted/20 cursor-pointer"
              onClick={() => {
                const oppId = request.items?.[0]?.opportunity;
                if (oppId) navigate(`/opportunities/${oppId}`);
              }}
            >
              <CardHeader className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                  <div className="space-y-1">
                     <CardTitle className="text-base font-bold text-foreground leading-snug flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary/70" />
                        <span
                          className="break-words"
                          title={
                            request.customer
                              ? formatCustomerWithBalance(request.customer)
                              : ""
                          }
                        >
                            {request.customer
                              ? formatCustomerWithBalance(request.customer)
                              : "عميل غير معروف"}
                        </span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground font-mono opacity-70">#{request.id.toString().slice(0, 8)}</div>
                </div>
                <Badge variant="warning" className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-medium shadow-sm">
                    مطلوب مقاسات
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:p-5 text-right">
                  <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                         <MapPin className="h-4 w-4 text-warning/70" />
                         <span>الموقع</span>
                    </div>
                    <span className="font-medium break-words text-sm" title={request.location}>{request.location || 'غير محدد'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                         <Phone className="h-4 w-4 text-info/70" />
                         <span>الجوال</span>
                    </div>
                    {request.customer?.phone_number ? (
                      <a href={`tel:${request.customer.phone_number}`} className="font-medium font-mono hover:text-primary hover:underline transition-colors" dir="ltr">{request.customer.phone_number}</a>
                    ) : '-'}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                      <Ruler className="h-3.5 w-3.5" />
                      <span>عدد البنود المبدئي: <span className="font-bold text-foreground">{request.items?.length || 0}</span></span>
                  </div>
              </CardContent>

              <CardFooter className="p-3 bg-muted/30 grid grid-cols-2 gap-2">
                   {/* Note: Linking to Opportunity ID, not Request ID, because details page is for Opportunity */}
                   {request.items && request.items.length > 0 && request.items[0].opportunity ? (
                     <Link to={`/opportunities/${request.items[0].opportunity}`} className="col-span-1">
                        <Button variant="outline" className="w-full gap-2 rounded-lg shadow-sm" size="sm">
                            التفاصيل
                        </Button>
                    </Link>
                   ) : (
                       <Button variant="outline" className="col-span-1 w-full gap-2 rounded-lg shadow-sm" size="sm" disabled>
                            التفاصيل
                        </Button>
                   )}
                
                {can("measurements.create") && (
                <Dialog open={isDialogOpen && selectedOpp === request.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (open) {
                        setSelectedOpp(request.id);
                        form.reset();
                    }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full gap-2 rounded-lg"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOpp(request.id);
                      }}
                    >
                        <FileCheck className="h-4 w-4" />
                        إتمام الرفع
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>
                        تسليم المقاسات -{" "}
                        {request.customer
                          ? formatCustomerWithBalance(request.customer)
                          : "عميل غير معروف"}
                      </DialogTitle>
                      <DialogDescription>
                          الرجاء إدخال ملاحظات الرفع الميداني وإرفاق المخطط إن وجد.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>ملاحظات الفني</Label>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="أي تفاصيل إضافية عن المقاسات..." 
                                                className="min-h-[100px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FileUploader
                                control={form.control}
                                name="file"
                                label="إرفاق ملف (صور/مخطط)"
                                description="اضغط للرفع أو اسحب الملفات"
                                accept={{
                                    "image/*": [],
                                    "application/pdf": [".pdf"]
                                }}
                            />

                            {/* Upload Progress Bar */}
                            {uploadMutation.isPending && uploadProgress > 0 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                <span>جاري رفع الملف...</span>
                                <span>{uploadProgress}%</span>
                                </div>
                                <Progress value={uploadProgress} className="h-2" />
                            </div>
                            )}

                            <DialogFooter>
                            <Button 
                                type="submit"
                                className="w-full"
                                disabled={updateMutation.isPending || uploadMutation.isPending}
                            >
                                {updateMutation.isPending || uploadMutation.isPending ? "جاري الحفظ..." : "تأكيد وحفظ"}
                            </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                )}
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] p-6 text-center rounded-2xl border-2 border-dashed border-muted bg-muted/5 animate-in fade-in zoom-in-50 duration-300">
            <div className="bg-muted/20 p-6 rounded-full mb-4">
                <Ruler className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground">لا يوجد طلبات مقاسات</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">
                {searchQuery ? "لا توجد نتائج تطابق بحثك." : "جميع الفرص مكتملة المقاسات أو لا يوجد طلبات جديدة."}
            </p>
          </div>
        )}
      </div>
      
      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        entityName="طلب"
      />

    </div>
  );
}
