import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { tax_rates } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(tax_rates.status),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("tax_rates")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("tax_rates").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    status: v.optional(tax_rates.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.status) {
      records = await ctx.db
        .query("tax_rates")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("tax_rates").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("tax_rates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tax_rates")
      .withIndex("by_is_default", (q) => q.eq("is_default", true))
      .first();
  },
});

export const create = mutation({
  args: tax_rates,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "tax_rates:create");
    return await ctx.db.insert("tax_rates", args);
  },
});

export const update = mutation({
  args: { id: v.id("tax_rates"), ...tax_rates },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "tax_rates:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("tax_rates") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "tax_rates:remove");
    return await ctx.db.delete(args.id);
  },
});
