import { FileQuestion, Home, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6 animate-in fade-in zoom-in-50 duration-300" dir="rtl">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative">
          <span className="text-[120px] sm:text-[160px] font-black text-primary/10 select-none leading-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary/10 p-4 rounded-full border border-primary/20">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          الصفحة غير موجودة
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى رابط آخر.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
        <Link to="/">
          <Button className="gap-2 rounded-xl min-w-[160px]">
            <Home className="h-4 w-4" />
            الصفحة الرئيسية
          </Button>
        </Link>
        <Button 
          variant="outline" 
          className="gap-2 rounded-xl min-w-[160px]"
          onClick={() => window.history.back()}
        >
          <ArrowRight className="h-4 w-4" />
          العودة للخلف
        </Button>
      </div>
    </div>
  );
}
