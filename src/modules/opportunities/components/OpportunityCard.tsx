import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { Calendar, Phone, MapPin, Banknote, ArrowRight, Percent, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types";
import type { Opportunity } from "@/types";
import { cn } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const navigate = useNavigate();
  const isSold = !!opportunity.have_sell_order;
  // Fallback for status if API doesn't return it yet
  const statusKey = opportunity.status || 'new';
  const statusInfo = STATUS_LABELS[statusKey] || STATUS_LABELS['new'];
  
  const customerName = opportunity.customer
    ? formatCustomerWithBalance(opportunity.customer)
    : opportunity.clientName || "عميل غير معروف";

  const customerPhone = opportunity.customer?.phone_number || opportunity.clientPhone || "";

  const totalPrice = parseFloat(opportunity.total_price_after_tax || opportunity.totalPrice?.toString() || "0");
  const createdDate = opportunity.created_at || new Date().toISOString();

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300 group border-border/50 backdrop-blur-sm",
      isSold
        ? "opacity-50 grayscale-[30%] bg-muted/30 hover:opacity-70 hover:shadow-md"
        : "bg-card/50 hover:shadow-lg"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors break-words">
              {customerName}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Phone className="h-3.5 w-3.5" />
              <span dir="ltr">{customerPhone}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge 
              variant={statusInfo.color as any} 
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold shadow-sm"
            >
              {statusInfo.label}
            </Badge>
            {isSold && (
              <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                تم البيع
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 text-sm">
        <div className="grid gap-2.5">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
            <span className="break-words text-xs sm:text-sm">{opportunity.location || "غير محدد"}</span>
          </div>
          
          {opportunity.salesman && (
             <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <span className="text-xs">المبيعات: {opportunity.salesman.first_name} {opportunity.salesman.last_name}</span>
             </div>
          )}
          
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-lg">
            <Calendar className="h-4 w-4 shrink-0 text-primary/70" />
            <span>
              {format(new Date(createdDate), "PPP", { locale: arSA })}
            </span>
          </div>
        </div>

        {totalPrice > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-2">
            <span className="text-muted-foreground font-medium">القيمة التقديرية:</span>
            <div className="flex items-center text-primary font-bold text-lg">
              <Banknote className="h-4 w-4 mr-1" />
              {totalPrice.toLocaleString()} <span className="text-xs mr-1 font-normal text-muted-foreground">ر.س</span>
            </div>
          </div>
        )}

        {(() => {
          const discount = opportunity.dis_percentage || (opportunity as any).discount_percentage || (opportunity as any).discount;
          if (parseFloat(String(discount || "0")) > 0) {
            return (
              <div className="flex flex-wrap gap-2 pt-1 mt-2 border-t border-border/30">
                <Badge variant="outline" className="text-[10px] py-0.5 border-success/30 bg-success-light text-success flex gap-1 items-center font-bold shadow-sm">
                  <Percent className="h-3 w-3" />
                  خصم كلي {discount}%
                </Badge>
              </div>
            );
          }
          return null;
        })()}
      </CardContent>

      <CardFooter className="pt-2 pb-4 px-4 gap-2">
        <Button 
          variant={isSold ? "outline" : "default"}
          className="w-full rounded-xl gap-2 font-semibold shadow-sm hover:shadow-md transition-all" 
          onClick={() => navigate(`/opportunities/${opportunity.id}`)}
        >
          <span>التفاصيل</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
