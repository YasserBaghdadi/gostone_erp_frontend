import logo from "@/assets/logo.svg";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Ruler,
  FileCheck,
  ClipboardList,
  Menu,
  LogOut,
  User as UserIcon,
  DollarSign,
  Receipt,
  PlusCircle,
  ShoppingCart,
  Warehouse,
  ArrowLeftRight,
  CreditCard,
  FileText,
  PackageOpen,
  Package,
  Factory,
  Truck,
  HandCoins,
  UserPlus
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useUser } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

// Each item's `permission` is the screen's action-catalog `.view` key (granted
// via /roles-permissions). A value may be an array (any-of). Superuser = all.
const navigationGroups = [
  {
    title: "إدارة المخزون",
    items: [
      { name: "الموردين", href: "/suppliers", icon: Users, permission: "suppliers.view" },
      { name: "المنتجات", href: "/items", icon: Package, permission: "items.view" },
      { name: "أوامر التصنيع", href: "/production-orders", icon: Factory, permission: "production_orders.view" },
      { name: "أوامر التسليم", href: "/delivery-orders", icon: Truck, permission: "delivery_orders.view" },
      { name: "طلبات الشراء", href: "/purchase-orders", icon: ShoppingCart, permission: "purchase_orders.view" },
    ]
  },
  {
    title: "إدارة العملاء",
    items: [
      { name: "العملاء", href: "/customers", icon: UserIcon, permission: "customers.view" },
      { name: "العملاء المحتملون", href: "/potential-customers", icon: UserPlus, permission: ["customers.view", "potential_customers.view"] },
      { name: "الفرص", href: "/opportunities", icon: Users, permission: "opportunities.view" },
      { name: "المقاسات", href: "/measurements", icon: Ruler, permission: "measurements.view" },
      { name: "أوامر البيع", href: "/sell-orders", icon: FileCheck, permission: "sell_orders.view" },
      { name: "المرتجعات", href: "/customer-returns", icon: PackageOpen, permission: "customer_returns.view" },
    ]
  },
  {
    title: "إدارة الموظفين",
    items: [
      { name: "الموظفين", href: "/employees", icon: Users, permission: "employees.view" },
      { name: "الجلسات", href: "/sessions", icon: ClipboardList, permission: "sessions.view" },
      { name: "طلبات العهد", href: "/custody", icon: DollarSign, permission: "custody.view" },
      { name: "طلبات صرف", href: "/employee-expenses", icon: Receipt, permission: "expenses_requests.view" },
      { name: "الأدوار والصلاحيات", href: "/roles-permissions", icon: ClipboardList, permission: "employees.assign_permissions" },
    ]
  },
  {
    title: "إدارة الحسابات",
    items: [
      { name: "الحسابات", href: "/accounts", icon: DollarSign, permission: "accounts.view" },
      { name: "تسجيل المصروفات", href: "/expenses", icon: Receipt, permission: "expenses.view" },
      { name: "الملاحظات", href: "/notes", icon: ClipboardList, permission: "notes.view" },
      { name: "سندات القيد", href: "/journal-entries", icon: FileText, permission: "journal_entries.view" },
      { name: "بوابات الدفع", href: "/accounts/payment-gateways", icon: CreditCard, permission: "payment_gateways.view" },
      { name: "بوابات القبض", href: "/collections", icon: HandCoins, permission: "collections.view" },
      { name: "طلبات الدفع", href: "/payment-requests", icon: CreditCard, permission: "payment_requests.view" },
      { name: "قوالب الاستحقاق", href: "/accrual-templates", icon: FileText, permission: "accrual_templates.view" },
      { name: "الأصول الثابتة", href: "/fixed-assets", icon: Package, permission: "fixed_assets.view" },
      { name: "مسودّات آخر الشهر", href: "/month-end-drafts", icon: ClipboardList, permission: ["month_end_drafts.view", "accrual_templates.view"] },
      { name: "دفعات الموردين", href: "/supplier-payments", icon: HandCoins, permission: "supplier_payments.view" },
    ]
  },
  {
    title: "عام",
    items: [
      { name: "الموافقات", href: "/approvals", icon: ClipboardList, permission: "approvals.view" },
      { name: "المخازن", href: "/storage-areas", icon: Warehouse, permission: "storage_areas.view" },
      { name: "تحويل المخزون", href: "/stock-transfers", icon: ArrowLeftRight, permission: "stock_transfers.view" },
      { name: "رصيد المخازن", href: "/stock-report", icon: ClipboardList, permission: ["stock_report.view", "items.stock_report"] },
    ]
  }
];

type NavLinkItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string | string[];
};

function SidebarNavLink({
  item,
  mobile,
  pathname,
  onMobileNavigate,
}: {
  item: NavLinkItem;
  mobile?: boolean;
  pathname: string;
  onMobileNavigate?: () => void;
}) {
  const isCurrentItemBestMatch = () => {
    const allHrefs = navigationGroups.flatMap((g) => g.items.map((i) => i.href));
    let bestMatch = "";
    for (const href of allHrefs) {
      if (pathname === href || pathname.startsWith(href + "/")) {
        if (href.length > bestMatch.length) {
          bestMatch = href;
        }
      }
    }
    return bestMatch === item.href;
  };

  const isActive = isCurrentItemBestMatch();

  return (
    <Link
      to={item.href}
      onClick={() => {
        if (mobile) onMobileNavigate?.();
      }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
        mobile ? "py-3 text-base px-4" : "",
        isActive
          ? "bg-primary text-primary-foreground shadow-md translate-x-[-2px]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-[-2px]",
      )}
    >
      <item.icon className={cn("h-5 w-5", mobile && "h-6 w-6")} />
      {item.name}
    </Link>
  );
}

function MobileBottomNav({
  pathname,
  navigate,
}: {
  pathname: string;
  navigate: NavigateFunction;
}) {
  const navItems = [
    { name: "العملاء", href: "/customers", icon: UserIcon },
    { name: "الفرص", href: "/opportunities", icon: Users },
    { name: "أوامر البيع", href: "/sell-orders", icon: FileCheck },
    { name: "الموافقات", href: "/approvals", icon: ClipboardList },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
      <div className="mx-4 mb-4 h-16 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg">
        <div className="grid grid-cols-5 items-center h-full px-2">
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className={cn("p-1.5 rounded-lg transition-all", isActive && "bg-primary/10")}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            );
          })}

          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105 active:scale-95 -translate-y-3"
                >
                  <PlusCircle className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                side="top"
                className="mb-4 w-52 p-2 rounded-xl shadow-xl border-border/50 backdrop-blur-md bg-background/95"
              >
                <DropdownMenuItem
                  onClick={() => navigate("/opportunities/new")}
                  className="py-3 cursor-pointer rounded-lg focus:bg-primary/5"
                >
                  <div className="p-1 bg-info-light text-info rounded mr-2 ml-2">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">فرصة جديدة</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/work-orders")}
                  className="py-3 cursor-pointer rounded-lg focus:bg-primary/5"
                >
                  <div className="p-1 bg-custody-light text-custody rounded mr-2 ml-2">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">أمر بيع جديد</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate("/employee-expenses/new")}
                  className="py-3 cursor-pointer rounded-lg focus:bg-primary/5"
                >
                  <div className="p-1 bg-warning-light text-warning rounded mr-2 ml-2">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <span className="font-semibold">طلب صرف</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {navItems.slice(2, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className={cn("p-1.5 rounded-lg transition-all", isActive && "bg-primary/10")}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { data: user } = useUser();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoutClick = () => {
      setLogoutModalOpen(true);
  };

  const hasPermission = (permission?: string | string[]) => {
    if (!permission) return true;
    if (!user) return false;
    // A superuser (full manager) always sees every interface.
    if (user.is_superuser) return true;
    const required = Array.isArray(permission) ? permission : [permission];
    return user.permission_groups?.some((g) => required.includes(g.name)) ?? false;
  };

  // Helpers to check if we should hide the nav (Focus Mode)
  const isFocusPage = location.pathname.includes("/new") || location.pathname.includes("/edit");

  return (
    <div className="flex min-h-screen bg-background pb-24 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-l bg-card/50 backdrop-blur-xl md:flex md:flex-col shadow-sm z-30 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="flex h-16 items-center border-b px-6 bg-primary/5 shrink-0">
          <div className="flex items-center gap-2">
             <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
             <h1 className="text-lg font-bold text-primary tracking-tight">جو ستون</h1>
          </div>
        </div>
        <nav className="flex-1 space-y-4 p-4 overflow-y-auto">
          
          {navigationGroups.map((group, idx) => {
            const filteredItems = group.items.filter((item) => hasPermission(item.permission));
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <h3 className="text-sm font-bold text-primary text-center px-4 mb-3 mt-4 flex items-center justify-center gap-2">
                  <span className="h-px flex-1 bg-primary/20"></span>
                  {group.title}
                  <span className="h-px flex-1 bg-primary/20"></span>
                </h3>
                {filteredItems.map((item) => (
                  <SidebarNavLink key={item.name} item={item} pathname={location.pathname} />
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 md:px-6 sticky top-0 z-20 backdrop-blur-sm bg-background/80 md:bg-background/50">
          <div className="flex items-center gap-4 md:hidden">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0 flex flex-col">
                
                {/* Mobile Sidebar Header */}
                <div className="flex flex-col p-6 bg-linear-to-b from-primary/5 via-primary/5 to-transparent border-b">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="bg-background p-2 rounded-xl shadow-sm ring-1 ring-border/50">
                             <img src={logo} alt="Logo" className="h-8 w-auto object-contain" />
                        </div>
                        <div>
                            <SheetTitle className="text-lg font-bold text-primary tracking-tight">جو ستون</SheetTitle>
                            <p className="text-xs text-muted-foreground font-medium">لوحة التحكم</p>
                        </div>
                     </div>
                     
                     {user && (
                         <div className="flex items-center gap-3 bg-background/60 backdrop-blur-sm p-3 rounded-xl border shadow-sm">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {user.first_name && user.last_name 
                                        ? `${user.first_name[0]} ${user.last_name[0]}`
                                        : user.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-bold truncate text-foreground">
                                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate font-mono" dir="ltr">
                                  {user.phone_number || user.email}
                                </p>
                            </div>
                         </div>
                     )}
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 no-scrollbar" style={{ direction: 'rtl' }}>
                  
                  <Accordion type="multiple" defaultValue={['item-0', 'item-1']} className="w-full space-y-2">
                    {navigationGroups.map((group, idx) => {
                      const filteredItems = group.items.filter((item) => hasPermission(item.permission));
                      if (filteredItems.length === 0) return null;

                      return (
                        <AccordionItem key={idx} value={`item-${idx}`} className="border-none bg-muted/5 rounded-xl px-2">
                          <AccordionTrigger className="hover:no-underline hover:bg-muted/50 py-3 px-2 rounded-lg text-foreground font-bold text-sm text-right data-[state=open]:text-primary transition-colors">
                            {group.title}
                          </AccordionTrigger>
                          <AccordionContent className="pb-3 pt-0 px-1 space-y-1">
                            {filteredItems.map((item) => (
                              <SidebarNavLink
                                key={item.name}
                                item={item}
                                mobile
                                pathname={location.pathname}
                                onMobileNavigate={() => setSidebarOpen(false)}
                              />
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </nav>

                {/* Mobile Sidebar Footer */}
                <div className="p-4 border-t bg-muted/20 mt-auto shadow-[0_-5px_10px_-5px_rgba(0,0,0,0.05)]">
                    <Button 
                        variant="destructive" 
                        className="w-full gap-2 rounded-xl shadow-sm" 
                        onClick={() => {
                            setSidebarOpen(false);
                            handleLogoutClick();
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                    </Button>
                </div>

              </SheetContent>
            </Sheet>
             <h1 className="text-lg font-bold text-foreground md:hidden">جو ستون</h1>
          </div>
         
          <div className="mr-auto flex items-center gap-4">
             {user && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 h-auto py-1 px-2 rounded-full hover:bg-muted/50">
                            <div className="hidden md:flex md:flex-col items-start text-sm text-right">
                                <span className="font-medium text-foreground">
                                    {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                </span>
                            </div>
                            <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback>
                                    {user.first_name && user.last_name 
                                        ? `${user.first_name[0]} ${user.last_name[0]}`
                                        : user.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1 text-right">
                                <p className="text-sm font-medium leading-none">
                                     {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">{user.email || user.phone_number}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/profile")} className="justify-end cursor-pointer">
                            <span>الملف الشخصي</span>
                            <UserIcon className="ml-2 h-4 w-4" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive focus:text-destructive focus:bg-destructive/10 justify-end cursor-pointer">
                            <span>تسجيل الخروج</span>
                            <LogOut className="ml-2 h-4 w-4" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
            <ConfirmModal 
                isOpen={logoutModalOpen}
                onClose={() => setLogoutModalOpen(false)}
                onConfirm={confirmLogout}
                title="تسجيل الخروج"
                description="هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟"
                confirmText="تسجيل الخروج"
                cancelText="البقاء"
                variant="logout"
            />
          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 w-full p-4 md:p-6 lg:p-8">
           <Outlet />
        </main>

        {/* Mobile Bottom Nav - Hidden on Focus Pages */}
        {!isFocusPage && <MobileBottomNav pathname={location.pathname} navigate={navigate} />}

      </div>
    </div>
  );
}
