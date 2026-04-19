import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LogIn, Lock, Phone, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.svg";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeSaudiPhone } from "@/components/form";
import { parseBackendError } from "@/lib/utils";

const formSchema = z.object({
  phone: z.string().min(9, "رقم الهاتف يجب أن يكون 9 أرقام على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type FormValues = z.infer<typeof formSchema>;

import { useLogin } from "@/hooks/useAuth";
import { toast } from "sonner";

// ... (previous imports)

export default function LoginPage() {
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: FormValues) {
    // Normalize phone using centralized function
    const formattedPhone = normalizeSaudiPhone(values.phone);

    loginMutation.mutate(
      { phone_number: formattedPhone, password: values.password },
      {
        onSuccess: () => {
          toast.success("تم تسجيل الدخول بنجاح");
          navigate("/suppliers", { replace: true });
        },
        onError: (error) => {
          const message = parseBackendError(error);
          toast.error(message || "فشل تسجيل الدخول: تأكد من البيانات المدخلة");
        },
      }
    );
  }


  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden selection:bg-primary/30">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[#f8fafc] z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Brand Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="relative inline-block mb-6 group">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500 scale-110" />
            <img 
              src={logo} 
              alt="Go Stone Logo" 
              className="relative h-28 md:h-36 object-contain drop-shadow-2xl translate-y-0 group-hover:-translate-y-2 transition-transform duration-500" 
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-primary tracking-tight">جو ستون</h1>
            <p className="text-muted-foreground/80 font-medium text-sm">نظام إدارة العمليات والفرص المتكامل</p>
          </div>
        </div>
        
        {/* Login Card */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] bg-white/90 backdrop-blur-xl rounded-[2rem] overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-primary" />
            
            <CardHeader className="space-y-2 pt-10 pb-6 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">مرحباً بك مجدداً</CardTitle>
              <CardDescription className="text-muted-foreground">
                يرجى تسجيل الدخول للوصول إلى لوحة التحكم
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-10">
              <Form {...form}>
                <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(onSubmit)(e); }} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-foreground/80 pr-1">رقم الهاتف</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                              <Phone className="h-5 w-5" />
                            </div>
                            <Input 
                              className="h-12 pr-12 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 focus:bg-white rounded-2xl transition-all shadow-none placeholder:text-muted-foreground/40" 
                              placeholder="05XXXXXXXX" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-sm font-semibold text-foreground/80 pr-1">كلمة المرور</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground group-focus-within:text-primary transition-colors">
                              <Lock className="h-5 w-5" />
                            </div>
                            <Input 
                              className="h-12 pr-12 pl-12 bg-muted/30 border-muted-foreground/10 focus:border-primary/30 focus:bg-white rounded-2xl transition-all shadow-none placeholder:text-muted-foreground/40" 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute left-2 top-1.5 h-9 w-9 p-0 text-muted-foreground hover:bg-transparent hover:text-primary transition-colors"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98] mt-4" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري التحقق...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span>دخول للنظام</span>
                        <LogIn className="h-5 w-5" />
                      </div>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <p className="text-xs font-semibold text-muted-foreground/50 tracking-widest uppercase">
            جميع الحقوق محفوظة © {new Date().getFullYear()} شركة جو ستون
          </p>
        </div>
      </div>
    </div>
  );
}
