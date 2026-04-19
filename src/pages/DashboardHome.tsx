import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Plus, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building2,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/useAuthStore";
import { useDashboardStats } from "@/hooks/useDashboard";

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Fetch stats from server
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }

  if (isError || !stats) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
              <p className="text-muted-foreground">حدث خطأ أثناء تحميل البيانات</p>
              <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 md:pb-10">
      
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-6 rounded-3xl border border-muted/50">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            مرحباً، {user?.first_name || 'المستخدم'} 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            إليك نظرة عامة على أداء العمل اليوم.
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => navigate("/opportunities/new")} className="shadow-lg shadow-primary/20 gap-2 rounded-xl h-11">
                <Plus className="h-5 w-5" />
                فرصة جديدة
            </Button>
            <Button variant="outline" onClick={() => navigate("/opportunities")} className="gap-2 rounded-xl h-11">
                <Search className="h-5 w-5" />
                بحث سريع
            </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
            title="إجمالي الإيرادات" 
            value={`${stats.totalRevenue.toLocaleString()} ر.س`}
            icon={Wallet}
            trend="+12.5%"
            trendUp={true}
            color="text-success"
            bg="bg-success-light dark:bg-success/20"
        />
        <StatsCard 
            title="الفرص الجديدة" 
            value={stats.newOpportunities.toString()}
            icon={TrendingUp}
            trend={`من أصل ${stats.totalOpportunities}`}
            trendUp={true}
            color="text-info"
            bg="bg-info-light dark:bg-info/20"
        />
         <StatsCard 
            title="أوامر البيع الجارية" 
            value={stats.activeWorkOrders.toString()}
            icon={Briefcase}
            trend={`${stats.completedWorkOrders} مكتملة`}
            trendUp={true}
            color="text-custody"
            bg="bg-custody-light dark:bg-custody/20"
        />
        <StatsCard 
            title="انتظار الموافقات" 
            value={stats.pendingApprovals.toString()}
            icon={Clock}
            trend="تحتاج اتخاذ إجراء"
            trendUp={false} // Alert color
            color="text-warning"
            bg="bg-warning-light dark:bg-warning/20"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        
        {/* Recent Activity */}
        <Card className="md:col-span-4 lg:col-span-5 shadow-sm border-none ring-1 ring-border/50">
          <CardHeader>
            <CardTitle>النشاط الأخير</CardTitle>
            <CardDescription>أحدث العمليات التي تمت على النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                {stats.recentActivities.length > 0 ? (
                     stats.recentActivities.map((activity, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${activity.type === 'opportunity' ? 'bg-info-light text-info' : 'bg-success-light text-success'}`}>
                                    {activity.type === 'opportunity' ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                                        {activity.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.clientName}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                    {activity.type === 'opportunity' ? 'فرصة' : 'أمر بيع'}
                                </p>
                                <p className="text-xs text-muted-foreground" dir="ltr">
                                    {new Date(activity.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">لا يوجد نشاط حديث</div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links / Status */}
        <div className="md:col-span-3 lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-none ring-1 ring-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                 <CardHeader>
                    <CardTitle className="text-lg">حالة النظام</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border">
                        <span className="text-sm text-muted-foreground">المشاريع النشطة</span>
                        <Badge variant="outline" className="bg-success-light text-success border-success/30">{stats.activeWorkOrders}</Badge>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg border">
                        <span className="text-sm text-muted-foreground">العملاء المحتملين</span>
                        <Badge variant="outline" className="bg-info-light text-info border-info/30">{stats.newOpportunities}</Badge>
                    </div>
                    <Button className="w-full gap-2 mt-4" variant="secondary" onClick={() => navigate("/approvals")}>
                        <CheckCircle className="h-4 w-4" />
                        متابعة الموافقات
                    </Button>
                 </CardContent>
            </Card>

             <Card className="shadow-sm border-none ring-1 ring-border/50">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        فروعنا
                    </CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="text-sm text-muted-foreground">الفرع الرئيسي - الرياض</p>
                    <div className="mt-4 flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs text-muted-foreground">متصل</span>
                    </div>
                 </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, trendUp, color, bg }: any) {
    return (
        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                     <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <div className="flex items-center gap-1 mt-1">
                    {trendUp !== undefined && (
                        trendUp ? 
                        <ArrowUpRight className="h-3 w-3 text-success" /> : 
                        <ArrowDownRight className="h-3 w-3 text-destructive" /> // Or amber for pending
                    )}
                    <p className={`text-xs ${trendUp === false ? "text-warning font-medium" : "text-muted-foreground"}`}>
                        {trend}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
