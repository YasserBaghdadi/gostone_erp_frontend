import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { lazy } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/QueryProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PermissionRoute } from "@/components/PermissionRoute";
import { ROUTE_PERMISSIONS } from "@/lib/routePermissions";
import DashboardLayout from "@/layouts/DashboardLayout";
import { authTokens } from "@/lib/auth";
import api from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/server";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LazyRoute } from "@/components/LazyRoute";
import { OfflineBanner } from "@/components/common/OfflineBanner";

// Auth pages (not lazy - needed for initial load)
import LoginPage from "@/modules/auth/pages/LoginPage";
import { NotFoundPage } from "@/components/common/NotFoundPage";

// Lazy loaded pages
// const DashboardHome = lazy(() => import("@/pages/DashboardHome"));
const ProfilePage = lazy(() => import("@/modules/profile/pages/ProfilePage"));
const ApprovalsPage = lazy(() => import("@/pages/ApprovalsPage"));
const ApprovalDetails = lazy(() => import("@/modules/approvals/pages/ApprovalDetails"));

// Opportunities
const OpportunitiesList = lazy(() => import("@/modules/opportunities/pages/OpportunitiesList"));
const CreateOpportunity = lazy(() => import("@/modules/opportunities/pages/CreateOpportunity"));
const OpportunityDetails = lazy(() => import("@/modules/opportunities/pages/OpportunityDetails"));

// Measurements
const MeasurementsList = lazy(() => import("@/modules/measurements/pages/MeasurementsList"));

// Employees & Custody
const CustodyList = lazy(() => import("@/modules/employees/pages/CustodyList"));
const CreateCustody = lazy(() => import("@/modules/employees/pages/CreateCustody"));
const CustodyDetails = lazy(() => import("@/modules/employees/pages/CustodyDetails"));
const ExpenseList = lazy(() => import("@/modules/employees/pages/ExpenseList"));
const CreateExpense = lazy(() => import("@/modules/employees/pages/CreateExpense"));
const ExpenseDetails = lazy(() => import("@/modules/employees/pages/ExpenseDetails"));
const EmployeesList = lazy(() => import("@/modules/employees/pages/EmployeesList"));
const EmployeeDetails = lazy(() => import("@/modules/employees/pages/EmployeeDetails"));
const CreateEmployeePage = lazy(() => import("@/modules/employees/pages/CreateEmployee"));
const SessionsList = lazy(() => import("@/modules/employees/pages/SessionsList"));
const SessionDetails = lazy(() => import("@/modules/employees/pages/SessionDetails"));

// Customers
const CustomersList = lazy(() => import("@/modules/customers/pages/CustomersList"));
const PotentialCustomersList = lazy(() => import("@/modules/customers/pages/PotentialCustomersList"));
const CreateCustomer = lazy(() => import("@/modules/customers/pages/CreateCustomer"));
const CustomerDetails = lazy(() => import("@/modules/customers/pages/CustomerDetails"));
const EditCustomer = lazy(() => import("@/modules/customers/pages/EditCustomer"));

// Sell Orders
const SellOrdersList = lazy(() => import("@/modules/sell_orders/pages/SellOrdersList"));
const SellOrderDetails = lazy(() => import("@/modules/sell_orders/pages/SellOrderDetails"));
const CreateSellOrder = lazy(() => import("@/modules/sell_orders/pages/CreateSellOrder"));

// Items (Products)
const ItemsList = lazy(() => import("@/modules/items/pages/ItemsList"));
const CreateItem = lazy(() => import("@/modules/items/pages/CreateItem"));
const ItemDetails = lazy(() => import("@/modules/items/pages/ItemDetails"));

// Production Orders (أوامر التصنيع)
const ProductionOrdersList = lazy(() => import("@/modules/production_orders/pages/ProductionOrdersList"));
const CreateProductionOrder = lazy(() => import("@/modules/production_orders/pages/CreateProductionOrder"));
const ProductionOrderDetails = lazy(() => import("@/modules/production_orders/pages/ProductionOrderDetails"));
const DeliveryOrdersList = lazy(() => import("@/modules/delivery_orders/pages/DeliveryOrdersList"));
const DeliveryOrderDetails = lazy(() => import("@/modules/delivery_orders/pages/DeliveryOrderDetails"));

// Purchase Orders & Suppliers
const PurchaseOrdersList = lazy(() => import("@/modules/purchase_orders/pages/PurchaseOrdersList"));
const PurchaseOrderDetails = lazy(() => import("@/modules/purchase_orders/pages/PurchaseOrderDetails"));
const CreatePurchaseOrder = lazy(() => import("@/modules/purchase_orders/pages/CreatePurchaseOrder"));
const SuppliersList = lazy(() => import("@/modules/purchase_orders/pages/SuppliersList"));
const SupplierDetails = lazy(() => import("@/modules/purchase_orders/pages/SupplierDetails"));
const CreateSupplier = lazy(() => import("@/modules/purchase_orders/pages/CreateSupplier"));
const StorageAreasList = lazy(() => import("@/modules/storage/pages/StorageAreasList"));
const StockTransfers = lazy(() => import("@/modules/stock_transfers/pages/StockTransfers"));
const StockReport = lazy(() => import("@/modules/storage/pages/StockReport"));

// Customer Returns
const CustomerReturnsList = lazy(() => import("@/modules/customer_returns/pages/CustomerReturnsList"));
const CreateCustomerReturn = lazy(() => import("@/modules/customer_returns/pages/CreateCustomerReturn"));
const CustomerReturnDetails = lazy(() => import("@/modules/customer_returns/pages/CustomerReturnDetails"));

// Accounts
const AccountsPage = lazy(() => import("@/modules/accounts/pages/AccountsPage"));
const ExpensesEntryPage = lazy(() => import("@/modules/expenses/pages/ExpensesPage"));
const NotesPage = lazy(() => import("@/modules/notes/pages/NotesPage"));
const AccountDetails = lazy(() => import("@/modules/accounts/pages/AccountDetails"));
const PaymentGatewaysPage = lazy(() => import("@/modules/accounts/pages/PaymentGatewaysPage"));

// Collections (بوابات القبض)
const CollectionsPage = lazy(() => import("@/modules/collections/pages/CollectionsPage"));

// Payment Requests (قائمة موحّدة + تفاصيل منفصلة)
const PaymentRequestsPage = lazy(() => import("@/modules/payment_requests/pages/PaymentRequestsPage"));
const CRPaymentRequestDetails = lazy(() => import("@/modules/payment_requests/pages/CRPaymentRequestDetails"));
const POPaymentRequestDetails = lazy(() => import("@/modules/payment_requests/pages/POPaymentRequestDetails"));
const DRPaymentRequestDetails = lazy(() => import("@/modules/payment_requests/pages/DRPaymentRequestDetails"));

function LegacyCRPaymentDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/payment-requests/cr/${id ?? ""}`} replace />;
}
function LegacyPOPaymentDetailRedirect() {
  const { id } = useParams();
  return <Navigate to={`/payment-requests/po/${id ?? ""}`} replace />;
}

// Journal Entries
const JournalEntriesList = lazy(() => import("@/modules/accounts/pages/JournalEntriesList"));
const JournalEntryDetails = lazy(() => import("@/modules/accounts/pages/JournalEntryDetails"));
const CreateJournalEntry = lazy(() => import("@/modules/accounts/pages/CreateJournalEntry"));

// Recurring Accruals & Fixed Assets
const AccrualTemplatesList = lazy(() => import("@/modules/accruals/pages/AccrualTemplatesList"));
const MonthEndDraftsPage = lazy(() => import("@/modules/accruals/pages/MonthEndDraftsPage"));
const FixedAssetsList = lazy(() => import("@/modules/fixed_assets/pages/FixedAssetsList"));

// ... imports remain the same

function AppContent() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const validateAndRestoreSession = async () => {
      const accessToken = authTokens.getAccessToken();
      
      if (!accessToken) {
        // No token, ensure logged out state
        useAuthStore.getState().setInitializing(false);
        if (useAuthStore.getState().isAuthenticated) {
          useAuthStore.getState().logout();
        }
        return;
      }
      
      try {
        // Verify token with backend
        await api.post(API_ENDPOINTS.AUTH.VERIFY, { token: accessToken });
        // Token is valid, restore session
        useAuthStore.getState().setAuthenticated(true);
      } catch {
        // Token invalid, clear everything
        console.warn("Invalid token detected, clearing auth state...");
        authTokens.clearTokens();
        useAuthStore.getState().logout();
      }
    };
    
    validateAndRestoreSession();
  }, []); // Only run once on mount

  return (
    <>
      <OfflineBanner />
      <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/suppliers" />} />
          
          <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
              <Route path="/" element={<Navigate to="/suppliers" replace />} />
              <Route path="profile" element={<LazyRoute component={ProfilePage} moduleName="الملف الشخصي" />} />
              
              {/* Opportunities */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.opportunities} />}>
                <Route path="opportunities">
                    <Route index element={<LazyRoute component={OpportunitiesList} moduleName="الفرص" />} />
                    <Route path="new" element={<LazyRoute component={CreateOpportunity} moduleName="إضافة فرصة" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateOpportunity} moduleName="تعديل الفرصة" />} />
                    <Route path=":id" element={<LazyRoute component={OpportunityDetails} moduleName="تفاصيل الفرصة" />} />
                </Route>
              </Route>

              {/* Measurements */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.measurements} />}>
                <Route path="measurements" element={<LazyRoute component={MeasurementsList} moduleName="المقاسات" />} />
              </Route>

              {/* Approvals */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.approvals} />}>
                <Route path="approvals">
                    <Route index element={<LazyRoute component={ApprovalsPage} moduleName="الموافقات" />} />
                    <Route path=":id" element={<LazyRoute component={ApprovalDetails} moduleName="تفاصيل الموافقة" />} />
                </Route>
              </Route>

              {/* Sell Orders */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.sellOrders} />}>
                <Route path="sell-orders">
                    <Route index element={<LazyRoute component={SellOrdersList} moduleName="أوامر البيع" />} />
                    <Route path="new" element={<LazyRoute component={CreateSellOrder} moduleName="أمر بيع جديد" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateSellOrder} moduleName="تعديل أمر البيع" />} />
                    <Route path=":id" element={<LazyRoute component={SellOrderDetails} moduleName="تفاصيل أمر البيع" />} />
                </Route>
              </Route>

              {/* Custody (Employee Management) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.custody} />}>
                <Route path="custody">
                    <Route index element={<LazyRoute component={CustodyList} moduleName="العهد" />} />
                    <Route path="new" element={<LazyRoute component={CreateCustody} moduleName="عهدة جديدة" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateCustody} moduleName="تعديل العهدة" />} />
                    <Route path=":id" element={<LazyRoute component={CustodyDetails} moduleName="تفاصيل العهدة" />} />
                </Route>
              </Route>

              {/* Employee Expenses */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.expenses} />}>
                <Route path="employee-expenses">
                    <Route index element={<LazyRoute component={ExpenseList} moduleName="المصروفات" />} />
                    <Route path="new" element={<LazyRoute component={CreateExpense} moduleName="مصروف جديد" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateExpense} moduleName="تعديل المصروف" />} />
                    <Route path=":id" element={<LazyRoute component={ExpenseDetails} moduleName="تفاصيل المصروف" />} />
                </Route>
              </Route>

              {/* Employees (Staff) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.employees} />}>
                <Route path="employees">
                    <Route index element={<LazyRoute component={EmployeesList} moduleName="الموظفين" />} />
                    <Route path="new" element={<LazyRoute component={CreateEmployeePage} moduleName="موظف جديد" />} />
                    <Route path=":id" element={<LazyRoute component={EmployeeDetails} moduleName="تفاصيل الموظف" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateEmployeePage} moduleName="تعديل الموظف" />} />
                </Route>
              </Route>

              {/* Sessions (Salesman Shifts) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.sessions} />}>
                <Route path="sessions">
                    <Route index element={<LazyRoute component={SessionsList} moduleName="الجلسات" />} />
                    <Route path=":id" element={<LazyRoute component={SessionDetails} moduleName="تفاصيل الجلسة" />} />
                </Route>
              </Route>
              
              {/* Customers */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.customers} />}>
                <Route path="customers">
                    <Route index element={<LazyRoute component={CustomersList} moduleName="العملاء" />} />
                    <Route path="new" element={<LazyRoute component={CreateCustomer} moduleName="عميل جديد" />} />
                    <Route path=":id" element={<LazyRoute component={CustomerDetails} moduleName="تفاصيل العميل" />} />
                    <Route path=":id/edit" element={<LazyRoute component={EditCustomer} moduleName="تعديل العميل" />} />
                </Route>
              </Route>

              {/* Potential Customers (Leads) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.potentialCustomers} />}>
                <Route path="potential-customers" element={<LazyRoute component={PotentialCustomersList} moduleName="العملاء المحتملون" />} />
              </Route>

              {/* Items (Products) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.items} />}>
                <Route path="items">
                    <Route index element={<LazyRoute component={ItemsList} moduleName="المنتجات" />} />
                    <Route path="new" element={<LazyRoute component={CreateItem} moduleName="منتج جديد" />} />
                    <Route path=":id" element={<LazyRoute component={ItemDetails} moduleName="تفاصيل المنتج" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateItem} moduleName="تعديل المنتج" />} />
                </Route>
              </Route>

              {/* Production Orders (أوامر التصنيع) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.productionOrders} />}>
                <Route path="production-orders">
                    <Route index element={<LazyRoute component={ProductionOrdersList} moduleName="أوامر التصنيع" />} />
                    <Route path="new" element={<LazyRoute component={CreateProductionOrder} moduleName="أمر تصنيع جديد" />} />
                    <Route path=":id" element={<LazyRoute component={ProductionOrderDetails} moduleName="تفاصيل أمر التصنيع" />} />
                </Route>
              </Route>

              {/* Delivery Orders (أوامر التسليم) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.deliveryOrders} />}>
                <Route path="delivery-orders">
                    <Route index element={<LazyRoute component={DeliveryOrdersList} moduleName="أوامر التسليم" />} />
                    <Route path=":id" element={<LazyRoute component={DeliveryOrderDetails} moduleName="تفاصيل أمر التسليم" />} />
                </Route>
              </Route>

              {/* Purchase Orders */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.purchaseOrders} />}>
                <Route path="purchase-orders">
                    <Route index element={<LazyRoute component={PurchaseOrdersList} moduleName="طلبات الشراء" />} />
                    <Route path="new" element={<LazyRoute component={CreatePurchaseOrder} moduleName="طلب شراء جديد" />} />
                    <Route path=":id" element={<LazyRoute component={PurchaseOrderDetails} moduleName="تفاصيل طلب الشراء" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreatePurchaseOrder} moduleName="تعديل طلب الشراء" />} />
                </Route>
                <Route path="customer-returns">
                    <Route index element={<LazyRoute component={CustomerReturnsList} moduleName="المرتجعات" />} />
                    <Route path="new" element={<LazyRoute component={CreateCustomerReturn} moduleName="إنشاء مرتجع" />} />
                    <Route path=":id" element={<LazyRoute component={CustomerReturnDetails} moduleName="تفاصيل المرتجع" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateCustomerReturn} moduleName="تعديل المرتجع" />} />
                </Route>
              </Route>

              {/* Suppliers */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.suppliers} />}>
                <Route path="suppliers">
                    <Route index element={<LazyRoute component={SuppliersList} moduleName="الموردين" />} />
                    <Route path="new" element={<LazyRoute component={CreateSupplier} moduleName="مورد جديد" />} />
                    <Route path=":id/edit" element={<LazyRoute component={CreateSupplier} moduleName="تعديل المورد" />} />
                    <Route path=":id" element={<LazyRoute component={SupplierDetails} moduleName="تفاصيل المورد" />} />
                </Route>
              </Route>

              {/* Storage Areas */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.storageAreas} />}>
                <Route path="storage-areas" element={<LazyRoute component={StorageAreasList} moduleName="مناطق التخزين" />} />
                <Route path="stock-transfers" element={<LazyRoute component={StockTransfers} moduleName="تحويل المخزون" />} />
                <Route path="stock-report" element={<LazyRoute component={StockReport} moduleName="رصيد المخازن" />} />
              </Route>
              
              {/* Financial Management */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.accounts} />}>
                <Route path="accounts">
                    <Route index element={<LazyRoute component={AccountsPage} moduleName="الحسابات" />} />
                    <Route path=":id" element={<LazyRoute component={AccountDetails} moduleName="تفاصيل الحساب" />} />
                    <Route path="payment-gateways" element={<LazyRoute component={PaymentGatewaysPage} moduleName="إدارة بوابات الدفع" />} />
                </Route>
                <Route path="expenses" element={<LazyRoute component={ExpensesEntryPage} moduleName="تسجيل المصروفات" />} />
                <Route path="notes" element={<LazyRoute component={NotesPage} moduleName="الملاحظات" />} />
                <Route path="payment-requests">
                    <Route index element={<LazyRoute component={PaymentRequestsPage} moduleName="طلبات الدفع" />} />
                    <Route path="cr/:id" element={<LazyRoute component={CRPaymentRequestDetails} moduleName="تفاصيل طلب دفع مرتجع" />} />
                    <Route path="po/:id" element={<LazyRoute component={POPaymentRequestDetails} moduleName="تفاصيل طلب دفع شراء" />} />
                    <Route path="dr/:id" element={<LazyRoute component={DRPaymentRequestDetails} moduleName="تفاصيل طلب دفع صرف" />} />
                </Route>
              </Route>

              {/* Collections (بوابات القبض) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.collections} />}>
                <Route path="collections" element={<LazyRoute component={CollectionsPage} moduleName="بوابات القبض" />} />
              </Route>

              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.accounts} />}>
                <Route path="cr-payment-requests" element={<Navigate to="/payment-requests" replace />} />
                <Route path="cr-payment-requests/:id" element={<LegacyCRPaymentDetailRedirect />} />
                <Route path="po-payment-requests" element={<Navigate to="/payment-requests" replace />} />
                <Route path="po-payment-requests/:id" element={<LegacyPOPaymentDetailRedirect />} />
              </Route>

              {/* Journal Entries (سندات القيد) */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.journalEntries} />}>
                <Route path="journal-entries">
                    <Route index element={<LazyRoute component={JournalEntriesList} moduleName="سندات القيد" />} />
                    <Route path="new" element={<LazyRoute component={CreateJournalEntry} moduleName="قيد جديد" />} />
                    <Route path=":id" element={<LazyRoute component={JournalEntryDetails} moduleName="تفاصيل القيد" />} />
                </Route>
              </Route>

              {/* Recurring Accruals & Fixed-Asset Depreciation */}
              <Route element={<PermissionRoute permission={ROUTE_PERMISSIONS.accounts} />}>
                <Route path="accrual-templates" element={<LazyRoute component={AccrualTemplatesList} moduleName="قوالب الاستحقاق" />} />
                <Route path="fixed-assets" element={<LazyRoute component={FixedAssetsList} moduleName="الأصول الثابتة" />} />
                <Route path="month-end-drafts" element={<LazyRoute component={MonthEndDraftsPage} moduleName="مسودّات آخر الشهر" />} />
              </Route>

              </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
           <AppContent />
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}

export default App;
