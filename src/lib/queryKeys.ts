/**
 * Centralized Query Keys
 * 
 * All React Query keys are defined here for:
 * - Consistency across the application
 * - Easier refactoring and maintenance
 * - Better cache invalidation
 */

// =====================
// Customers
// =====================
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: object) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...customerKeys.details(), id] as const,
};

// =====================
// Employees
// =====================
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters?: object) => filters ? [...employeeKeys.lists(), filters] as const : employeeKeys.lists(),
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...employeeKeys.details(), id] as const,
  permissions: () => [...employeeKeys.all, 'permissions'] as const,
  permissionGroups: (pageSize?: number) => [...employeeKeys.all, 'permission-groups', pageSize] as const,
};

// =====================
// Items (Products)
// =====================
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: object) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...itemKeys.details(), id] as const,
};

// =====================
// Opportunities
// =====================
export const opportunityKeys = {
  all: ['opportunities'] as const,
  lists: () => [...opportunityKeys.all, 'list'] as const,
  list: (filters: object) => [...opportunityKeys.lists(), filters] as const,
  details: () => [...opportunityKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...opportunityKeys.details(), id] as const,
};

// =====================
// Branches (الفروع)
// =====================
export const branchKeys = {
  all: ['branches'] as const,
  lists: () => [...branchKeys.all, 'list'] as const,
  list: (filters?: object) => filters ? [...branchKeys.lists(), filters] as const : branchKeys.lists(),
};

export const deliveryResponsibleKeys = {
  all: ['deliveryResponsibles'] as const,
  lists: () => [...deliveryResponsibleKeys.all, 'list'] as const,
  list: () => [...deliveryResponsibleKeys.lists()] as const,
};

// =====================
// Sell Orders
// =====================
export const sellOrderKeys = {
  all: ['sell-orders'] as const,
  lists: () => [...sellOrderKeys.all, 'list'] as const,
  list: (filters: object) => [...sellOrderKeys.lists(), filters] as const,
  details: () => [...sellOrderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...sellOrderKeys.details(), id] as const,
};

// =====================
// Purchase Orders
// =====================
export const purchaseOrderKeys = {
  all: ['purchase-orders'] as const,
  lists: () => [...purchaseOrderKeys.all, 'list'] as const,
  list: (filters: object) => [...purchaseOrderKeys.lists(), filters] as const,
  details: () => [...purchaseOrderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...purchaseOrderKeys.details(), id] as const,
};

// =====================
// Production Orders (أوامر التصنيع)
// =====================
export const productionOrderKeys = {
  all: ['production-orders'] as const,
  lists: () => [...productionOrderKeys.all, 'list'] as const,
  list: (filters: object) => [...productionOrderKeys.lists(), filters] as const,
  details: () => [...productionOrderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productionOrderKeys.details(), id] as const,
};

// =====================
// Delivery Orders (أوامر التسليم)
// =====================
export const deliveryOrderKeys = {
  all: ['delivery-orders'] as const,
  lists: () => [...deliveryOrderKeys.all, 'list'] as const,
  list: (filters: object) => [...deliveryOrderKeys.lists(), filters] as const,
  details: () => [...deliveryOrderKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...deliveryOrderKeys.details(), id] as const,
};

// =====================
// Suppliers
// =====================
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: object) => [...supplierKeys.lists(), filters] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...supplierKeys.details(), id] as const,
};

// =====================
// Sessions
// =====================
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: object) => [...sessionKeys.lists(), filters] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...sessionKeys.details(), id] as const,
};

// =====================
// Measurements
// =====================
export const measurementKeys = {
  all: ['measurements'] as const,
  lists: () => [...measurementKeys.all, 'list'] as const,
  list: (filters: object) => [...measurementKeys.lists(), filters] as const,
};

// =====================
// Custody
// =====================
export const custodyKeys = {
  all: ['custody'] as const,
  lists: () => [...custodyKeys.all, 'list'] as const,
  list: (filters: object) => [...custodyKeys.lists(), filters] as const,
  details: () => [...custodyKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...custodyKeys.details(), id] as const,
};

// =====================
// Disbursements (Employee Expenses)
// =====================
export const disbursementKeys = {
  all: ['disbursements'] as const,
  lists: () => [...disbursementKeys.all, 'list'] as const,
  list: (filters: object) => [...disbursementKeys.lists(), filters] as const,
  details: () => [...disbursementKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...disbursementKeys.details(), id] as const,
};

// =====================
// Storage Areas
// =====================
export const storageAreaKeys = {
  all: ['storage-areas'] as const,
  lists: () => [...storageAreaKeys.all, 'list'] as const,
  list: (filters: object) => [...storageAreaKeys.lists(), filters] as const,
};

// =====================
// Customer Returns
// =====================
export const customerReturnKeys = {
  all: ['customer-returns'] as const,
  lists: () => [...customerReturnKeys.all, 'list'] as const,
  list: (filters: object) => [...customerReturnKeys.lists(), filters] as const,
  details: () => [...customerReturnKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...customerReturnKeys.details(), id] as const,
};

// =====================
// CR Payment Requests (مرتجعات)
// =====================
export const crPaymentRequestKeys = {
  all: ['cr-payment-requests'] as const,
  lists: () => [...crPaymentRequestKeys.all, 'list'] as const,
  list: (filters: object) => [...crPaymentRequestKeys.lists(), filters] as const,
  details: () => [...crPaymentRequestKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...crPaymentRequestKeys.details(), id] as const,
};

// =====================
// PO Payment Requests (طلبات شراء)
// =====================
export const poPaymentRequestKeys = {
  all: ['po-payment-requests'] as const,
  lists: () => [...poPaymentRequestKeys.all, 'list'] as const,
  list: (filters: object) => [...poPaymentRequestKeys.lists(), filters] as const,
  details: () => [...poPaymentRequestKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...poPaymentRequestKeys.details(), id] as const,
};

// =====================
// DR Payment Requests (طلبات صرف)
// =====================
export const drPaymentRequestKeys = {
  all: ['dr-payment-requests'] as const,
  lists: () => [...drPaymentRequestKeys.all, 'list'] as const,
  list: (filters: object) => [...drPaymentRequestKeys.lists(), filters] as const,
  details: () => [...drPaymentRequestKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...drPaymentRequestKeys.details(), id] as const,
};

// =====================
// Collections (Customer Payments / قبض)
// =====================
export const collectionKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionKeys.all, 'list'] as const,
  list: (filters?: object) => filters ? [...collectionKeys.lists(), filters] as const : collectionKeys.lists(),
};

// =====================
// Dashboard
// =====================
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// =====================
// Payment Gateways
// =====================
export const bankKeys = {
  all: ['banks'] as const,
  lists: () => [...bankKeys.all, 'list'] as const,
  list: (filters: object) => [...bankKeys.lists(), filters] as const,
};

export const bnplKeys = {
  all: ['bnpl'] as const,
  lists: () => [...bnplKeys.all, 'list'] as const,
  list: (filters: object) => [...bnplKeys.lists(), filters] as const,
};

export const cardMachineKeys = {
  all: ['card-machines'] as const,
  lists: () => [...cardMachineKeys.all, 'list'] as const,
  list: (filters: object) => [...cardMachineKeys.lists(), filters] as const,
};

export const cashRegisterKeys = {
  all: ['cash-registers'] as const,
  lists: () => [...cashRegisterKeys.all, 'list'] as const,
  list: (filters: object) => [...cashRegisterKeys.lists(), filters] as const,
};

// =====================
// Journal Entries
// =====================
export const journalEntryKeys = {
  all: ['journal-entries'] as const,
  lists: () => [...journalEntryKeys.all, 'list'] as const,
  list: (filters: object) => [...journalEntryKeys.lists(), filters] as const,
  details: () => [...journalEntryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...journalEntryKeys.details(), id] as const,
};

// =====================
// Accounts
// =====================
export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  list: (filters: object) => [...accountKeys.lists(), filters] as const,
  details: () => [...accountKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...accountKeys.details(), id] as const,
};

// =====================
// Approvals (Unified)
// =====================
export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (filters: object) => [...approvalKeys.lists(), filters] as const,
  details: () => [...approvalKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...approvalKeys.details(), id] as const,
};
