import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { payments } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    order_id: v.optional(v.id("orders")),
    status: v.optional(payments.status),
  },
  handler: async (ctx, args) => {
    if (args.order_id) {
      return await ctx.db
        .query("payments")
        .withIndex("by_order", (q) => q.eq("order_id", args.order_id!))
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("payments").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    order_id: v.optional(v.id("orders")),
    status: v.optional(payments.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.order_id) {
      records = await ctx.db
        .query("payments")
        .withIndex("by_order", (q) => q.eq("order_id", args.order_id!))
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("payments")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("payments").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: payments,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "payments:create");
    return await ctx.db.insert("payments", args);
  },
});

export const update = mutation({
  args: { id: v.id("payments"), ...payments },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "payments:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "payments:remove");
    return await ctx.db.delete(args.id);
  },
});
