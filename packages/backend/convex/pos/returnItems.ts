import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { return_items } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    return_id: v.optional(v.id("returns")),
  },
  handler: async (ctx, args) => {
    if (args.return_id) {
      return await ctx.db
        .query("return_items")
        .withIndex("by_return", (q) => q.eq("return_id", args.return_id!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("return_items").paginate(args.paginationOpts);
  },
});

export const listByReturn = query({
  args: { return_id: v.id("returns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("return_items")
      .withIndex("by_return", (q) => q.eq("return_id", args.return_id))
      .collect();
  },
});

export const count = query({
  args: {
    return_id: v.optional(v.id("returns")),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.return_id) {
      records = await ctx.db
        .query("return_items")
        .withIndex("by_return", (q) => q.eq("return_id", args.return_id!))
        .collect();
    } else {
      records = await ctx.db.query("return_items").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("return_items") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: return_items,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:create");
    return await ctx.db.insert("return_items", args);
  },
});

export const update = mutation({
  args: { id: v.id("return_items"), ...return_items },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:create");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("return_items") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "returns:void");
    return await ctx.db.delete(args.id);
  },
});
