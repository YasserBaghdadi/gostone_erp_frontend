import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, Save, Camera, ShieldCheck, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useUser, useUpdateProfile, useChangePassword } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";

const profileSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name: z.string().min(2, "الاسم الأخير مطلوب"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  new_password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.new_password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useUser();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirmPassword: "",
    },
  });

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data, {
        onSuccess: () => {
             toast.success("تم تحديث الملف الشخصي بنجاح");
        },
        onError: (error) => {
             toast.error("حدث خطأ أثناء تحديث الملف الشخصي");
             console.error(error);
        }
    });
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    changePasswordMutation.mutate({
        current_password: data.current_password,
        new_password: data.new_password
    }, {
        onSuccess: () => {
            toast.success("تم تغيير كلمة المرور بنجاح");
            passwordForm.reset();
        },
        onError: (error) => {
             toast.error("فشل تغيير كلمة المرور. تأكد من كلمة المرور الحالية.");
             console.error(error);
        }
    });
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isError || !user) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <h2 className="text-2xl font-bold tracking-tight">حدث خطأ</h2>
            <p className="text-muted-foreground">لم نتمكن من تحميل بيانات الملف الشخصي.</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
     );
  }

  // Fallback Logic for Display Name
  const displayName = user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user.username || "مستخدم";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-12" dir="rtl">
        {/* Cover & Profile Header */}
        <div className="relative mb-20 md:mb-24">
            {/* Cover Image Placeholder */}
            <div className="h-48 md:h-64 rounded-3xl bg-gradient-to-r from-primary/80 to-primary overflow-hidden relative shadow-md">
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Profile Info Overlay */}
            <div className="absolute -bottom-16 md:-bottom-20 right-8 md:right-12 flex items-end gap-6">
                <div className="relative group cursor-pointer inline-block">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-[6px] border-background shadow-2xl rounded-full">
                        <AvatarImage src={user.avatar} className="object-cover" />
                        <AvatarFallback className="text-4xl bg-muted">
                             {user.first_name && user.last_name 
                                  ? `${user.first_name[0]} ${user.last_name[0]}`
                                  : user.username?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                     <div className="absolute bottom-2 left-2 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera className="h-5 w-5" />
                    </div>
                </div>
                <div className="mb-4 space-y-1 hidden md:block">
                     <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">{displayName}</h1>
                     <Badge variant="secondary" className="bg-white/90 text-primary hover:bg-white backdrop-blur-md shadow-sm">
                        {user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
                    </Badge>
                </div>
            </div>
      </div>
      
       {/* Mobile Name Display */}
      <div className="md:hidden px-4 mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <Badge variant="outline" className="mt-2 border-primary/20 text-primary bg-primary/5">
                {user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
            </Badge>
      </div>

      <div className="grid gap-8 md:grid-cols-3 px-1">
        {/* Sidebar Info */}
        <div className="space-y-6">
             <Card className="shadow-sm border-none ring-1 ring-border/50">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        معلومات الحساب
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="p-2 bg-background rounded-full shadow-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5" dir="ltr">
                             <span className="text-xs text-muted-foreground block text-right">اسم المستخدم</span>
                             <p className="text-sm font-medium text-right">{user.username}</p>
                        </div>
                    </div>
                    {user.email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <div className="p-2 bg-background rounded-full shadow-sm">
                                <span className="h-4 w-4 text-muted-foreground font-bold text-xs flex items-center justify-center">@</span>
                            </div>
                            <div className="space-y-0.5 overflow-hidden w-full">
                                <span className="text-xs text-muted-foreground">البريد الإلكتروني</span>
                                <p className="text-sm font-medium truncate" title={user.email}>{user.email}</p>
                            </div>
                        </div>
                    )}
                     <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="p-2 bg-background rounded-full shadow-sm">
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                             <span className="text-xs text-muted-foreground">حالة الحساب</span>
                             <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                                <span className="text-sm font-medium text-success">نشط</span>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Forms Section */}
        <div className="md:col-span-2 space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-5 w-5 text-primary" />
                      البيانات الشخصية
                  </CardTitle>
                  <CardDescription>تحديث معلومات حسابك الشخصية</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                             <FormField
                              control={profileForm.control}
                              name="first_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الاسم الأول</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="bg-background/50" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={profileForm.control}
                              name="last_name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>الاسم الأخير</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="bg-background/50" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                        </div>
                        <div className="flex justify-end">
                             <Button 
                                type="submit" 
                                className="gap-2 shadow-lg shadow-primary/20"
                                disabled={updateProfileMutation.isPending}
                             >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                حفظ التغييرات
                             </Button>
                        </div>
                    </form>
                  </Form>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-none ring-1 ring-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <CardTitle className="flex items-center gap-2 text-xl">
                      <Lock className="h-5 w-5 text-primary" />
                      تغيير كلمة المرور
                  </CardTitle>
                  <CardDescription>تأمين حسابك بكلمة مرور قوية</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                   <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                          <FormField
                              control={passwordForm.control}
                              name="current_password"
                              render={({ field }) => (
                                  <FormItem>
                                      <FormLabel>كلمة المرور الحالية</FormLabel>
                                      <FormControl>
                                          <Input type="password" {...field} className="bg-background/50" />
                                      </FormControl>
                                      <FormMessage />
                                  </FormItem>
                              )}
                          />
                          <Separator className="opacity-50" />
                          <div className="grid gap-6 md:grid-cols-2">
                              <FormField
                                  control={passwordForm.control}
                                  name="new_password"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>كلمة المرور الجديدة</FormLabel>
                                          <FormControl>
                                              <Input type="password" {...field} className="bg-background/50" />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={passwordForm.control}
                                  name="confirmPassword"
                                  render={({ field }) => (
                                      <FormItem>
                                          <FormLabel>تأكيد كلمة المرور</FormLabel>
                                          <FormControl>
                                              <Input type="password" {...field} className="bg-background/50" />
                                          </FormControl>
                                          <FormMessage />
                                      </FormItem>
                                  )}
                              />
                          </div>
                          <div className="flex justify-end">
                               <Button 
                                    type="submit" 
                                    variant="secondary" 
                                    className="gap-2"
                                    disabled={changePasswordMutation.isPending}
                                >
                                  {changePasswordMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                      <KeyRound className="h-4 w-4" />
                                  )}
                                  تحديث كلمة المرور
                              </Button>
                          </div>
                      </form>
                  </Form>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
