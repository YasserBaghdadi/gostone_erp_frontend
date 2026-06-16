import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, Save, Loader2, User, Mail, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateEmployee, useUpdateEmployee, useEmployeeDetails, usePermissionGroups } from "@/hooks/useEmployees";
import { usePermissionCatalog } from "@/hooks/usePermissions";
import { PermissionCatalogPicker } from "@/components/permissions/PermissionCatalogPicker";
import { toast } from "sonner";
import { parseBackendError } from "@/lib/utils";
import { PhoneInputField, normalizeSaudiPhone } from "@/components/form";

// Update EmployeeFormValues and Schema
const employeeSchema = z.object({
  first_name: z.string().min(2, "الاسم الأول مطلوب"),
  last_name: z.string().min(1, "الاسم الأخير مطلوب"),
  phone: z.string().min(9, "رقم الجوال مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional().or(z.literal("")),
  gender: z.string().min(1, "الجنس مطلوب"),
  is_active: z.boolean().default(true),
  permission_group_ids: z.array(z.number()).default([]),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function CreateEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EmployeeFormValues | null>(null);

  const { data: existingEmployee, isLoading: isLoadingDetails } = useEmployeeDetails(id!);
  const { data: permissionGroups, isLoading: isLoadingGroups } = usePermissionGroups();
  const { data: catalog = [], isLoading: isLoadingCatalog } = usePermissionCatalog();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  // Map between catalog action keys (e.g. "customers.create_individual") and the
  // numeric Group ids the employee form submits as `permission_group_ids`.
  const { nameToId, idToName, catalogIds } = useMemo(() => {
    const nameToId = new Map<string, number>();
    const idToName = new Map<number, string>();
    const catalogIds = new Set<number>();
    const catalogKeys = new Set(
      catalog.flatMap((s) => s.screens.flatMap((sc) => sc.actions.map((a) => a.key))),
    );
    for (const g of permissionGroups ?? []) {
      nameToId.set(g.name, g.id);
      idToName.set(g.id, g.name);
      if (catalogKeys.has(g.name)) catalogIds.add(g.id);
    }
    return { nameToId, idToName, catalogIds };
  }, [permissionGroups, catalog]);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as any,
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      password: "",
      gender: "M",
      is_active: true,
      permission_group_ids: [],
    },
  });

  const selectedGroupIds = useWatch({
    control: form.control,
    name: "permission_group_ids",
    defaultValue: [],
  });

  // Catalog keys currently selected (derived from the chosen group ids).
  const selectedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const gid of selectedGroupIds ?? []) {
      const name = idToName.get(gid);
      if (name) s.add(name);
    }
    return s;
  }, [selectedGroupIds, idToName]);

  // Apply a new set of catalog keys, preserving any non-catalog group ids.
  const handleCatalogChange = (next: Set<string>) => {
    const current = form.getValues("permission_group_ids") || [];
    const preserved = current.filter((gid) => !catalogIds.has(gid));
    const fromKeys = Array.from(next)
      .map((k) => nameToId.get(k))
      .filter((v): v is number => typeof v === "number");
    form.setValue("permission_group_ids", [...new Set([...preserved, ...fromKeys])], {
      shouldDirty: true,
    });
  };

  const lastLoadedIdRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (isEditing && existingEmployee && existingEmployee.id !== lastLoadedIdRef.current) {
      // Map existing employee data to form
      // Map permission groups
      let groupIds: number[] = [];
      if (Array.isArray(existingEmployee.permission_groups)) {
        groupIds = existingEmployee.permission_groups.map((g: any) => g.id);
      } else if (existingEmployee.groups && Array.isArray(existingEmployee.groups)) {
        // Fallback or alternative field
        groupIds = existingEmployee.groups.map((g) => g.id);
      }

      form.reset({
        first_name: existingEmployee.first_name,
        last_name: existingEmployee.last_name,
        phone: existingEmployee.phone || existingEmployee.phone_number || "",
        email: existingEmployee.email || "",
        password: "",
        gender: existingEmployee.gender === "male" || existingEmployee.gender === "M" ? "M" : "F",
        is_active: typeof existingEmployee.is_active === 'string' ? existingEmployee.is_active === 'true' : existingEmployee.is_active,
        permission_group_ids: groupIds,
      });
      lastLoadedIdRef.current = existingEmployee.id;
    }
  }, [isEditing, existingEmployee, form]);

  // Show confirmation before submit
  const handleFormSubmit = (data: EmployeeFormValues) => {
    setPendingFormData(data);
    setIsConfirmOpen(true);
  };

  const onSubmit = async () => {
    if (!pendingFormData) return;
    const data = pendingFormData;
    try {
      const payload: any = { 
          ...data,
          permission_group_ids: data.permission_group_ids
      };
      
      // Cleanup
      if (!payload.password) delete payload.password;
      if (!payload.email) delete payload.email;
      
      // Phone Normalization
      if (payload.phone) {
        payload.phone = normalizeSaudiPhone(payload.phone);
      }

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: id!,
          data: payload,
        });
        toast.success("تم تحديث بيانات الموظف بنجاح");
      } else {
        if (!payload.password) {
            toast.error("كلمة المرور مطلوبة للموظف الجديد");
            return;
        }
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة الموظف بنجاح");
      }
      navigate("/employees");
    } catch (error) {
      const errorMessage = parseBackendError(error);
      toast.error(errorMessage || (isEditing ? "فشل تحديث بيانات الموظف" : "فشل إضافة الموظف"));
    }
    setIsConfirmOpen(false);
    setPendingFormData(null);
  };

  if (isEditing && isLoadingDetails) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-l from-primary/10 via-background to-background p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <User className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {isEditing ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
            </h2>
          </div>
          <p className="text-muted-foreground mr-14">
            {isEditing ? "تعديل معلومات وصلاحيات الموظف" : "إدخال بيانات الموظف الجديد وتحديد صلاحياته"}
          </p>
        </div>
        
        <Link to="/employees">
          <Button variant="outline" className="gap-2 rounded-xl group border-primary/20 hover:border-primary hover:bg-primary/5">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            العودة للقائمة
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
          <div className="grid gap-8">
            {/* Basic Info Card */}
            <Card className="shadow-xl border-none ring-1 ring-border/40 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
              <CardHeader className="bg-muted/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  البيانات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8 grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        الاسم الأول <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            className="pr-10 h-12" 
                            placeholder="أدخل الاسم الأول" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        الاسم الأخير <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            className="pr-10 h-12" 
                            placeholder="أدخل الاسم الأخير" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Gender Field */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        الجنس <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                          <select 
                              className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                          >
                              <option value="M">ذكر</option>
                              <option value="F">أنثى</option>
                          </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        رقم الجوال <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <PhoneInputField
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        البريد الإلكتروني <span className="text-muted-foreground text-sm">(اختياري)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            className="pr-10 h-12" 
                            placeholder="example@email.com" 
                            type="email"
                            dir="ltr"
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                         كلمة المرور {isEditing ? <span className="text-muted-foreground text-sm">(اتركها فارغة إذا لم ترد التغيير)</span> : <span className="text-destructive">*</span>}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                           <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-10 w-10 text-muted-foreground z-10 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Input 
                            className="pr-10 h-12" 
                            placeholder={isEditing ? "********" : "كلمة المرور"}
                            type={showPassword ? "text" : "password"}
                            dir="ltr"
                            {...field} 
                          />
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 
                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3 rounded-lg border p-4 shadow-sm bg-muted/5 mt-1 col-span-2">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="h-5 w-5"
                        />
                        </FormControl>
                        <div className="space-y-0.5">
                        <FormLabel className="text-base cursor-pointer">حالة الموظف (نشط)</FormLabel>
                        <FormDescription>
                            تحديد ما إذا كان الموظف نشطاً في النظام ويمكنه الدخول
                        </FormDescription>
                        </div>
                    </FormItem>
                    )}
                />
              </CardContent>
            </Card>

            {/* Permission Groups Card */}
            <Card className="shadow-lg border-none ring-1 ring-border/40">
              <CardHeader className="bg-muted/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  مجموعات الصلاحيات <span className="text-destructive text-sm">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {isLoadingGroups || isLoadingCatalog ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <PermissionCatalogPicker
                    catalog={catalog}
                    selected={selectedKeys}
                    onChange={handleCatalogChange}
                  />
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                   حدّد الصلاحيات المسموحة للموظف على مستوى كل إجراء.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6">
            <Link to="/employees">
              <Button type="button" variant="outline" size="lg" className="min-w-[120px] rounded-xl">
                إلغاء
              </Button>
            </Link>
            <Button 
              type="submit" 
              size="lg" 
              className="min-w-[160px] rounded-xl gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {isEditing ? "حفظ التعديلات" : "إضافة الموظف"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={onSubmit}
        title={isEditing ? "تأكيد التعديل" : "تأكيد الإضافة"}
        description={isEditing ? "هل أنت متأكد من حفظ التعديلات على بيانات الموظف؟" : "هل أنت متأكد من إضافة هذا الموظف؟"}
        confirmText={isEditing ? "حفظ التعديلات" : "إضافة الموظف"}
        variant={isEditing ? "warning" : "success"}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

