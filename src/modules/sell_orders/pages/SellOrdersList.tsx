import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ShoppingCart,
  Plus,
  Calendar,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSellOrders } from "@/hooks/useSellOrders";
import { useBranches, useCreateBranch } from "@/hooks/useBranches";
import { usePagination } from "@/hooks/usePagination";
import { useSearch } from "@/hooks/useSearch";
import type { SellOrder } from "@/types";
import {
  PageHeader,
  Pagination,
  SearchBar,
  LoadingState,
  EmptyState,
  SellOrderInvoiceOdooBadge,
} from "@/components/shared";
import { cn, parseBackendError } from "@/lib/utils";
import { formatCustomerWithBalance } from "@/lib/partyDisplay";
import { sellOrderHasInvoice } from "@/hooks/useSellOrders";
import { BranchDialog } from "../components/BranchDialog";

function sellOrderCustomerLabel(order: SellOrder): string {
  if (!order.customer) return "—";
  return formatCustomerWithBalance(order.customer);
}

type SellOrderRowData = SellOrder & {
  is_accepted?: boolean;
  is_verified?: boolean;
  is_rejected?: boolean;
};

function sellOrderListStatus(order: SellOrderRowData): {
  label: string;
  color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success";
} {
  if (order.is_rejected) return { label: "مرفوض", color: "destructive" };
  if (order.is_verified) return { label: "موثق", color: "success" };
  if (order.is_accepted) return { label: "مقبول", color: "info" };
  return { label: "قيد المراجعة", color: "warning" };
}

function SellOrderRow({ order }: { order: SellOrderRowData }) {
  const navigate = useNavigate();
  const statusInfo = sellOrderListStatus(order);
  const total = parseFloat(order.total_price_after_tax || "0");
  const createdDate = order.created_at || new Date().toISOString();
  const customerName = sellOrderCustomerLabel(order);
  const itemCount = order.sell_order_items?.length ?? 0;

  return (
    <tr
      className='cursor-pointer border-b border-border/40 transition-all duration-200 hover:bg-muted/50'
      onClick={() => navigate(`/sell-orders/${order.id}`)}
    >
      <td className='px-4 py-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-mono text-sm text-foreground'>#{order.id}</span>
          <SellOrderInvoiceOdooBadge isSynced={sellOrderHasInvoice(order)} />
        </div>
      </td>
      <td className='px-4 py-3'>
        <div
          className='flex items-center gap-2 min-w-0 max-w-[220px]'
          onClick={(e) => e.stopPropagation()}
        >
          <ShoppingCart className='h-4 w-4 text-primary shrink-0' />
          {/* لا نفتح تفاصيل العميل من هنا - نفتح تفاصيل أمر البيع (أو نتركها نص مع ضغط الصف) */}
          <span className='font-semibold text-sm truncate' title={customerName}>
            {customerName}
          </span>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <span
          dir='ltr'
          className='font-mono text-xs text-muted-foreground'
        >
          {order.customer?.phone_number ?? "—"}
        </span>
      </td>
      <td className='px-4 py-3 text-center'>
        <Badge variant='outline' className='font-mono text-xs'>
          {itemCount}
        </Badge>
      </td>
      <td className='px-4 py-3 text-center'>
        <div className='flex items-center justify-center gap-1.5'>
          <span className='font-bold text-primary font-mono text-sm'>
            {total.toLocaleString()}
          </span>
          <span className='text-[10px] font-normal text-muted-foreground'>
            ر.س
          </span>
        </div>
      </td>
      <td className='px-4 py-3 text-center'>
        <span className='text-xs text-muted-foreground flex items-center justify-center gap-1.5'>
          <Calendar className='h-3.5 w-3.5 shrink-0' />
          {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
        </span>
      </td>
      <td className='px-4 py-3 text-center'>
        <span className='text-xs text-muted-foreground'>
          {order.delivery_date ? format(new Date(order.delivery_date), "yyyy/MM/dd", { locale: arSA }) : "—"}
        </span>
      </td>
      <td className='px-4 py-3 text-center'>
        <Badge
          variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"}
          className='text-[10px] px-2 py-0.5 rounded-full font-semibold'
        >
          {statusInfo.label}
        </Badge>
      </td>
      <td className='px-4 py-3 text-center'>
        <Button
          variant='default'
          size='sm'
          className='rounded-lg gap-1.5 text-xs'
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/sell-orders/${order.id}`);
          }}
        >
          التفاصيل
          <ArrowRight className='h-3.5 w-3.5' />
        </Button>
      </td>
    </tr>
  );
}

function SellOrderMobileCard({ order }: { order: SellOrderRowData }) {
  const navigate = useNavigate();
  const statusInfo = sellOrderListStatus(order);
  const total = parseFloat(order.total_price_after_tax || "0");
  const createdDate = order.created_at || new Date().toISOString();
  const customerName = sellOrderCustomerLabel(order);
  const itemCount = order.sell_order_items?.length ?? 0;

  return (
    <Card
      onClick={() => navigate(`/sell-orders/${order.id}`)}
      className='cursor-pointer group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden'
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between gap-2 flex-wrap'>
          <Badge variant={statusInfo.color as "default" | "secondary" | "destructive" | "outline"} className='text-[10px]'>
            {statusInfo.label}
          </Badge>
          <div className='flex items-center gap-2 shrink-0'>
            <SellOrderInvoiceOdooBadge isSynced={sellOrderHasInvoice(order)} />
            <span className='text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md'>
              #{order.id}
            </span>
          </div>
        </div>
        <CardTitle className='text-base flex items-center gap-2 mt-2 min-w-0'>
          <ShoppingCart className='h-4 w-4 text-primary shrink-0' />
          <span className='truncate'>{customerName}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className='space-y-3 pb-4'>
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>الهاتف</span>
          <span dir='ltr' className='font-mono text-xs text-muted-foreground'>
            {order.customer?.phone_number ?? "—"}
          </span>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>البنود</span>
          <Badge variant='outline' className='font-mono text-xs'>
            {itemCount}
          </Badge>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>التاريخ</span>
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Calendar className='h-3.5 w-3.5' />
            {format(new Date(createdDate), "yyyy/MM/dd", { locale: arSA })}
          </span>
        </div>

        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>موعد التركيب</span>
          <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
            <Calendar className='h-3.5 w-3.5' />
            {order.delivery_date ? format(new Date(order.delivery_date), "yyyy/MM/dd", { locale: arSA }) : "—"}
          </span>
        </div>

        <div className='flex items-center justify-between pt-2 border-t border-border/50'>
          <span className='text-sm font-medium text-foreground'>الإجمالي</span>
          <div className='flex items-baseline gap-1'>
            <span className='font-bold text-primary font-mono text-lg'>
              {total.toLocaleString()}
            </span>
            <span className='text-xs text-muted-foreground'>ر.س</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellOrdersList() {
  /** الافتراضي: كل الأوامر. عند التفعيل يُرسل `have_invoice=false` لإخفاء التي لها فاتورة. */
  const [hideOrdersWithInvoice, setHideOrdersWithInvoice] = useState(false);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const { page, pageSize, setPage, setPageSize, reset: resetPage } = usePagination();
  const {
    searchTerm: searchQuery,
    debouncedTerm,
    setSearchTerm: setSearchQuery,
  } = useSearch({ debounceMs: 300 });

  // --- الفروع ---
  const { data: branches = [] } = useBranches();
  const createBranch = useCreateBranch();

  // الفروع النشطة فقط تظهر كتبويبات (تبويب «الكل» يظهر دائماً).
  const activeBranches = useMemo(
    () => branches.filter((b) => b.is_active === true),
    [branches],
  );

  const branchParam = searchParams.get("branch");
  /**
   * التحديد الفعّال: «الكل» أو رقم فرع.
   * - "all" → لا نُرسل فلتر الفرع (تظهر كل الأوامر بما فيها التي بلا فرع).
   * - رقم   → نُرسل branch=<id>.
   * القيمة تُشتق من ?branch=: "all" لتبويب الكل، أو الرقم؛ الافتراضي (لا قيمة/غير صالحة) → "all".
   */
  const activeSelection = useMemo<"all" | number>(() => {
    if (branchParam === "all") return "all";
    const fromUrl = branchParam ? Number(branchParam) : NaN;
    if (
      Number.isFinite(fromUrl) &&
      activeBranches.some((b) => b.id === fromUrl)
    ) {
      return fromUrl;
    }
    return "all";
  }, [activeBranches, branchParam]);

  const tabValue = activeSelection === "all" ? "all" : String(activeSelection);

  const handleBranchChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("branch", value);
    setSearchParams(next);
    resetPage();
  };

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useSellOrders({
      search: debouncedTerm,
      page,
      page_size: pageSize,
      ...(activeSelection !== "all" ? { branch: activeSelection } : {}),
      ...(hideOrdersWithInvoice ? { have_invoice: false } : {}),
    });

  const sellOrders = (data?.results || []) as SellOrderRowData[];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const createOrderHref =
    activeSelection !== "all"
      ? `/sell-orders/new?branch=${activeSelection}`
      : "/sell-orders/new";

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    resetPage();
  };

  const handleCreateBranch = (values: { name: string }) => {
    createBranch.mutate(values, {
      onSuccess: (branch) => {
        toast.success("تم إضافة الفرع بنجاح");
        setIsBranchDialogOpen(false);
        const next = new URLSearchParams(searchParams);
        next.set("branch", String(branch.id));
        setSearchParams(next);
        resetPage();
      },
      onError: (err) => {
        toast.error(parseBackendError(err));
      },
    });
  };

  return (
    <div
      className='space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-10'
      dir='rtl'
    >
      <PageHeader
        title='أوامر البيع'
        subtitle='إدارة أوامر البيع والفواتير'
        icon={<ShoppingCart className='w-7 h-7' />}
        sticky
        action={
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => refetch()}
              disabled={isRefetching}
              className='h-11 w-11 rounded-full hover:bg-muted shrink-0'
              title='تحديث'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            </Button>
            {/* A new order auto-assigns to the active branch, so creation is
                only offered from a specific branch tab — not from «الكل». */}
            {activeSelection !== "all" && (
              <Link to={createOrderHref}>
                <Button className='rounded-xl shadow-lg shadow-primary/20 gap-2'>
                  <Plus className='h-4 w-4' />
                  <span className='hidden sm:inline'>أمر بيع جديد</span>
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* تبويبات الفروع */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Tabs
          value={tabValue}
          onValueChange={handleBranchChange}
          dir='rtl'
          className='w-full sm:w-auto'
        >
          <TabsList className='flex flex-wrap h-auto gap-1 bg-muted/50 w-full sm:w-auto'>
            <TabsTrigger
              value='all'
              className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'
            >
              الكل
            </TabsTrigger>
            {activeBranches.map((branch) => (
              <TabsTrigger
                key={branch.id}
                value={String(branch.id)}
                className='gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm'
              >
                {branch.name}
                <Badge
                  variant='secondary'
                  className='font-mono text-[10px] px-1.5 py-0'
                >
                  {branch.sell_orders_count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='shrink-0 gap-2 rounded-full self-start'
          onClick={() => setIsBranchDialogOpen(true)}
        >
          <Plus className='h-4 w-4' />
          إضافة فرع
        </Button>
      </div>

      <div className='bg-card p-4 rounded-2xl border shadow-sm'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder='بحث عن عميل أو رقم...'
            className='w-full sm:max-w-md'
          />
          <Button
            type='button'
            variant={hideOrdersWithInvoice ? "default" : "outline"}
            className={cn(
              "shrink-0 gap-2 rounded-full px-5 h-10 font-medium w-full sm:w-auto justify-center",
              !hideOrdersWithInvoice &&
                "border-primary/50 text-primary hover:bg-primary/5 bg-background",
            )}
            aria-pressed={hideOrdersWithInvoice}
            title={
              hideOrdersWithInvoice
                ? "عرض كل أوامر البيع بما فيها ذات الفاتورة"
                : "إخفاء أوامر البيع التي لها فاتورة من القائمة"
            }
            onClick={() => {
              setHideOrdersWithInvoice((v) => !v);
              resetPage();
            }}
          >
            <CheckCircle2 className='h-4 w-4 shrink-0' />
            {hideOrdersWithInvoice
              ? "إظهار الكل"
              : "إخفاء أوامر ذات فاتورة"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message='جاري تحميل أوامر البيع...' />
      ) : isError ? (
        <div className='flex flex-col items-center justify-center min-h-[400px] gap-4 text-center'>
          <div className='p-4 rounded-full bg-destructive/10 text-destructive'>
            <ShoppingCart className='h-8 w-8' />
          </div>
          <h3 className='text-xl font-semibold'>حدث خطأ</h3>
          <p className='text-muted-foreground'>
            {(error as Error)?.message ||
              "فشل تحميل قائمة أوامر البيع. يرجى المحاولة مرة أخرى."}
          </p>
          <Button onClick={() => refetch()} variant='outline'>
            إعادة المحاولة
          </Button>
        </div>
      ) : sellOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title='لا يوجد أوامر بيع'
          description={
            searchQuery
              ? "لم يتم العثور على أوامر بيع تطابق بحثك."
              : activeSelection === "all"
                ? "اختر فرعاً من التبويبات لإنشاء أمر بيع جديد."
                : "لم يتم إنشاء أوامر بيع حالية. يمكنك إنشاء أمر بيع جديد للبدء."
          }
          action={
            !searchQuery && activeSelection !== "all" && (
              <Link to={createOrderHref}>
                <Button>
                  <Plus className='h-4 w-4 ml-2' />
                  أمر بيع جديد
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className='md:hidden space-y-4'>
            {sellOrders.map((order) => (
              <SellOrderMobileCard key={order.id} order={order} />
            ))}
          </div>

          <div className='hidden md:block bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden'>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm whitespace-nowrap'>
                <thead>
                  <tr className='bg-muted/50 border-b border-border/50 text-muted-foreground'>
                    <th className='px-4 py-3 text-right font-medium'>رقم الأمر</th>
                    <th className='px-4 py-3 text-right font-medium'>العميل</th>
                    <th className='px-4 py-3 text-center font-medium'>الهاتف</th>
                    <th className='px-4 py-3 text-center font-medium'>البنود</th>
                    <th className='px-4 py-3 text-center font-medium'>الإجمالي</th>
                    <th className='px-4 py-3 text-center font-medium'>
                      تاريخ الإنشاء
                    </th>
                    <th className='px-4 py-3 text-center font-medium'>موعد التركيب</th>
                    <th className='px-4 py-3 text-center font-medium'>الحالة</th>
                    <th className='px-4 py-3 text-center font-medium w-28'>
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellOrders.map((order) => (
                    <SellOrderRow key={order.id} order={order} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            entityName='أمر بيع'
          />
        </>
      )}

      <BranchDialog
        open={isBranchDialogOpen}
        onOpenChange={setIsBranchDialogOpen}
        onSubmit={handleCreateBranch}
        isLoading={createBranch.isPending}
      />
    </div>
  );
}
