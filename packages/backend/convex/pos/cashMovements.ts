import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { cash_movements } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    session_id: v.optional(v.id("sessions")),
    type: v.optional(cash_movements.type),
  },
  handler: async (ctx, args) => {
    if (args.session_id) {
      return await ctx.db
        .query("cash_movements")
        .withIndex("by_session", (q) => q.eq("session_id", args.session_id!))
        .paginate(args.paginationOpts);
    }
    if (args.type) {
      return await ctx.db
        .query("cash_movements")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("cash_movements").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    session_id: v.optional(v.id("sessions")),
    type: v.optional(cash_movements.type),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.session_id) {
      records = await ctx.db
        .query("cash_movements")
        .withIndex("by_session", (q) => q.eq("session_id", args.session_id!))
        .collect();
    } else if (args.type) {
      records = await ctx.db
        .query("cash_movements")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else {
      records = await ctx.db.query("cash_movements").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("cash_movements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: cash_movements,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "cash_movements:create");
    return await ctx.db.insert("cash_movements", args);
  },
});

export const update = mutation({
  args: { id: v.id("cash_movements"), ...cash_movements },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "cash_movements:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("cash_movements") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "cash_movements:remove");
    return await ctx.db.delete(args.id);
  },
});
