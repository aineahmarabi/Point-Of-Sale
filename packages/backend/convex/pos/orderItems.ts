import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { order_items } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    order_id: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    if (args.order_id) {
      return await ctx.db
        .query("order_items")
        .withIndex("by_order", (q) => q.eq("order_id", args.order_id!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("order_items").paginate(args.paginationOpts);
  },
});

export const listByOrder = query({
  args: { order_id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("order_items")
      .withIndex("by_order", (q) => q.eq("order_id", args.order_id))
      .collect();
  },
});

export const count = query({
  args: {
    order_id: v.optional(v.id("orders")),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.order_id) {
      records = await ctx.db
        .query("order_items")
        .withIndex("by_order", (q) => q.eq("order_id", args.order_id!))
        .collect();
    } else {
      records = await ctx.db.query("order_items").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("order_items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: order_items,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:create");
    return await ctx.db.insert("order_items", args);
  },
});

export const update = mutation({
  args: { id: v.id("order_items"), ...order_items },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:create");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("order_items") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:void");
    return await ctx.db.delete(args.id);
  },
});
