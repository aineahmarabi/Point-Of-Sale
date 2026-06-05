import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { purchase_order_items } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    purchase_order_id: v.optional(v.id("purchase_orders")),
  },
  handler: async (ctx, args) => {
    if (args.purchase_order_id) {
      return await ctx.db
        .query("purchase_order_items")
        .withIndex("by_purchase_order", (q) =>
          q.eq("purchase_order_id", args.purchase_order_id!),
        )
        .paginate(args.paginationOpts);
    }
    return await ctx.db
      .query("purchase_order_items")
      .paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    purchase_order_id: v.optional(v.id("purchase_orders")),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.purchase_order_id) {
      records = await ctx.db
        .query("purchase_order_items")
        .withIndex("by_purchase_order", (q) =>
          q.eq("purchase_order_id", args.purchase_order_id!),
        )
        .collect();
    } else {
      records = await ctx.db.query("purchase_order_items").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("purchase_order_items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: purchase_order_items,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:create");
    return await ctx.db.insert("purchase_order_items", args);
  },
});

export const update = mutation({
  args: { id: v.id("purchase_order_items"), ...purchase_order_items },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("purchase_order_items") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:update");
    return await ctx.db.delete(args.id);
  },
});
