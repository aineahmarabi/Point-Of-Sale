/**
 * ONE-TIME SEED — creates the initial roles and assigns Super Admin.
 *
 * Run from the Convex dashboard or CLI:
 *   npx convex run seed:seed '{"email":"your-admin@example.com"}'
 *
 * After running successfully, DELETE this file and redeploy so the
 * function no longer exists in the deployment:
 *   del packages\backend\convex\seed.ts   (Windows)
 *   pnpm --filter @repo/backend dev
 */
import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// ── POS role permission sets ─────────────────────────────────
const cashierPermissions = [
  "pos:open_session",
  "pos:close_session",
  "orders:create",
  "orders:view",
  "returns:create",
  "customers:view",
  "customers:create",
  "customers:update",
  "inventory:view",
  "products:view",
  "categories:view",
  "discounts:view",
  "payments:create",
];

const managerPermissions = [
  ...cashierPermissions,
  "orders:void",
  "returns:void",
  "inventory:adjust",
  "inventory:create",
  "discounts:create",
  "discounts:update",
  "reports:view",
  "sessions:view",
  "cash_movements:create",
  "suppliers:view",
  "purchase_orders:view",
];

export const seed = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // ── Guard: prevent re-running ──────────────────────────────
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "Super Admin"))
      .first();

    if (existing) {
      throw new ConvexError(
        "Seed already ran — 'Super Admin' role exists. Delete this file and redeploy.",
      );
    }

    // ── 1. Create Super Admin role (absolute access) ───────────
    // The "*" wildcard already covers every POS permission string.
    const superAdminId = await ctx.db.insert("roles", {
      name: "Super Admin",
      app: "admin",
      description: "Full access to all modules and actions",
      permissions: ["*"],
    });

    // ── 2. Create Customer role (default for new users) ────────
    await ctx.db.insert("roles", {
      name: "Customer",
      app: "web",
      description: "Default role assigned to new users",
      permissions: [],
    });

    // ── 3. Create Cashier role (front-of-till operations) ──────
    await ctx.db.insert("roles", {
      name: "Cashier",
      app: "admin",
      description: "Operates the POS: sells, returns, opens/closes shifts",
      permissions: cashierPermissions,
    });

    // ── 4. Create Manager role (Cashier + oversight) ───────────
    await ctx.db.insert("roles", {
      name: "Manager",
      app: "admin",
      description:
        "Cashier abilities plus voids, inventory, discounts and reporting",
      permissions: managerPermissions,
    });

    // ── 5. Assign Super Admin to the provided email ────────────
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (user) {
      const appArray = user.app.includes("admin")
        ? user.app
        : ([...user.app, "admin"] as ("admin" | "web")[]);

      await ctx.db.patch(user._id, {
        role: superAdminId,
        app: appArray,
        is_admin: true,
        status: "active",
      });

      return {
        message: `Seed complete. Super Admin assigned to ${args.email}. DELETE this file now.`,
      };
    }

    return {
      message: `Seed complete. Roles created. User "${args.email}" not found yet — set public_metadata.role to "Super Admin" and public_metadata.app to ["admin","web"] in the Clerk dashboard for that user, then sign in. DELETE this file now.`,
    };
  },
});
