import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { discounts } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    type: v.optional(discounts.type),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("discounts")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name", args.search!);
          if (args.is_active !== undefined)
            sq = sq.eq("is_active", args.is_active);
          if (args.type) sq = sq.eq("type", args.type);
          return sq;
        })
        .paginate(args.paginationOpts);
    }
    if (args.type) {
      return await ctx.db
        .query("discounts")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .paginate(args.paginationOpts);
    }
    if (args.is_active !== undefined) {
      return await ctx.db
        .query("discounts")
        .withIndex("by_is_active", (q) => q.eq("is_active", args.is_active!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("discounts").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    type: v.optional(discounts.type),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("discounts")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name", args.search!);
          if (args.is_active !== undefined)
            sq = sq.eq("is_active", args.is_active);
          if (args.type) sq = sq.eq("type", args.type);
          return sq;
        })
        .collect();
    } else if (args.type) {
      records = await ctx.db
        .query("discounts")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .collect();
    } else if (args.is_active !== undefined) {
      records = await ctx.db
        .query("discounts")
        .withIndex("by_is_active", (q) => q.eq("is_active", args.is_active!))
        .collect();
    } else {
      records = await ctx.db.query("discounts").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("discounts")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

export const create = mutation({
  args: discounts,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "discounts:create");
    return await ctx.db.insert("discounts", args);
  },
});

export const update = mutation({
  args: { id: v.id("discounts"), ...discounts },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "discounts:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("discounts") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "discounts:remove");
    return await ctx.db.delete(args.id);
  },
});
