import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Loader2, Package, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useItemDetails, useItems } from "@/hooks/useItems";
import { PRODUCTION_TYPE_LABELS } from "@/types";
import { useMemo } from "react";

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: item, isLoading, isError } = useItemDetails(id!);

  // Fetch all items to resolve linked IDs to names
  const { data: allItemsData } = useItems({ page_size: 1000, page: 1 });

  const itemsMap = useMemo(() => {
    const map = new Map<number, string>();
    allItemsData?.results?.forEach(i => map.set(i.id, i.name));
    return map;
  }, [allItemsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-destructive text-lg">فشل تحميل بيانات المنتج</p>
        <Button variant="outline" onClick={() => navigate(-1)}>العودة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {item.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              تفاصيل المنتج #{item.id}
            </p>
          </div>
        </div>
        <Link to={`/items/${id}/edit`}>
          <Button className="rounded-xl shadow-lg shadow-primary/20">
            <Edit className="ml-2 h-4 w-4" />
            تعديل
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              البيانات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">اسم المنتج</span>
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">السعر</span>
              <span className="font-bold text-primary text-lg">
                {parseFloat(item.unit_price).toLocaleString()} ر.س
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">الوحدة الافتراضية</span>
              <Badge variant="outline">{item.default_unit_name}</Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">نوع الإنتاج</span>
              <Badge variant="secondary">
                {PRODUCTION_TYPE_LABELS[item.production_type ?? "ready"]}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">المخزون</span>
              <span className="font-mono font-medium">{item.inventory ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">قابل للبيع</span>
              {item.is_sellable ? (
                <div className="flex items-center gap-1 text-success">
                  <Check className="h-4 w-4" /> نعم
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <X className="h-4 w-4" /> لا
                </div>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">قابل للشراء</span>
              {item.is_purchable ? (
                <div className="flex items-center gap-1 text-success">
                  <Check className="h-4 w-4" /> نعم
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <X className="h-4 w-4" /> لا
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Units */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>الوحدات الإضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {item.unit2_name ? (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">الوحدة الثانية</span>
                <div className="text-left">
                  <span className="font-medium">{item.unit2_name}</span>
                  <span className="text-xs text-muted-foreground block">
                    معامل التحويل: {item.unit2_factor}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">لا توجد وحدة ثانية</p>
            )}

            {item.unit3_name ? (
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">الوحدة الثالثة</span>
                <div className="text-left">
                  <span className="font-medium">{item.unit3_name}</span>
                  <span className="text-xs text-muted-foreground block">
                    معامل التحويل: {item.unit3_factor}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">لا توجد وحدة ثالثة</p>
            )}

            {item.linked_sellable_items && item.linked_sellable_items.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">منتجات مرتبطة للبيع:</p>
                <div className="flex gap-2 flex-wrap">
                  {item.linked_sellable_items.map(linkedId => (
                    <Link key={linkedId} to={`/items/${linkedId}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                        {itemsMap.get(linkedId) || `#${linkedId}`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {item.linked_purchasable_items && item.linked_purchasable_items.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">منتجات مرتبطة للشراء:</p>
                <div className="flex gap-2 flex-wrap">
                  {item.linked_purchasable_items.map(linkedId => (
                    <Link key={linkedId} to={`/items/${linkedId}`}>
                      <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 transition-colors">
                        {itemsMap.get(linkedId) || `#${linkedId}`}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
