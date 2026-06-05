import { defineSchema, defineTable } from "convex/server";
import {
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
} from "./validators";

export default defineSchema({
  users: defineTable(users)
    .index("by_clerk_id", ["clerk_id"])
    .index("by_status", ["status"])
    .index("by_app", ["app"])
    .index("by_app_status", ["app", "status"])
    .index("by_app_usertype", ["app", "user_type"])
    .index("by_app_status_usertype", ["app", "status", "user_type"])
    .index("by_is_admin", ["is_admin"])
    .index("by_is_admin_status", ["is_admin", "status"])
    .index("by_is_admin_usertype", ["is_admin", "user_type"])
    .index("by_is_admin_status_usertype", ["is_admin", "status", "user_type"])
    .searchIndex("by_name", {
      searchField: "name.first",
      filterFields: ["app", "status", "user_type", "is_admin"],
    }),

  roles: defineTable(roles).index("by_name", ["name"]).index("by_app", ["app"]),

  // ── CATALOG ────────────────────────────────────────────────
  categories: defineTable(categories)
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["status"],
    }),

  products: defineTable(products)
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_category", ["category_id"])
    .index("by_sku", ["sku"])
    .index("by_barcode", ["barcode"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["status", "category_id"],
    }),

  variants: defineTable(variants)
    .index("by_product", ["product_id"])
    .index("by_status", ["status"])
    .index("by_sku", ["sku"])
    .index("by_barcode", ["barcode"]),

  inventory: defineTable(inventory)
    .index("by_product", ["product_id"])
    .index("by_variant", ["variant_id"])
    .index("by_product_variant", ["product_id", "variant_id"]),

  inventory_adjustments: defineTable(inventory_adjustments)
    .index("by_product", ["product_id"])
    .index("by_variant", ["variant_id"])
    .index("by_reason", ["reason"])
    .index("by_adjusted_by", ["adjusted_by"]),

  // ── PURCHASING ─────────────────────────────────────────────
  suppliers: defineTable(suppliers)
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["status"],
    }),

  purchase_orders: defineTable(purchase_orders)
    .index("by_supplier", ["supplier_id"])
    .index("by_status", ["status"])
    .index("by_created_by", ["created_by"]),

  purchase_order_items: defineTable(purchase_order_items)
    .index("by_purchase_order", ["purchase_order_id"])
    .index("by_product", ["product_id"]),

  // ── CRM ────────────────────────────────────────────────────
  customers: defineTable(customers)
    .index("by_status", ["status"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["status"],
    }),

  // ── POS ────────────────────────────────────────────────────
  sessions: defineTable(sessions)
    .index("by_cashier", ["cashier_id"])
    .index("by_status", ["status"])
    .index("by_cashier_status", ["cashier_id", "status"]),

  orders: defineTable(orders)
    .index("by_order_number", ["order_number"])
    .index("by_session", ["session_id"])
    .index("by_cashier", ["cashier_id"])
    .index("by_customer", ["customer_id"])
    .index("by_status", ["status"])
    .index("by_payment_method", ["payment_method"])
    .searchIndex("by_order_number_search", {
      searchField: "order_number",
      filterFields: ["status", "payment_method"],
    }),

  order_items: defineTable(order_items)
    .index("by_order", ["order_id"])
    .index("by_product", ["product_id"]),

  payments: defineTable(payments)
    .index("by_order", ["order_id"])
    .index("by_status", ["status"])
    .index("by_method", ["method"]),

  returns: defineTable(returns)
    .index("by_original_order", ["original_order_id"])
    .index("by_session", ["session_id"])
    .index("by_cashier", ["cashier_id"])
    .index("by_status", ["status"]),

  return_items: defineTable(return_items)
    .index("by_return", ["return_id"])
    .index("by_order_item", ["order_item_id"])
    .index("by_product", ["product_id"]),

  cash_movements: defineTable(cash_movements)
    .index("by_session", ["session_id"])
    .index("by_type", ["type"])
    .index("by_created_by", ["created_by"]),

  // ── PROMOTIONS ─────────────────────────────────────────────
  discounts: defineTable(discounts)
    .index("by_code", ["code"])
    .index("by_is_active", ["is_active"])
    .index("by_applies_to", ["applies_to"])
    .index("by_type", ["type"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["is_active", "type"],
    }),

  // ── SETTINGS ───────────────────────────────────────────────
  tax_rates: defineTable(tax_rates)
    .index("by_status", ["status"])
    .index("by_is_default", ["is_default"]),

  store_settings: defineTable(store_settings).index("by_location", [
    "location_id",
  ]),
});
