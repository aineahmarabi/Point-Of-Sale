import { v } from "convex/values";

// ENUMS
export const userApps = ["admin", "web"] as const;
export const userStatus = ["active", "inactive", "pending"] as const;
export const userTypes = ["individual", "company"] as const;
export const recordStatus = ["draft", "published", "archived"] as const;

// POS ENUMS
export const categoryStatus = ["active", "archived"] as const;
export const productStatus = ["active", "draft", "archived"] as const;
export const variantStatus = ["active", "archived"] as const;
export const adjustmentReasons = [
  "received",
  "damaged",
  "theft",
  "correction",
  "return",
  "sale",
] as const;
export const supplierStatus = ["active", "inactive"] as const;
export const purchaseOrderStatus = [
  "draft",
  "sent",
  "received",
  "cancelled",
] as const;
export const customerStatus = ["active", "inactive"] as const;
export const sessionStatus = ["open", "closed", "suspended"] as const;
export const orderStatus = ["completed", "voided", "refunded"] as const;
export const orderPaymentMethods = [
  "cash",
  "paybill",
  "gift_card",
  "store_credit",
  "split",
] as const;
export const paymentMethods = [
  "cash",
  "paybill",
  "gift_card",
  "store_credit",
] as const;
export const paymentStatus = ["completed", "refunded", "voided"] as const;
export const returnStatus = ["completed", "voided"] as const;
export const refundMethods = ["original", "store_credit", "cash"] as const;
export const discountTypes = ["percentage", "fixed", "bogo"] as const;
export const discountAppliesTo = ["cart", "product", "category"] as const;
export const taxRateStatus = ["active", "inactive"] as const;
export const cashMovementTypes = ["cash_in", "cash_out"] as const;

// TABLES
export const users = {
  image: v.optional(v.string()),
  name: v.optional(v.object({ first: v.string(), last: v.string() })),
  email: v.string(),
  phone: v.optional(v.string()),
  user_type: v.optional(v.union(...userTypes.map((e) => v.literal(e)))),
  status: v.union(...userStatus.map((e) => v.literal(e))),
  app: v.array(v.union(...userApps.map((e) => v.literal(e)))),
  is_admin: v.boolean(),
  role: v.optional(v.id("roles")),
  clerk_id: v.string(),
};

export const clerkUser = {
  name: v.optional(v.object({ first: v.string(), last: v.string() })),
  email: v.string(),
  phone: v.optional(v.string()),
  user_type: v.optional(v.union(...userTypes.map((e) => v.literal(e)))),
  status: v.union(...userStatus.map((e) => v.literal(e))),
  app: v.array(v.union(...userApps.map((e) => v.literal(e)))),
  is_admin: v.boolean(),
  role: v.optional(v.id("roles")),
  clerk_id: v.string(),
};

export const roles = {
  name: v.string(),
  app: v.union(...userApps.map((e) => v.literal(e))),
  description: v.optional(v.string()),
  permissions: v.array(v.string()),
};

// ── CATALOG ──────────────────────────────────────────────────
export const categories = {
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  status: v.union(...categoryStatus.map((e) => v.literal(e))),
  display_order: v.float64(),
};

export const products = {
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  sku: v.optional(v.string()),
  barcode: v.optional(v.string()),
  category_id: v.optional(v.id("categories")),
  cost_price: v.float64(),
  selling_price: v.float64(),
  unit: v.optional(v.string()),
  tax_rate: v.optional(v.float64()),
  images: v.array(v.string()),
  status: v.union(...productStatus.map((e) => v.literal(e))),
  is_service: v.boolean(),
};

export const variants = {
  product_id: v.id("products"),
  name: v.string(),
  sku: v.optional(v.string()),
  barcode: v.optional(v.string()),
  price_override: v.optional(v.float64()),
  cost_override: v.optional(v.float64()),
  status: v.union(...variantStatus.map((e) => v.literal(e))),
};

export const inventory = {
  product_id: v.id("products"),
  variant_id: v.optional(v.id("variants")),
  quantity: v.float64(),
  reorder_point: v.float64(),
  reorder_quantity: v.float64(),
  location_id: v.optional(v.string()),
};

export const inventory_adjustments = {
  product_id: v.id("products"),
  variant_id: v.optional(v.id("variants")),
  quantity_change: v.float64(),
  reason: v.union(...adjustmentReasons.map((e) => v.literal(e))),
  notes: v.optional(v.string()),
  adjusted_by: v.id("users"),
  adjusted_at: v.float64(),
};

// ── PURCHASING ───────────────────────────────────────────────
export const suppliers = {
  name: v.string(),
  slug: v.string(),
  contact_name: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),
  status: v.union(...supplierStatus.map((e) => v.literal(e))),
};

export const purchase_orders = {
  supplier_id: v.id("suppliers"),
  status: v.union(...purchaseOrderStatus.map((e) => v.literal(e))),
  order_date: v.float64(),
  expected_date: v.optional(v.float64()),
  received_date: v.optional(v.float64()),
  notes: v.optional(v.string()),
  total_amount: v.float64(),
  created_by: v.id("users"),
};

export const purchase_order_items = {
  purchase_order_id: v.id("purchase_orders"),
  product_id: v.id("products"),
  variant_id: v.optional(v.id("variants")),
  quantity_ordered: v.float64(),
  quantity_received: v.float64(),
  unit_cost: v.float64(),
  total_cost: v.float64(),
};

// ── CRM ──────────────────────────────────────────────────────
export const customers = {
  name: v.string(),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(v.string()),
  notes: v.optional(v.string()),
  total_spend: v.float64(),
  visit_count: v.float64(),
  status: v.union(...customerStatus.map((e) => v.literal(e))),
};

// ── POS ──────────────────────────────────────────────────────
export const sessions = {
  cashier_id: v.id("users"),
  status: v.union(...sessionStatus.map((e) => v.literal(e))),
  opening_cash: v.float64(),
  closing_cash: v.optional(v.float64()),
  expected_cash: v.optional(v.float64()),
  cash_variance: v.optional(v.float64()),
  opened_at: v.float64(),
  closed_at: v.optional(v.float64()),
  notes: v.optional(v.string()),
  total_sales: v.float64(),
  total_refunds: v.float64(),
  total_discounts: v.float64(),
  total_tax: v.float64(),
  cash_sales: v.float64(),
  other_sales: v.float64(),
  transaction_count: v.float64(),
  location_id: v.optional(v.string()),
};

export const orders = {
  order_number: v.string(),
  session_id: v.id("sessions"),
  cashier_id: v.id("users"),
  customer_id: v.optional(v.id("customers")),
  status: v.union(...orderStatus.map((e) => v.literal(e))),
  subtotal: v.float64(),
  discount_total: v.float64(),
  tax_total: v.float64(),
  grand_total: v.float64(),
  payment_method: v.union(...orderPaymentMethods.map((e) => v.literal(e))),
  payment_reference: v.optional(v.string()),
  notes: v.optional(v.string()),
  completed_at: v.optional(v.float64()),
  location_id: v.optional(v.string()),
};

export const order_items = {
  order_id: v.id("orders"),
  product_id: v.id("products"),
  variant_id: v.optional(v.id("variants")),
  product_name: v.string(),
  sku: v.string(),
  quantity: v.float64(),
  unit_price: v.float64(),
  discount_amount: v.float64(),
  line_total: v.float64(),
  tax_amount: v.float64(),
};

export const payments = {
  order_id: v.id("orders"),
  method: v.union(...paymentMethods.map((e) => v.literal(e))),
  amount: v.float64(),
  reference: v.optional(v.string()),
  status: v.union(...paymentStatus.map((e) => v.literal(e))),
};

export const returns = {
  original_order_id: v.id("orders"),
  session_id: v.id("sessions"),
  cashier_id: v.id("users"),
  status: v.union(...returnStatus.map((e) => v.literal(e))),
  reason: v.optional(v.string()),
  refund_method: v.union(...refundMethods.map((e) => v.literal(e))),
  refund_amount: v.float64(),
  notes: v.optional(v.string()),
  created_at: v.float64(),
};

export const return_items = {
  return_id: v.id("returns"),
  order_item_id: v.id("order_items"),
  product_id: v.id("products"),
  variant_id: v.optional(v.id("variants")),
  quantity: v.float64(),
  unit_price: v.float64(),
  line_total: v.float64(),
  restock: v.boolean(),
};

export const cash_movements = {
  session_id: v.id("sessions"),
  type: v.union(...cashMovementTypes.map((e) => v.literal(e))),
  amount: v.float64(),
  reason: v.optional(v.string()),
  created_by: v.id("users"),
  created_at: v.float64(),
};

// ── PROMOTIONS ───────────────────────────────────────────────
export const discounts = {
  name: v.string(),
  code: v.optional(v.string()),
  type: v.union(...discountTypes.map((e) => v.literal(e))),
  value: v.float64(),
  min_order_amount: v.optional(v.float64()),
  applies_to: v.union(...discountAppliesTo.map((e) => v.literal(e))),
  target_id: v.optional(v.string()),
  is_active: v.boolean(),
  start_date: v.optional(v.float64()),
  end_date: v.optional(v.float64()),
  usage_count: v.float64(),
  usage_limit: v.optional(v.float64()),
};

// ── SETTINGS ─────────────────────────────────────────────────
export const tax_rates = {
  name: v.string(),
  rate: v.float64(),
  is_inclusive: v.boolean(),
  is_default: v.boolean(),
  status: v.union(...taxRateStatus.map((e) => v.literal(e))),
};

export const store_settings = {
  store_name: v.string(),
  currency: v.string(),
  timezone: v.string(),
  address: v.optional(v.string()),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  receipt_header: v.optional(v.string()),
  receipt_footer: v.optional(v.string()),
  logo_url: v.optional(v.string()),
  allow_negative_stock: v.boolean(),
  require_customer_on_sale: v.boolean(),
  location_id: v.optional(v.string()),
};

// EXPORT DEFAULT
export default {
  users,
  roles,
  categories,
  products,
  variants,
  inventory,
  inventory_adjustments,
  suppliers,
  purchase_orders,
  purchase_order_items,
  customers,
  sessions,
  orders,
  order_items,
  payments,
  returns,
  return_items,
  cash_movements,
  discounts,
  tax_rates,
  store_settings,
};
