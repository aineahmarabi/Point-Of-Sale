
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { customers } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(customers.status),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("customers")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("customers").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(customers.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("customers")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("customers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("customers").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: customers,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "customers:create");
    return await ctx.db.insert("customers", args);
  },
});

export const update = mutation({
  args: { id: v.id("customers"), ...customers },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "customers:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "customers:remove");
    return await ctx.db.delete(args.id);
  },
});
