import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { inventory_adjustments } from "../validators";
import { v } from "convex/values";
import { assertPermission, getAuthUser } from "../auth.helpers";

// adjusted_by / adjusted_at are stamped server-side (audit trail).
const {
  adjusted_by: _adjustedBy,
  adjusted_at: _adjustedAt,
  ...adjustmentArgs
} = inventory_adjustments;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    product_id: v.optional(v.id("products")),
    reason: v.optional(inventory_adjustments.reason),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.product_id) {
      results = await ctx.db
        .query("inventory_adjustments")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .paginate(args.paginationOpts);
    } else if (args.reason) {
      results = await ctx.db
        .query("inventory_adjustments")
        .withIndex("by_reason", (q) => q.eq("reason", args.reason!))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("inventory_adjustments")
        .paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (adjustment) => {
        const product = await ctx.db.get(adjustment.product_id);
        const adjuster = await ctx.db.get(adjustment.adjusted_by);
        const adjusted_by_name = adjuster?.name
          ? `${adjuster.name.first} ${adjuster.name.last}`
          : (adjuster?.email ?? null);
        return {
          ...adjustment,
          product_name: product?.name ?? null,
          adjusted_by_name,
        };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    product_id: v.optional(v.id("products")),
    reason: v.optional(inventory_adjustments.reason),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.product_id) {
      records = await ctx.db
        .query("inventory_adjustments")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .collect();
    } else if (args.reason) {
      records = await ctx.db
        .query("inventory_adjustments")
        .withIndex("by_reason", (q) => q.eq("reason", args.reason!))
        .collect();
    } else {
      records = await ctx.db.query("inventory_adjustments").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("inventory_adjustments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: adjustmentArgs,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "inventory:adjust");
    const { user } = await getAuthUser(ctx);
    return await ctx.db.insert("inventory_adjustments", {
      ...args,
      adjusted_by: user._id,
      adjusted_at: Date.now(),
    });
  },
});
