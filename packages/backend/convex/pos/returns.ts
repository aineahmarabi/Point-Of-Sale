import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { returns } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    session_id: v.optional(v.id("sessions")),
    original_order_id: v.optional(v.id("orders")),
    status: v.optional(returns.status),
  },
  handler: async (ctx, args) => {
    if (args.original_order_id) {
      return await ctx.db
        .query("returns")
        .withIndex("by_original_order", (q) =>
          q.eq("original_order_id", args.original_order_id!),
        )
        .paginate(args.paginationOpts);
    }
    if (args.session_id) {
      return await ctx.db
        .query("returns")
        .withIndex("by_session", (q) => q.eq("session_id", args.session_id!))
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("returns")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("returns").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    session_id: v.optional(v.id("sessions")),
    original_order_id: v.optional(v.id("orders")),
    status: v.optional(returns.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.original_order_id) {
      records = await ctx.db
        .query("returns")
        .withIndex("by_original_order", (q) =>
          q.eq("original_order_id", args.original_order_id!),
        )
        .collect();
    } else if (args.session_id) {
      records = await ctx.db
        .query("returns")
        .withIndex("by_session", (q) => q.eq("session_id", args.session_id!))
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("returns")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("returns").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("returns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: returns,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:create");
    return await ctx.db.insert("returns", args);
  },
});

export const update = mutation({
  args: { id: v.id("returns"), ...returns },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:void");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("returns") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:void");
    return await ctx.db.delete(args.id);
  },
});
