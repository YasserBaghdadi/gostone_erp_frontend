import { Link, useNavigate } from "react-router-dom";
import { Plus, Phone, Mail, Calendar, Shield, Users, BadgeCheck, XCircle } from "lucide-react";
import { useEmployeeList } from "@/hooks/useEmployees";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Pagination, SearchBar, LoadingState, EmptyState } from "@/components/shared";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { PERMISSION_GROUP_LABELS } from "@/types";

export default function EmployeesList() {
  const navigate = useNavigate();
  
  // Use custom hooks for pagination and search
  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const { searchTerm: searchQuery, debouncedTerm, setSearchTerm: setSearchQuery } = useSearch({ debounceMs: 300 });

  const { data, isLoading, isError } = useEmployeeList({ page, page_size: pageSize, search: debouncedTerm });

  const employees = data?.results || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPage();
  };

  if (isLoading) {
    return <LoadingState message="جاري تحميل بيانات الموظفين..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 md:pb-10" dir="rtl">
      <PageHeader
        title="الموظفين"
        subtitle="إدارة بيانات الموظفين وصلاحياتهم"
        icon={<Users className="w-7 h-7" />}
        sticky
        action={
          <Link to="/employees/new">
            <Button className="rounded-xl shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">موظف جديد</span>
            </Button>
          </Link>
        }
      >
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="بحث بالاسم أو الهاتف..."
          className="w-full md:w-64"
        />
      </PageHeader>

      {isError ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-destructive">
          <p>فشل تحميل البيانات</p>
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد موظفين"
          description={searchQuery ? "لم يتم العثور على موظفين تطابق بحثك." : "لم يتم إضافة موظفين حالياً."}
          action={
            !searchQuery && (
              <Link to="/employees/new">
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة موظف جديد
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <Card 
              key={employee.id} 
              className="group overflow-hidden border-none ring-1 ring-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-gradient-to-b from-card to-muted/20"
            >
              <CardHeader className="p-4 md:p-5 flex flex-row items-center justify-between space-y-0 pb-2 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${
                    employee.is_active 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                  </div>
                  <div className="space-y-0.5">
                    <CardTitle className="text-base font-bold text-foreground leading-snug">
                      {employee.first_name} {employee.last_name}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground font-mono opacity-70">#{employee.id}</div>
                  </div>
                </div>
                <Badge variant={employee.is_active ? "default" : "destructive"} className="shrink-0 text-[10px] px-2.5 py-1 rounded-lg font-medium shadow-sm">
                  {employee.is_active ? (
                    <><BadgeCheck className="h-3 w-3 ml-1" /> نشط</>
                  ) : (
                    <><XCircle className="h-3 w-3 ml-1" /> غير نشط</>
                  )}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-3 p-4 md:p-5 text-right">
                <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 text-info/70" />
                    <span>رقم الجوال</span>
                  </div>
                  <a href={`tel:${employee.phone || employee.phone_number}`} className="font-medium font-mono dir-ltr hover:text-primary hover:underline transition-colors">{employee.phone || employee.phone_number || "-"}</a>
                </div>
                
                {employee.email && (
                  <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 text-custody/70" />
                      <span>البريد</span>
                    </div>
                    <a href={`mailto:${employee.email}`} className="font-medium text-xs truncate max-w-[150px] hover:text-primary hover:underline transition-colors">{employee.email}</a>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm p-2 bg-background/50 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-muted-foreground/70" />
                    <span>تاريخ الانضمام</span>
                  </div>
                  <span className="font-medium text-xs">
                    {employee.date_joined
                      ? format(new Date(employee.date_joined), "PP", { locale: arSA })
                      : "-"}
                  </span>
                </div>

                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {employee.permission_groups ? (
                      <div className="flex flex-wrap gap-1">
                        {(typeof employee.permission_groups === 'string' 
                            ? employee.permission_groups.split(',') 
                            : Array.isArray(employee.permission_groups)
                                ? employee.permission_groups
                                : [JSON.stringify(employee.permission_groups)] // Fallback
                        ).map((group: any, idx: number) => {
                           // If group is objects (old Permission type), handle it
                           const name = typeof group === 'object' && group?.name ? group.name : String(group);
                           const translatedName = PERMISSION_GROUP_LABELS[name] || name;
                           return (
                               <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-muted/30">
                                  {translatedName.trim()}
                               </Badge>
                           );
                        })}
                      </div>
                  ) : (
                      <span className="text-xs text-muted-foreground">لا يوجد صلاحيات</span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-3 bg-muted/30 flex gap-2">
                <Button 
                  variant="default" 
                  className="flex-1 gap-2 rounded-lg shadow-sm" 
                  size="sm"
                  onClick={() => navigate(`/employees/${employee.id}`)}
                >
                  التفاصيل
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 rounded-lg" 
                  size="sm"
                  onClick={() => navigate(`/employees/${employee.id}/edit`)}
                >
                  تعديل
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        entityName="موظف"
      />
    </div>
  );
}
