import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { variants } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    product_id: v.optional(v.id("products")),
    status: v.optional(variants.status),
  },
  handler: async (ctx, args) => {
    if (args.product_id) {
      return await ctx.db
        .query("variants")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("variants")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("variants").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    product_id: v.optional(v.id("products")),
    status: v.optional(variants.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.product_id) {
      records = await ctx.db
        .query("variants")
        .withIndex("by_product", (q) => q.eq("product_id", args.product_id!))
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("variants")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("variants").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("variants") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: variants,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "variants:create");
    return await ctx.db.insert("variants", args);
  },
});

export const update = mutation({
  args: { id: v.id("variants"), ...variants },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "variants:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("variants") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "variants:remove");
    return await ctx.db.delete(args.id);
  },
});
