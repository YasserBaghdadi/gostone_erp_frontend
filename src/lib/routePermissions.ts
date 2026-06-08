/**
 * Centralized route-to-permission mapping.
 * Used by PermissionRoute to check user access.
 */
export const ROUTE_PERMISSIONS = {
  // Customer Management
  opportunities: "opportunity_management",
  measurements: "dim_management",
  sellOrders: "sell_order_management",
  customers: "customer_management",
  potentialCustomers: "customer_management",
  
  // Employee Management
  employees: "employee_management",
  sessions: "session_management",
  custody: "custodian_transaction_request",
  expenses: "disbursement_request_management",
  
  // Inventory Management
  items: "items_management",
  productionOrders: "items_management",
  deliveryOrders: "items_management",
  purchaseOrders: "purchase_order_management",
  suppliers: "suppliers_management",
  storageAreas: "storage_areas_management",
  
  // Accounts Management
  accounts: "accounts_management",
  journalEntries: "journal_entries_management",
  paymentGateways: "payment_gateways_management",
  collections: "payment_gateways_management",
  
  // General
  approvals: "approval_management",
} as const;

export type PermissionKey = keyof typeof ROUTE_PERMISSIONS;
