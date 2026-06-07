// Server Configuration
// Central file for API base URL and environment settings

export const SERVER_CONFIG = {
  // In development, we use the proxy (empty base) to avoid CORS.
  // In production, we explicitly point to the content server or keep relative if sharing domain.
  // In production, we also use the proxy (empty base) to let Vercel handle the routing.
  // This bypasses CORS issues because the browser sees a Same-Origin request.
  BASE_URL: "",
  API_PREFIX: "/api",
};

export const API_BASE_URL = `${SERVER_CONFIG.BASE_URL}${SERVER_CONFIG.API_PREFIX}`;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/auth/jwt/create/",
    REFRESH: "/auth/jwt/refresh/",
    VERIFY: "/auth/jwt/verify/",
    USER_PROFILE: "/auth/users/me/",
    CHANGE_PASSWORD: "/auth/users/set_password/",
  },

  // Dashboard
  DASHBOARD: {
    STATS: "/dashboard/stats",
  },

  // Opportunities (Custom V1)
  OPPORTUNITIES: {
    LIST: "/custom-v1/opportunities/",
    DETAILS: (id: string) => `/custom-v1/opportunities/${id}/`,
    CREATE: "/custom-v1/opportunities/",
    UPDATE: (id: string) => `/custom-v1/opportunities/${id}/`,
    DELETE: (id: string) => `/custom-v1/opportunities/${id}/`,
    REQUEST_MEASUREMENTS: (id: string) =>
      `/custom-v1/opportunities/${id}/request_dim/`,
    REQUEST_WORK_ORDER: (id: string) =>
      `/custom-v1/opportunities/${id}/request-work-order`,
    CREATE_SELL_ORDER: (id: string) =>
      `/custom-v1/opportunities/${id}/create-sell-order/`,
    ACCEPT: (id: string | number) => `/custom-v1/opportunities/${id}/accept/`,
    REJECT: (id: string | number) => `/custom-v1/opportunities/${id}/reject/`,
    VERIFY: (id: string | number) => `/custom-v1/opportunities/${id}/verify/`,
    PRINT: (id: string | number) => `/custom-v1/opportunities/${id}/print/`,
  },

  // Dimension Requests
  DIM_REQUESTS: {
    LIST: "/custom-v1/dim_requests/",
    DETAILS: (id: string) => `/custom-v1/dim_requests/${id}/`,
  },

  // Opportunity Dimensions
  OPPORTUNITY_DIMENSIONS: {
    CREATE: "/opportunity-dimensions/",
  },

  // Customers (Custom V1)
  CUSTOMERS: {
    CHECK: (phone: string) => `/custom-v1/customers/check/${phone}/`,
    CREATE: "/custom-v1/customers/",
    LIST: "/custom-v1/customers/",
    DETAILS: (id: string | number) => `/custom-v1/customers/${id}/`,
    UPDATE: (id: string | number) => `/custom-v1/customers/${id}/`,
    ADD_PAYMENT: (id: string | number) =>
      `/custom-v1/customers/${id}/add-payment/`,
    SYNC_TO_ODOO: (id: string | number) =>
      `/custom-v1/customers/${id}/sync-to-odoo/`,
    SYNC_ALL_TO_ODOO: "/custom-v1/customers/sync-all-to-odoo/",
    STATEMENT: (id: string | number) =>
      `/custom-v1/customers/${id}/statement/`,
  },

  // Work Orders
  WORK_ORDERS: {
    LIST: "/work-orders",
    DETAILS: (id: string) => `/work-orders/${id}`,
    CREATE: "/work-orders",
    ADD_EXPENSE: (id: string) => `/work-orders/${id}/expenses`,
    ADD_PAYMENT: (id: string) => `/work-orders/${id}/payments`,
  },

  // Sell Orders (Sales Orders API)
  SELL_ORDERS: {
    LIST: "/custom-v1/sell_orders/",
    DETAILS: (id: string | number) => `/custom-v1/sell_orders/${id}/`,
    CREATE: "/custom-v1/sell_orders/",
    UPDATE: (id: string | number) => `/custom-v1/sell_orders/${id}/`,
    ACCEPT: (id: string | number) => `/custom-v1/sell_orders/${id}/accept/`,
    REJECT: (id: string | number) => `/custom-v1/sell_orders/${id}/reject/`,
    VERIFY: (id: string | number) => `/custom-v1/sell_orders/${id}/verify/`,
    PRINT: (id: string | number) => `/custom-v1/sell_orders/${id}/print/`,
    UPLOAD_INVOICE: (id: string | number) =>
      `/custom-v1/sell_orders/${id}/upload-invoice/`,
    PUSH_TO_ODOO: (id: string | number) =>
      `/custom-v1/sell_orders/${id}/push-to-odoo/`,
  },

  // Custody (Custodian Transaction Requests)
  CUSTODY: {
    LIST: "/custom-v1/custodian-transaction-requests/",
    DETAILS: (id: string | number) =>
      `/custom-v1/custodian-transaction-requests/${id}/`,
    CREATE: "/custom-v1/custodian-transaction-requests/",
    UPDATE: (id: string | number) =>
      `/custom-v1/custodian-transaction-requests/${id}/`,
    ACCEPT: (id: string | number) =>
      `/custom-v1/custodian-transaction-requests/${id}/accept/`,
    REJECT: (id: string | number) =>
      `/custom-v1/custodian-transaction-requests/${id}/reject/`,
    VERIFY: (id: string | number) =>
      `/custom-v1/custodian-transaction-requests/${id}/verify/`,
  },

  // Employee Expenses
  EMPLOYEE_EXPENSES: {
    LIST: "/employee-expenses",
    DETAILS: (id: string) => `/employee-expenses/${id}`,
    CREATE: "/employee-expenses",
    UPDATE: (id: string) => `/employee-expenses/${id}`,
  },

  // Approvals (Unified)
  APPROVALS: {
    LIST: "/custom-v1/approvals/",
    DETAILS: (id: string | number) => `/custom-v1/approvals/${id}/`,
    APPROVE: (id: string | number) => `/custom-v1/approvals/${id}/approve/`,
    REJECT: (id: string | number) => `/custom-v1/approvals/${id}/reject/`,
  },

  // Products (Items)
  ITEMS: {
    LIST: "/custom-v1/items/",
    DETAILS: (id: string | number) => `/custom-v1/items/${id}/`,
    CREATE: "/custom-v1/items/",
    UPDATE: (id: string | number) => `/custom-v1/items/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/items/${id}/`,
  },

  // Production Orders (أوامر التصنيع)
  PRODUCTION_ORDERS: {
    LIST: "/custom-v1/production-orders/",
    DETAILS: (id: string | number) => `/custom-v1/production-orders/${id}/`,
    CREATE: "/custom-v1/production-orders/",
    ADD_MATERIAL: (id: string | number) =>
      `/custom-v1/production-orders/${id}/add-material/`,
    CLOSE: (id: string | number) =>
      `/custom-v1/production-orders/${id}/close/`,
    PRINT: (id: string | number) =>
      `/custom-v1/production-orders/${id}/print/`,
  },

  // Delivery Orders (أوامر التسليم)
  DELIVERY_ORDERS: {
    LIST: "/custom-v1/delivery-orders/",
    DETAILS: (id: string | number) => `/custom-v1/delivery-orders/${id}/`,
    DELIVER: (id: string | number) =>
      `/custom-v1/delivery-orders/${id}/deliver/`,
    PRINT: (id: string | number) =>
      `/custom-v1/delivery-orders/${id}/print/`,
  },

  // Purchase Orders
  PURCHASE_ORDERS: {
    LIST: "/custom-v1/purchase-orders/",
    DETAILS: (id: string | number) => `/custom-v1/purchase-orders/${id}/`,
    CREATE: "/custom-v1/purchase-orders/",
    UPDATE: (id: string | number) => `/custom-v1/purchase-orders/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/purchase-orders/${id}/`,
    ACCEPT: (id: string | number) => `/custom-v1/purchase-orders/${id}/accept/`,
    REJECT: (id: string | number) => `/custom-v1/purchase-orders/${id}/reject/`,
    VERIFY: (id: string | number) => `/custom-v1/purchase-orders/${id}/verify/`,
    RECEIVE: (id: string | number) =>
      `/custom-v1/purchase-orders/${id}/receive/`,
    PRINT: (id: string | number) => `/custom-v1/purchase-orders/${id}/print/`,
    UPLOAD_INVOICE: (id: string | number) =>
      `/custom-v1/purchase-orders/${id}/upload-invoice/`,
  },

  // Suppliers
  SUPPLIERS: {
    LIST: "/custom-v1/suppliers/",
    DETAILS: (id: string | number) => `/custom-v1/suppliers/${id}/`,
    CREATE: "/custom-v1/suppliers/",
    UPDATE: (id: string | number) => `/custom-v1/suppliers/${id}/`,
    STATEMENT: (id: string | number) =>
      `/custom-v1/suppliers/${id}/statement/`,
  },

  // Accounts (Chart of Accounts)
  ACCOUNTS: {
    LIST: "/custom-v1/accounts/",
    DETAILS: (id: string | number) => `/custom-v1/accounts/${id}/`,
    CREATE: "/custom-v1/accounts/",
    NEXT_CHILD_NUMBER: (id: string | number) =>
      `/custom-v1/accounts/${id}/next-child-number/`,
    STATEMENT: (id: string | number) =>
      `/custom-v1/accounts/${id}/statement/`,
  },

  // Disbursement Requests
  DISBURSEMENT_REQUESTS: {
    LIST: "/custom-v1/disbursement_requests/",
    DETAILS: (id: string | number) => `/custom-v1/disbursement_requests/${id}/`,
    CREATE: "/custom-v1/disbursement_requests/",
    ACCEPT: (id: string | number) =>
      `/custom-v1/disbursement_requests/${id}/accept/`,
    REJECT: (id: string | number) =>
      `/custom-v1/disbursement_requests/${id}/reject/`,
    VERIFY: (id: string | number) =>
      `/custom-v1/disbursement_requests/${id}/verify/`,
  },

  // Disbursement Types
  DISBURSEMENT_TYPES: {
    LIST: "/custom-v1/disbursement_types/",
  },

  // Employees (Staff Management)
  EMPLOYEES: {
    LIST: "/custom-v1/employees/",
    DETAILS: (id: string | number) => `/custom-v1/employees/${id}/`,
    CREATE: "/custom-v1/employees/",
    UPDATE: (id: string | number) => `/custom-v1/employees/${id}/`,
    TOGGLE_ACTIVE: (id: string | number) =>
      `/custom-v1/employees/${id}/toggle-active/`,
  },

  // Permissions
  PERMISSIONS: {
    LIST: "/custom-v1/permissions/",
  },

  // Permission Groups
  PERMISSION_GROUPS: {
    LIST: "/custom-v1/permission-groups/",
  },

  // Sessions (Salesman Shifts)
  SESSIONS: {
    LIST: "/custom-v1/sessions/",
    DETAILS: (id: string | number) => `/custom-v1/sessions/${id}/`,
    CLOSE: (id: string | number) => `/custom-v1/sessions/${id}/close/`,
  },

  // Payment Gateways
  BANKS: {
    LIST: "/custom-v1/banks/",
    DETAILS: (id: string | number) => `/custom-v1/banks/${id}/`,
    CREATE: "/custom-v1/banks/",
    UPDATE: (id: string | number) => `/custom-v1/banks/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/banks/${id}/`,
  },
  BNPL: {
    LIST: "/custom-v1/buy-now-pay-laters/",
    DETAILS: (id: string | number) => `/custom-v1/buy-now-pay-laters/${id}/`,
    CREATE: "/custom-v1/buy-now-pay-laters/",
    UPDATE: (id: string | number) => `/custom-v1/buy-now-pay-laters/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/buy-now-pay-laters/${id}/`,
  },
  CARD_MACHINES: {
    LIST: "/custom-v1/card-machines/",
    DETAILS: (id: string | number) => `/custom-v1/card-machines/${id}/`,
    CREATE: "/custom-v1/card-machines/",
    UPDATE: (id: string | number) => `/custom-v1/card-machines/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/card-machines/${id}/`,
  },
  CASH_REGISTERS: {
    LIST: "/custom-v1/cash-registers/",
    DETAILS: (id: string | number) => `/custom-v1/cash-registers/${id}/`,
    CREATE: "/custom-v1/cash-registers/",
    UPDATE: (id: string | number) => `/custom-v1/cash-registers/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/cash-registers/${id}/`,
  },

  // Storage Areas
  STORAGE_AREAS: {
    LIST: "/custom-v1/storage-areas/",
    CREATE: "/custom-v1/storage-areas/",
    DETAILS: (id: string | number) => `/custom-v1/storage-areas/${id}/`,
    UPDATE: (id: string | number) => `/custom-v1/storage-areas/${id}/`,
    DELETE: (id: string | number) => `/custom-v1/storage-areas/${id}/`,
  },

  // Customer Returns
  CUSTOMER_RETURNS: {
    LIST: "/custom-v1/customer-returns/",
    DETAILS: (id: string | number) => `/custom-v1/customer-returns/${id}/`,
    CREATE: "/custom-v1/customer-returns/",
    UPDATE: (id: string | number) => `/custom-v1/customer-returns/${id}/`,
  },

  // Payment Requests — Customer Returns
  CR_PAYMENT_REQUESTS: {
    LIST: "/custom-v1/cr-payment-requests/",
    DETAILS: (id: string | number) => `/custom-v1/cr-payment-requests/${id}/`,
    MARK_DONE: (id: string | number) =>
      `/custom-v1/cr-payment-requests/${id}/mark-done/`,
  },

  // Payment Requests — Purchase Orders
  PO_PAYMENT_REQUESTS: {
    LIST: "/custom-v1/po-payment-requests/",
    DETAILS: (id: string | number) => `/custom-v1/po-payment-requests/${id}/`,
    MARK_DONE: (id: string | number) =>
      `/custom-v1/po-payment-requests/${id}/mark-done/`,
  },

  // Payment Requests — Disbursement Requests
  DR_PAYMENT_REQUESTS: {
    LIST: "/custom-v1/dr-payment-requests/",
    DETAILS: (id: string | number) => `/custom-v1/dr-payment-requests/${id}/`,
    MARK_DONE: (id: string | number) =>
      `/custom-v1/dr-payment-requests/${id}/mark-done/`,
  },

  // Journal Entries (سندات القيد)
  JOURNAL_ENTRIES: {
    LIST: "/custom-v1/journal-entries/",
    DETAILS: (id: string | number) => `/custom-v1/journal-entries/${id}/`,
    CREATE: "/custom-v1/journal-entries/",
    UPLOAD_ATTACHMENT: (id: string | number) =>
      `/custom-v1/journal-entries/${id}/upload-attachment/`,
  },
};
