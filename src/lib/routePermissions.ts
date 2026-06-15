/**
 * Centralized route-to-permission mapping.
 * Used by PermissionRoute to check user access.
 */
/**
 * Each route is gated by the matching screen's action-permission catalog
 * `.view` key (the manager grants these via /roles-permissions). A value may
 * be an array (any-of). The manager (superuser) bypasses all of these.
 */
export const ROUTE_PERMISSIONS = {
  // Customer Management
  opportunities: "opportunities.view",
  measurements: "measurements.view",
  sellOrders: "sell_orders.view",
  customers: "customers.view",
  // Potential customers share the customers data endpoint, so viewing them
  // requires customers.view (potential_customers.view alone won't load data).
  potentialCustomers: ["customers.view", "potential_customers.view"],
  customerReturns: "customer_returns.view",

  // Employee Management
  employees: "employees.view",
  sessions: "sessions.view",
  custody: "custody.view",
  expenses: "expenses_requests.view",
  rolesPermissions: "employees.assign_permissions",

  // Inventory Management
  items: "items.view",
  productionOrders: "production_orders.view",
  deliveryOrders: "delivery_orders.view",
  purchaseOrders: "purchase_orders.view",
  suppliers: "suppliers.view",
  storageAreas: "storage_areas.view",
  stockTransfers: "stock_transfers.view",
  stockReport: ["stock_report.view", "items.stock_report"],

  // Accounts Management
  accounts: "accounts.view",
  expensesEntry: "expenses.view",
  notes: "notes.view",
  paymentRequests: "payment_requests.view",
  journalEntries: "journal_entries.view",
  paymentGateways: "payment_gateways.view",
  collections: "collections.view",
  accrualTemplates: "accrual_templates.view",
  fixedAssets: "fixed_assets.view",
  monthEndDrafts: ["month_end_drafts.view", "accrual_templates.view"],
  supplierPayments: "supplier_payments.view",

  // General
  approvals: "approvals.view",
} as const;

export type PermissionKey = keyof typeof ROUTE_PERMISSIONS;
