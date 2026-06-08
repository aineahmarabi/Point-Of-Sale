/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as catalog_categories from "../catalog/categories.js";
import type * as catalog_inventory from "../catalog/inventory.js";
import type * as catalog_inventoryAdjustments from "../catalog/inventoryAdjustments.js";
import type * as catalog_products from "../catalog/products.js";
import type * as catalog_variants from "../catalog/variants.js";
import type * as crm_customers from "../crm/customers.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as import_ from "../import.js";
import type * as pos_cashMovements from "../pos/cashMovements.js";
import type * as pos_orderItems from "../pos/orderItems.js";
import type * as pos_orders from "../pos/orders.js";
import type * as pos_payments from "../pos/payments.js";
import type * as pos_returnItems from "../pos/returnItems.js";
import type * as pos_returns from "../pos/returns.js";
import type * as pos_sessions from "../pos/sessions.js";
import type * as promotions_discounts from "../promotions/discounts.js";
import type * as purchasing_purchaseOrderItems from "../purchasing/purchaseOrderItems.js";
import type * as purchasing_purchaseOrders from "../purchasing/purchaseOrders.js";
import type * as purchasing_suppliers from "../purchasing/suppliers.js";
import type * as seed from "../seed.js";
import type * as settings_storeSettings from "../settings/storeSettings.js";
import type * as settings_taxRates from "../settings/taxRates.js";
import type * as superAdmin from "../superAdmin.js";
import type * as user_admins from "../user/admins.js";
import type * as user_clerk from "../user/clerk.js";
import type * as user_customers from "../user/customers.js";
import type * as user_roles from "../user/roles.js";
import type * as user_users from "../user/users.js";
import type * as validators from "../validators.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "catalog/categories": typeof catalog_categories;
  "catalog/inventory": typeof catalog_inventory;
  "catalog/inventoryAdjustments": typeof catalog_inventoryAdjustments;
  "catalog/products": typeof catalog_products;
  "catalog/variants": typeof catalog_variants;
  "crm/customers": typeof crm_customers;
  files: typeof files;
  http: typeof http;
  import: typeof import_;
  "pos/cashMovements": typeof pos_cashMovements;
  "pos/orderItems": typeof pos_orderItems;
  "pos/orders": typeof pos_orders;
  "pos/payments": typeof pos_payments;
  "pos/returnItems": typeof pos_returnItems;
  "pos/returns": typeof pos_returns;
  "pos/sessions": typeof pos_sessions;
  "promotions/discounts": typeof promotions_discounts;
  "purchasing/purchaseOrderItems": typeof purchasing_purchaseOrderItems;
  "purchasing/purchaseOrders": typeof purchasing_purchaseOrders;
  "purchasing/suppliers": typeof purchasing_suppliers;
  seed: typeof seed;
  "settings/storeSettings": typeof settings_storeSettings;
  "settings/taxRates": typeof settings_taxRates;
  superAdmin: typeof superAdmin;
  "user/admins": typeof user_admins;
  "user/clerk": typeof user_clerk;
  "user/customers": typeof user_customers;
  "user/roles": typeof user_roles;
  "user/users": typeof user_users;
  validators: typeof validators;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
