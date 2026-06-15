import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentGatewayList } from "../components/PaymentGatewayList";
import { PaymentGatewayDialog } from "../components/PaymentGatewayDialog";
import {
  useBanks,
  useCreateBank,
  useUpdateBank,
  useBNPL,
  useCreateBNPL,
  useUpdateBNPL,
  useCardMachines,
  useCreateCardMachine,
  useUpdateCardMachine,
  useCashRegisters,
  useCreateCashRegister,
  useUpdateCashRegister,
} from "@/hooks/usePaymentGateways";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import { useCan } from "@/hooks/usePermissions";
import type { BasePaymentGateway } from "@/types";

type GatewayType = "banks" | "bnpl" | "card-machines" | "cash-registers";

export default function PaymentGatewaysPage() {
  const { can } = useCan();
  const [activeTab, setActiveTab] = useState<GatewayType>("banks");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BasePaymentGateway | null>(null);

  // Hooks
  const banksQuery = useBanks();
  const bnplQuery = useBNPL();
  const cardMachinesQuery = useCardMachines();
  const cashRegistersQuery = useCashRegisters();

  const createBank = useCreateBank();
  const updateBank = useUpdateBank();
  
  const createBNPL = useCreateBNPL();
  const updateBNPL = useUpdateBNPL();
  
  const createCardMachine = useCreateCardMachine();
  const updateCardMachine = useUpdateCardMachine();
  
  const createCashRegister = useCreateCashRegister();
  const updateCashRegister = useUpdateCashRegister();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: BasePaymentGateway) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = (values: { name: string; notes?: string }) => {
    const payload = values;
    
    let mutation;
    if (activeTab === "banks") {
      mutation = editingItem ? updateBank.mutateAsync({ id: editingItem.id, data: payload }) : createBank.mutateAsync(payload);
    } else if (activeTab === "bnpl") {
       mutation = editingItem ? updateBNPL.mutateAsync({ id: editingItem.id, data: payload }) : createBNPL.mutateAsync(payload);
    } else if (activeTab === "card-machines") {
       mutation = editingItem ? updateCardMachine.mutateAsync({ id: editingItem.id, data: payload }) : createCardMachine.mutateAsync(payload);
    } else {
       mutation = editingItem ? updateCashRegister.mutateAsync({ id: editingItem.id, data: payload }) : createCashRegister.mutateAsync(payload);
    }

    mutation
      .then(() => {
        toast.success(editingItem ? "تم التحديث بنجاح" : "تم الإضافة بنجاح");
        setIsDialogOpen(false);
      })
      .catch((error) => {
        toast.error(parseBackendError(error));
      });
  };

  const getIsLoading = () => {
    if (activeTab === "banks") return createBank.isPending || updateBank.isPending;
    if (activeTab === "bnpl") return createBNPL.isPending || updateBNPL.isPending;
    if (activeTab === "card-machines") return createCardMachine.isPending || updateCardMachine.isPending;
    return createCashRegister.isPending || updateCashRegister.isPending;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            إدارة بوابات الدفع
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            إدارة البنوك، أجهزة الشبكة، الصناديق، وشركات التقسيط
          </p>
        </div>
        {can("payment_gateways.manage") && (
          <Button onClick={handleOpenCreate} className="gap-2 shadow-lg hover:shadow-primary/20 transition-all w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">إضافة جديد</span>
            <span className="sm:hidden">إضافة</span>
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GatewayType)} className="space-y-4" dir="rtl">
        <TabsList className="flex flex-wrap gap-1 w-full lg:w-auto p-1 bg-muted/50 backdrop-blur h-auto">
          <TabsTrigger value="banks" className="flex-1 lg:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 text-xs sm:text-sm">البنوك</TabsTrigger>
          <TabsTrigger value="card-machines" className="flex-1 lg:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 text-xs sm:text-sm">أجهزة الشبكة</TabsTrigger>
          <TabsTrigger value="cash-registers" className="flex-1 lg:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 text-xs sm:text-sm">الصناديق</TabsTrigger>
          <TabsTrigger value="bnpl" className="flex-1 lg:flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300 text-xs sm:text-sm">التقسيط</TabsTrigger>
        </TabsList>

        <Card className="border-border/50 shadow-sm backdrop-blur-sm bg-card/95">
            <CardHeader>
                <CardTitle>
                    {activeTab === "banks" && "قائمة البنوك"}
                    {activeTab === "card-machines" && "قائمة أجهزة الشبكة"}
                    {activeTab === "cash-registers" && "قائمة الصناديق"}
                    {activeTab === "bnpl" && "قائمة شركات التقسيط"}
                </CardTitle>
                <CardDescription>
                    {activeTab === "banks" && "إدارة الحسابات البنكية والأرصدة"}
                    {activeTab === "card-machines" && "إدارة أجهزة نقاط البيع (POS)"}
                    {activeTab === "cash-registers" && "إدارة صناديق الكاش والعهد النقدية"}
                    {activeTab === "bnpl" && "إدارة حسابات تابي وتمارا وغيرها"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TabsContent value="banks" className="m-0">
                    <PaymentGatewayList 
                        data={banksQuery.data?.results || []} 
                        isLoading={banksQuery.isLoading} 
                        onEdit={handleOpenEdit} 
                    />
                </TabsContent>
                <TabsContent value="card-machines" className="m-0">
                    <PaymentGatewayList 
                        data={cardMachinesQuery.data?.results || []} 
                        isLoading={cardMachinesQuery.isLoading} 
                        onEdit={handleOpenEdit} 
                    />
                </TabsContent>
                <TabsContent value="cash-registers" className="m-0">
                    <PaymentGatewayList 
                        data={cashRegistersQuery.data?.results || []} 
                        isLoading={cashRegistersQuery.isLoading} 
                        onEdit={handleOpenEdit} 
                    />
                </TabsContent>
                <TabsContent value="bnpl" className="m-0">
                    <PaymentGatewayList 
                        data={bnplQuery.data?.results || []} 
                        isLoading={bnplQuery.isLoading} 
                        onEdit={handleOpenEdit} 
                    />
                </TabsContent>
            </CardContent>
        </Card>
      </Tabs>

      <PaymentGatewayDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        initialData={editingItem}
        title={editingItem ? "تعديل البيانات" : "إضافة جديد"}
        description={
            activeTab === "banks" ? "أدخل بيانات البنك" :
            activeTab === "card-machines" ? "أدخل بيانات جهاز الشبكة" :
            activeTab === "cash-registers" ? "أدخل بيانات الصندوق" : "أدخل بيانات شركة التقسيط"
        }
        isLoading={getIsLoading()}
      />
    </div>
  );
}
