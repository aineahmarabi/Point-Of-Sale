import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { inventory } from "../validators";
import { v } from "convex/values";
import { assertPermission, getAuthUser } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    product_id: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.product_id) {
      results = await ctx.db
        .query("inventory")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db.query("inventory").paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (item) => {
        const product = await ctx.db.get(item.product_id);
        const variant = item.variant_id
          ? await ctx.db.get(item.variant_id)
          : null;
        return {
          ...item,
          product_name: product?.name ?? null,
          variant_name: variant?.name ?? null,
        };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    product_id: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.product_id) {
      records = await ctx.db
        .query("inventory")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .collect();
    } else {
      records = await ctx.db.query("inventory").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByProduct = query({
  args: {
    product_id: v.id("products"),
    variant_id: v.optional(v.id("variants")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventory")
      .withIndex("by_product_variant", (q) =>
        q.eq("product_id", args.product_id).eq("variant_id", args.variant_id),
      )
      .unique();
  },
});

export const create = mutation({
  args: inventory,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "inventory:create");
    return await ctx.db.insert("inventory", args);
  },
});

export const update = mutation({
  args: { id: v.id("inventory"), ...inventory },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "inventory:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "inventory:remove");
    return await ctx.db.delete(args.id);
  },
});

// Decrement on-hand stock when an item is sold. Gated by orders:create so
// cashiers can complete sales. No-ops for products without an inventory record
// (e.g. services). Returns the patched inventory id, or null if untracked.
export const adjustStock = mutation({
  args: {
    product_id: v.id("products"),
    variant_id: v.optional(v.id("variants")),
    quantity: v.float64(),
  },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:create");
    const record = await ctx.db
      .query("inventory")
      .withIndex("by_product_variant", (q) =>
        q.eq("product_id", args.product_id).eq("variant_id", args.variant_id),
      )
      .first();
    if (!record) return null;
    await ctx.db.patch(record._id, {
      quantity: record.quantity - args.quantity,
    });
    // Audit the stock movement caused by the sale.
    const { user } = await getAuthUser(ctx);
    await ctx.db.insert("inventory_adjustments", {
      product_id: args.product_id,
      ...(args.variant_id ? { variant_id: args.variant_id } : {}),
      quantity_change: -args.quantity,
      reason: "sale",
      adjusted_by: user._id,
      adjusted_at: Date.now(),
    });
    return record._id;
  },
});
