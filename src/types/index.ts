export type OpportunityStatus = 'new' | 'measurements_requested' | 'measurements_completed' | 'priced' | 'work_order_pending' | 'converted' | 'rejected';

export type WorkOrderStatus = 'active' | 'completed' | 'on_hold' | 'cancelled';

// Unified Approval Types
export type ApprovalStatus = 'pending' | 'in_progress' | 'approved' | 'rejected';

export interface ApprovalStep {
  id: number;
  order: number;
  name: string;
  is_required: boolean;
  send_notification: boolean;
}

export interface ApprovalActionItem {
  id: number;
  step: number;
  action: 'approved' | 'rejected';
  performed_by: number;
  performed_by_name: string;
  comment: string;
  created_at: string;
}

export interface Approval {
  id: number;
  workflow: number;
  workflow_name: string;
  content_type: number;
  content_type_label: string;
  object_id: number;
  status: ApprovalStatus;
  current_step: ApprovalStep;
  created_at: string;
  updated_at: string;
}

export interface ApprovalDetails extends Approval {
  actions: ApprovalActionItem[];
}

// Reusing JournalEntry structure for consistency as the API returns nested journal entries now
export interface CustomerTransaction {
  id: number;
  created_at: string;
  items: JournalEntryItem[];
}

export interface CustomerAccount {
  id: number;
  customer: number;
  number: string;
  balance: string;
  total_debit: string;
  total_credit: string;
  total: string;
  created_at: string;
  updated_at: string;
  transactions: CustomerTransaction[];
}

export interface Customer {
  id: number;
  phone_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  is_active?: boolean;
  date_joined?: string;
  phone_number2?: string | null;
  phone_number3?: string | null;
  last_visit?: string | null;
  visit_repetition_days?: number;
  color?: string;
  salesmen?: Salesman[];
  /** عميل محتمل (lead) أُضيف عبر الفرص ولم يُحوَّل إلى عميل فعلي بعد */
  is_potential?: boolean;
  /** نوع العميل: فرد (individual) أو شركة (company). الافتراضي فرد. */
  customer_type?: "individual" | "company";

  // Legal & Address Info
  vat_number?: string | null;
  vat_number_file?: string | null;
  tax_number?: number | null; // Changed to number based on JSON
  tax_file?: string | null;
  cr_number?: string | null;
  cr_file?: string | null;
  /** عنوان مفكك للباك اند (NATIONAL ADDRESS PARTS) */
  street?: string | null;
  building_number?: string | null;
  district?: string | null;
  secondary_number?: string | null;
  postal_code?: string | null;
  city?: string | null;

  /** عنوان نصي (Legacy / fallback) */
  address?: string | null;
  address_file?: string | null;
  
  // Financials
  account?: CustomerAccount;

  // Approvals (timestamp-based: null = not done, value = done)
  accepted_at?: string | null;
  verified_at?: string | null;
  rejected_at?: string | null;
  accepted_by?: number | null;
  verified_by?: number | null;
  rejected_by?: number | null;
  rejected_reason?: string;
  
  // Legacy fields (deprecated or mapped)
  commercial_registration?: string | null;
  national_address?: string | null;
}

export interface Salesman {
  id: number;
  user: number;
  discount_percentage?: string;
  phone_number?: string;
  first_name: string;
  last_name: string;
}

// Employee (Staff) Management
export interface Permission {
  id: number;
  codename: string;
  name: string;
}

export interface PermissionGroup {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone: string; // New spec uses 'phone' but let's keep phone_number for types consistency if mapped, or add both
  email?: string; // Optional now
  is_active: boolean | string;
  gender?: string; // New field
  permission_groups?: string | PermissionGroup[]; // Updated to allow array of objects
  groups?: PermissionGroup[]; // Keep for compatibility if we map it, likely removed in raw response
  date_joined?: string;
  password?: string; // Optional, only for creation/update payload
}

// Sessions (Salesman Shifts)
export interface Session {
  id: number;
  salesman: Salesman;
  created_at: string;
  closed_at?: string;
  sell_orders_total: string;
  sell_orders_count: string;
  opportunities_total: string;
  opportunities_count: string;
}

export interface Dimension {
  id: number;
  opportunity: number;
  session: number;
  file: string;
  notes: string;
  created_at: string;
}

export interface OpportunityItem {
  id?: number;
  opportunity?: number;
  item?: number | { id: number; name: string;[key: string]: any }; // Updated to match latest API where item is returned as object
  item_id?: number; // For payload compatibility
  quantity: string | number;
  unit_name: string;
  unit_factor?: string; // Added to match API response
  unit_price_before_tax?: string;
  unit_price_after_tax?: string;
  total_price_before_tax?: string;
  total_price_after_tax?: string;
  counter_offer_before_tax?: string;
  counter_offer_after_tax?: string;
  dis_percentage?: string;
  dis_total_before_tax?: string;
  dis_total_after_tax?: string;
  notes?: string;
  // UI helpers
  name?: string; 
  price?: number; // fallback for UI components expecting 'price'
  unit?: string; // fallback for UI components expecting 'unit'
}

export interface Opportunity {
  id: number;
  customer?: Customer;
  salesman?: Salesman;
  notes?: string;
  location?: string;
  interest_level?: string;
  total_price_before_tax?: string;
  total_price_after_tax?: string;
  total_counter_offer?: string;
  need_dim_order?: boolean;
  have_sell_order?: boolean;
  item_count?: number;
  items: OpportunityItem[];
  dimensions?: Dimension[];
  created_at?: string;
  dis_percentage?: string; // Global discount percentage
  status?: string; // API doesn't strictly return status in the new v1 example, but might be there.
  
  // UI Helpers (optional mapping)
  clientName?: string;
  clientPhone?: string;
  totalPrice?: number;

  // Approvals (timestamp-based: null = not done, value = done)
  accepted_at?: string | null;
  verified_at?: string | null;
  rejected_at?: string | null;
  accepted_by?: number | null;
  verified_by?: number | null;
  rejected_by?: number | null;
}

export interface Expense {
  id: string;
  opportunityId: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Payment {
  id: string;
  opportunityId: string;
  amount: number;
  date: string;
  method?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface WorkOrder {
  id: string;
  opportunityId: string;
  clientName: string;
  clientPhone: string;
  location: string;
  items: OpportunityItem[]; // Reusing OpportunityItem might be tricky if structure differs
  expenses: Expense[];
  payments: Payment[];
  totalPrice: number;
  status: WorkOrderStatus;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export const INTEREST_LEVELS = {
  not_interested: { label: 'غير مهتم', color: 'bg-red-100 text-red-800' },
  interested: { label: 'مهتم', color: 'bg-yellow-100 text-yellow-800' },
  very_interested: { label: 'مهتم جداً', color: 'bg-green-100 text-green-800' },
};

export const STATUS_LABELS: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  new: { label: 'جديدة', color: 'secondary' },
  measurements_requested: { label: 'طلب مقاسات', color: 'warning' },
  measurements_completed: { label: 'تم الرفع', color: 'info' },
  priced: { label: 'تم التسعير', color: 'primary' as "default" },
  work_order_pending: { label: 'بانتظار الموافقة', color: 'warning' },
  converted: { label: 'تم التحويل لأمر بيع', color: 'success' },
  rejected: { label: 'مرفوضة', color: 'destructive' },
};

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  active: { label: 'قيد التنفيذ', color: 'info' },
  completed: { label: 'مكتمل', color: 'success' },
  on_hold: { label: 'متوقف مؤقتاً', color: 'warning' },
  cancelled: { label: 'ملغي', color: 'destructive' },
};
export interface CustodyRequest {
  id: string;
  employeeName: string;
  amount: number;
  type: 'cash' | 'transfer' | 'both';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;

  notes?: string;

  // Approvals (timestamp-based: null = not done, value = done)
  accepted_at?: string | null;
  verified_at?: string | null;
  rejected_at?: string | null;
  accepted_by?: number | null;
  verified_by?: number | null;
  rejected_by?: number | null;

  // Level-based approvals (for custody-specific workflow)
  is_accepted_level1?: boolean;
  is_accepted_level2?: boolean;
}

export type CustodyStatus = CustodyRequest['status'];

export type ExpenseCategory = 'labor' | 'car' | 'project' | 'consumables';

export interface EmployeeExpenseRequest {
  id: string;
  employeeName: string;
  amount: number;
  source: 'custody' | 'transfer' | 'both';
  categories: ExpenseCategory[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  attachmentUrl?: string; // Mock URL
  attachmentType?: 'tax_invoice' | 'regular_invoice';
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  labor: 'عمالة',
  car: 'سيارة',
  project: 'مشروع',
  consumables: 'مواد استهلاكية',
};

export const UNIT_LABELS = {
  meter: 'متر طول',
  sqm: 'متر مربع',
  pcs: 'حبة',
  job: 'عمل'
};

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  customer_management: 'إدارة العملاء',
  opportunity_management: 'إدارة الفرص',
  employee_management: 'إدارة الموظفين',
  inventory_management: 'إدارة المخزون',
  financial_management: 'الإدارة المالية',
  reports_viewing: 'عرض التقارير',
  settings_access: 'الوصول للإعدادات',
  work_order_management: 'إدارة أوامر العمل',
  purchase_order_management: 'إدارة أوامر الشراء',
  supplier_management: 'إدارة الموردين',
  
  // New keys from screenshot
  dim_management: 'إدارة المقاسات',
  storage_areas_management: 'إدارة المستودعات',
  items_management: 'إدارة الأصناف',
  sell_order_management: 'إدارة أوامر البيع',
  Purchase_order_management: 'إدارة أوامر الشراء', // Case sensitive from screenshot
  suppliers_management: 'إدارة الموردين',
  disbursement_request_management: 'إدارة طلبات الصرف',
  custodian_transaction_request: 'إدارة العهد',
  session_management: 'إدارة الجلسات',
  approval_management: 'إدارة الموافقات',
  
  // Accounts, Journal Entries, Payment Gateways
  accounts_management: 'إدارة الحسابات',
  account_management: 'إدارة الحسابات',
  journal_entry_management: 'إدارة سندات القيد',
  journal_entries_management: 'إدارة سندات القيد',
  payment_gateways_management: 'إدارة بوابات الدفع',
  payment_gateway_management: 'إدارة بوابات الدفع',
};

export type InterestLevel = keyof typeof INTEREST_LEVELS;

// ----------------------------------------------------------------------------
// Washbasin manufacturing specs (مواصفات تصنيع المغاسل) — custom (تفصيل) lines
// ----------------------------------------------------------------------------

export type WashbasinHolePosition = 'right' | 'center' | 'left';

export type WashbasinBowlType =
  | 'porcelain_square'
  | 'square_with_tile'
  | 'waterfall_pipe'
  | 'waterfall_slot'
  | 'ceramic_round'
  | 'ceramic_oval'
  | 'ceramic_square'
  | 'special';

export type WashbasinFaucetHole = 'wall' | 'basin';

export interface WashbasinSpec {
  surface_length: number | null;
  surface_width: number | null;
  has_custom_bowl_size: boolean;
  bowl_length: number | null;
  bowl_width: number | null;
  bowl_depth: number | null;
  hole_position: WashbasinHolePosition | null;
  bowl_type: WashbasinBowlType | null;
  bowls_count: 1 | 2;
  faucet_hole: WashbasinFaucetHole | null;
  front_length: number | null;
  front_height: number | null;
  approved_color_number: string | null;
  supplier_company: string | null;
}

export const HOLE_POSITION_LABELS: Record<WashbasinHolePosition, string> = {
  right: 'يمين',
  center: 'وسط',
  left: 'يسار',
};

export const BOWL_TYPE_LABELS: Record<WashbasinBowlType, string> = {
  porcelain_square: 'مربع بورسلين',
  square_with_tile: 'مربع مع بلاطة',
  waterfall_pipe: 'شلال ماسورة',
  waterfall_slot: 'شلال شريحة',
  ceramic_round: 'خزف دائري',
  ceramic_oval: 'خزف بيضاوي',
  ceramic_square: 'خزف مربع',
  special: 'طلب خاص',
};

export const FAUCET_HOLE_LABELS: Record<WashbasinFaucetHole, string> = {
  wall: 'جداري',
  basin: 'في المغسلة',
};

// Sell Order Types
export interface SellOrderItem {
  id: number;
  item: {
    id: number;
    name: string;
    is_sellable: boolean;
    is_purchable: boolean;
    unit_price: string;
    unit2_price?: string;
    unit3_price?: string;
    default_unit_name: string;
    unit2_name?: string;
    unit2_factor?: string;
    unit3_name?: string;
    unit3_factor?: string;
    production_type?: ProductionType;
  };
  /** مواصفات تصنيع المغسلة (للبنود من نوع تفصيل فقط) */
  washbasin_spec?: WashbasinSpec | null;
  quantity: string;
  price_before_tax: string;
  price_after_tax: string;
  unit_name: string;
  unit_factor: string;
  dis_percentage: string;
  total_price_before_tax: string;
  total_price_after_tax: string;
  notes: string;
  dis_total_before_tax: string;
  dis_total_after_tax: string;
}

export interface Branch {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
  sell_orders_count: number;
}

export interface DeliveryResponsible {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export interface SellOrder {
  id: number;
  opportunity_id?: number;
  customer: Customer;
  branch?: number;
  branch_name?: string;
  salesman?: Salesman;
  total_price_before_tax: string;
  total_price_after_tax: string;
  dis_percentage: string;
  location?: string;
  notes?: string;
  sell_order_items: SellOrderItem[];
  created_at?: string;
  /** رابط أو مسار ملف الفاتورة بعد الرفع؛ عند وجوده لا يُسمح بتعديل أمر البيع */
  invoice_file?: string | null;

  // Approvals (timestamp-based: null = not done, value = done)
  accepted_at?: string | null;
  verified_at?: string | null;
  rejected_at?: string | null;
  accepted_by?: number | null;
  verified_by?: number | null;
  rejected_by?: number | null;

  /** موعد التنفيذ (YYYY-MM-DD أو null) */
  execution_date?: string | null;
  /** موعد العميل الرئيسي (ISO datetime أو null) */
  delivery_date?: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** نوع المنتج: جاهزة، تفصيل، مخزون تفصيل، أو مخزون درجة ثانية */
export type ProductionType = 'ready' | 'custom' | 'custom_stock' | 'second_grade';

export const PRODUCTION_TYPE_LABELS: Record<ProductionType, string> = {
  ready: 'جاهزة',
  custom: 'تفصيل',
  custom_stock: 'مخزون تفصيل',
  second_grade: 'مخزون درجة ثانية',
};

export interface Item {
  id: number;
  name: string;
  is_sellable: boolean;
  is_purchable: boolean;
  unit_price: string;
  unit2_price?: string | null;
  unit3_price?: string | null;
  default_unit_name: string;
  unit2_name?: string | null;
  unit2_factor?: string | null;
  unit3_name?: string | null;
  unit3_factor?: string | null;
  linked_purchasable_items: number[];
  linked_sellable_items: number[];
  inventory?: number;
  thickness?: string | null;
  /** نوع الإنتاج: 'ready' (جاهزة) أو 'custom' (تفصيل) — الافتراضي 'ready' */
  production_type?: ProductionType;
  /** رصيد المخزون لكل مخزن (يُرجَع في تفاصيل الصنف) */
  stocks?: ItemStockBreakdown[];
}

/** رصيد صنف في مخزن محدد */
export interface ItemStockBreakdown {
  storage_area: number;
  storage_area_name: string;
  quantity: string;
}

// ----------------------------------------------------------------------------
// Production Orders (أوامر التصنيع)
// ----------------------------------------------------------------------------

export type ProductionOrderStatus = 'open' | 'in_progress' | 'closed' | 'canceled';

export const PRODUCTION_ORDER_STATUS_LABELS: Record<ProductionOrderStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  open: { label: 'جديد', color: 'info' },
  in_progress: { label: 'تحت التصنيع', color: 'warning' },
  closed: { label: 'تم الإنتاج', color: 'success' },
  canceled: { label: 'ملغى', color: 'destructive' },
};

export interface ProductionOrderMaterial {
  id: number;
  item: number;
  item_name: string;
  quantity: string;
  unit_name: string;
  created_at: string;
}

export interface ProductionOrder {
  id: number;
  finished_item: number;
  finished_item_name: string;
  quantity: string;
  unit_name: string;
  status: ProductionOrderStatus;
  /** اسم العميل المرتبط بأمر التصنيع (يأتي ضمن عناصر القائمة) */
  customer_name?: string | null;
  sell_order: number | null;
  sell_order_item: number | null;
  materials: ProductionOrderMaterial[];
  created_at: string;
  closed_at: string | null;
  /** موعد العميل المجدول (ISO datetime أو null) */
  scheduled_at?: string | null;
  /** مواصفات تصنيع المغسلة الفعّالة (للبنود من نوع تفصيل)؛ متوفّر في تفاصيل الأمر فقط */
  washbasin_spec?: WashbasinSpec | null;
  /** مسؤول التصنيع المُسنَد للأمر */
  responsible?: number | null;
  /** اسم مسؤول التصنيع */
  responsible_name?: string | null;
}

/** مسؤول التصنيع (قائمة مُدارة منفصلة عن مسؤولي التسليم) */
export interface ProductionResponsible {
  id: number;
  name: string;
  is_active: boolean;
  sort_order: number;
}

// ----------------------------------------------------------------------------
// Delivery Orders (أوامر التسليم)
// ----------------------------------------------------------------------------

export type DeliveryOrderStatus = 'pending' | 'delivered' | 'canceled';

export const DELIVERY_ORDER_STATUS_LABELS: Record<DeliveryOrderStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  pending: { label: 'معلّق', color: 'info' },
  delivered: { label: 'مُسلّم', color: 'success' },
  canceled: { label: 'ملغى', color: 'destructive' },
};

export interface DeliveryOrderItem {
  id: number;
  item: number;
  item_name: string;
  quantity: string;
  unit_name: string | null;
  sell_order_item: number | null;
}

export interface DeliveryOrder {
  id: number;
  sell_order: number;
  customer: number | null;
  /** اسم العميل المرتبط بأمر التسليم (يأتي ضمن عناصر القائمة) */
  customer_name?: string | null;
  status: DeliveryOrderStatus;
  items: DeliveryOrderItem[];
  created_at: string | null;
  delivered_at: string | null;

  /** موعد العميل المجدول (ISO datetime أو null) */
  scheduled_at?: string | null;
  /** معرّف الموظف المسؤول (أو null) */
  responsible?: number | null;
  /** اسم الموظف المسؤول (أو null) */
  responsible_name?: string | null;
  /** مخزن المصدر الذي يخرج منه التسليم */
  storage_area?: number | null;
  storage_area_name?: string | null;
}

export interface StorageArea {
  id: number;
  name: string;
  is_default?: boolean;
  is_active?: boolean;
}

/** تحويل مخزون بين مخزنين */
export interface StockTransfer {
  id: number;
  item: number;
  item_name: string;
  from_storage_area: number;
  from_storage_area_name: string;
  to_storage_area: number;
  to_storage_area_name: string;
  quantity: string;
  unit_name: string;
  note: string;
  created_at: string;
}

// Purchase Order Types
export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'PENDING' | 'APPROVED' | 'ACCEPTED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  DRAFT: { label: 'مسودة', color: 'secondary' },
  SUBMITTED: { label: 'مُقدم', color: 'info' },
  PENDING: { label: 'قيد الانتظار', color: 'warning' },
  APPROVED: { label: 'تمت الموافقة', color: 'info' },
  ACCEPTED: { label: 'مقبول', color: 'success' },
  ORDERED: { label: 'تم الطلب', color: 'default' },
  RECEIVED: { label: 'مُستلَم', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'destructive' },
};

export interface PurchaseOrderItem {
  id?: number;
  item: number;
  item_name?: string;
  supplier?: number;
  supplier_name?: string;
  quantity: string;
  /** الكمية المستلمة فعلياً (تظهر بعد الاستلام)؛ null = لم تُحدَّد */
  received_quantity?: number | null;
  unit_name: string;
  unit_factor?: string;
  normalized_quantity?: string;
  purchase_price: string;
  line_total?: string;
  notes?: string;
  created_at?: string;
  created_by?: number;
}

export interface PurchaseOrderHistoryEntry {
  id: number;
  purchase_order: number;
  action: string;
  status: string;
  details?: string;
  created_by: number;
  created_at: string;
}

export interface PurchaseOrderAttachment {
  id: number;
  purchase_order: number;
  purchase_order_item: number | null;
  file: string;
  description?: string;
  created_at: string;
  created_by: number | null;
}

export interface PurchaseOrderSupplierSummary {
  id: number;
  display_name: string;
  balance?: number | string;
}

export interface PurchaseOrder {
  id: number;
  supplier: number;
  supplier_name?: string;
  supplier_list?: PurchaseOrderSupplierSummary[];
  /** اسم العميل المرتبط بطلب الشراء (يأتي ضمن عناصر القائمة) */
  customer_name?: string | null;
  sell_order?: number;
  status: PurchaseOrderStatus;
  total_cost?: string;
  total_cost_tax?: string;
  item_count?: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  attachments?: PurchaseOrderAttachment[];
  history_entries?: PurchaseOrderHistoryEntry[];
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  accepted_at?: string;
  /** موعد العميل المجدول (ISO datetime أو null) */
  scheduled_at?: string | null;
  /** تاريخ استلام المواد وترحيلها للمخزون */
  received_at?: string | null;
  /** رابط أو مسار ملف الفاتورة بعد الرفع */
  invoice_file?: string | null;

  // Approvals (timestamp-based: null = not done, value = done)
  verified_at?: string | null;
  rejected_at?: string | null;
  verified_by?: number | null;
  rejected_by?: number | null;
}

// Supplier Types (placeholder for future API)
export interface SupplierAccount {
  id: number;
  name: string;
  note: string;
  number: string;
  parent: number | null;
  balance: string;
  total_debit: string;
  total_credit: string;
  total: string;
  journal_entries: JournalEntry[];
  created_at: string;
  updated_at: string;
  supplier: number;
}

export interface Supplier {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  display_name: string;
  contact_name: string;
  phone_number3: string;
  phone_number2: string;
  email: string;
  vat_number: string;
  vat_number_file: string | null;
  tax_number?: number | null;
  tax_file?: string | null;
  cr_number: string;
  cr_file: string | null;
  commercial_registration?: string | null;
  commercial_registration_file?: string | null;
  street?: string | null;
  building_number?: string | null;
  district?: string | null;
  secondary_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  address?: string | null;
  address_file: string | null;
  national_address?: string | null;
  national_address_file?: string | null;
  notes: string;
  order_count: number;
  created_at: string;
  created_by: number;
  account?: SupplierAccount;
}

// Disbursement Types
export interface DisbursementType {
  id: number;
  name: string;
}

// Disbursement Request
export interface DisbursementRequest {
  id: number;
  created_by: number;
  created_at: string;
  notes?: string;
  total_cost: string;
  custody_amount: string;
  transfer_amount: string;
  type: DisbursementType;
  sell_order?: number;
  file?: string;
  accepted_by1?: number;
  accepted_at1?: string;
  accepted_by2?: number;
  accepted_at2?: string;
  rejected_at?: string;
  rejected_reason?: string;

  // Approvals (timestamp-based: null = not done, value = done)
  accepted_at?: string | null;
  verified_at?: string | null;
  accepted_by?: number | null;
  verified_by?: number | null;
  rejected_by?: number | null;
}


// Accounts Management Types
export interface JournalEntryItem {
  id: number;
  journal_entry: number;
  journal_entry_created_at: string;
  account_name: string;
  account: number;
  account_number: string;
  debit: string;
  credit: string;
  order: null | number;
  note?: string;
  created_at: string;
}

export interface JournalEntryAttachment {
  id: number;
  journal_entry: number;
  file: string;
  description?: string;
  created_at: string;
  created_by: number | null;
}

export interface JournalEntry {
  id: number;
  note?: string;
  created_at: string;
  items: JournalEntryItem[];
  attachments?: JournalEntryAttachment[];
}

export interface Account {
  id: number;
  name: string;
  note: string;
  number: string;
  parent: number | null;
  balance: string;
  total_debit: string;
  total_credit: string;
  total: string;
  journal_entries: JournalEntry[];
  created_at: string;
  updated_at: string;
}

// Payment Method Types
// Base interface for shared fields
export interface BasePaymentGateway {
  id: number;
  name: string;
  notes: string;
  account?: Account; // Account details are nested in the response
}

export interface CashRegister extends BasePaymentGateway {
  cash_register?: number; // In the response, it seems like a self-referencing ID or type ID might be present, but based on example: "cash_register": 1
}

export interface CardMachine extends BasePaymentGateway {
  card_machine?: number;
}

export interface Bank extends BasePaymentGateway {
  bank?: number;
}

export interface BuyNowPayLater extends BasePaymentGateway {
  buy_now_pay_later?: number;
}

// ----------------------------------------------------------------------------
// Customer Returns
// ----------------------------------------------------------------------------

export type CustomerReturnStatus = 'DRAFT' | 'APPROVED' | 'CANCELLED';

export const CUSTOMER_RETURN_STATUS_LABELS: Record<CustomerReturnStatus, { label: string; color: "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" }> = {
  DRAFT: { label: 'مسودة', color: 'secondary' },
  APPROVED: { label: 'تمت الموافقة', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'destructive' },
};

export interface CustomerReturn {
  id: number;
  sell_order: number;
  customer_name: string;
  /** إن أعادها الـ API لعرض الرصيد بجانب الاسم */
  customer?: Customer;
  customer_account_balance?: string | null;
  return_date: string;
  status: CustomerReturnStatus;
  total_amount: string;
  item_count: number;
  accepted_by: number | null;
  accepted_at: string | null;
  verified_by: number | null;
  verified_at: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
  created_at: string;
  created_by: number;
}

export interface CustomerReturnItem {
  id: number;
  sell_order_item: number;
  sell_order_item_original_quantity: string;
  item: number;
  item_name: string;
  quantity: string;
  unit_price: string;
  unit_name: string;
  unit_factor: string;
  line_total: string;
  notes: string;
  created_at: string;
}

export interface CustomerReturnDetail extends CustomerReturn {
  notes: string;
  items: CustomerReturnItem[];
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Payment Requests (CR = Customer Return, PO = Purchase Order)
// ----------------------------------------------------------------------------

export type PaymentRequestStatus = string;

export interface CRPaymentRequest {
  id: number;
  customer_return: number;
  customer_name: string;
  customer?: Customer;
  customer_account_balance?: string | null;
  amount: string;
  source_account: number | null;
  status: PaymentRequestStatus;
  notes: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface POPaymentRequest {
  id: number;
  purchase_order: number;
  supplier_name?: string;
  amount: string;
  source_account: number | null;
  status: PaymentRequestStatus;
  notes: string;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface DRPaymentRequest {
  id: number;
  disbursement_request: number;
  disbursement_type_name: string;
  payment_method: string;
  amount: string;
  final_amount: string;
  source_account: number | null;
  source_account_name?: string;
  status: PaymentRequestStatus;
  approval_status: string;
  notes: string;
  created_by: number | null;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

/** @deprecated kept for backward compatibility */
export type PaymentRequest = CRPaymentRequest;

// =====================
// Collections (Customer Payments / قبض)
// =====================
export type PaymentType = 'card' | 'cash' | 'transfer' | 'tabby' | 'buy_now_pay_later';

/** A single customer payment (قبض) as returned by the flat payments list endpoint. */
export interface CollectionPayment {
  id: number;
  payment_type: PaymentType;
  customer: { id: number; name: string } | null;
  channel_name: string | null;
  amount: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_by: string | null;
  actual_date_time: string | null;
  created_at: string;
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  card: 'شبكة',
  cash: 'نقدي',
  transfer: 'تحويل',
  tabby: 'تابي',
  buy_now_pay_later: 'اشترِ الآن وادفع لاحقاً',
};

// =====================
// Recurring Accruals & Fixed-Asset Depreciation
// =====================

export type AccrualKind = 'SALARY' | 'RENT' | 'OTHER';

export const ACCRUAL_KIND_LABELS: Record<AccrualKind, string> = {
  SALARY: 'رواتب',
  RENT: 'إيجار',
  OTHER: 'أخرى',
};

export type RunStatus = 'DRAFT' | 'POSTED' | 'CANCELLED';

export const RUN_STATUS_LABELS: Record<
  RunStatus,
  { label: string; color: 'secondary' | 'success' | 'destructive' }
> = {
  DRAFT: { label: 'مسودّة', color: 'secondary' },
  POSTED: { label: 'مُرحّل', color: 'success' },
  CANCELLED: { label: 'ملغي', color: 'destructive' },
};

export interface AccrualTemplate {
  id: number;
  name: string;
  kind: AccrualKind;
  expense_account: number;
  liability_account: number;
  amount: string;
  is_taxable: boolean;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccrualRun {
  id: number;
  template: number;
  template_name: string;
  period_year: number;
  period_month: number;
  gross_amount: string;
  net_amount: string;
  tax_amount: string;
  is_taxable: boolean;
  status: RunStatus;
  journal_entry: number | null;
  posted_at: string | null;
  created_at: string;
}

export interface FixedAsset {
  id: number;
  name: string;
  cost: string;
  salvage_value: string;
  acquisition_date: string; // YYYY-MM-DD
  useful_life_months: number;
  method: string;
  expense_account: number;
  accumulated_account: number;
  is_active: boolean;
  monthly_depreciation: string;
  accumulated_depreciation: string;
  remaining_depreciable: string;
  created_at: string;
  updated_at: string;
}

export interface DepreciationRun {
  id: number;
  asset: number;
  asset_name: string;
  period_year: number;
  period_month: number;
  amount: string;
  status: RunStatus;
  journal_entry: number | null;
  posted_at: string | null;
  created_at: string;
}
