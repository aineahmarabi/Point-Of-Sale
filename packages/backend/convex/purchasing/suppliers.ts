import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { slugify } from "@repo/lib/utils";
import { suppliers } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

const { slug: _slug, ...suppliersArgs } = suppliers;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(suppliers.status),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("suppliers")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("suppliers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("suppliers").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(suppliers.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("suppliers")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("suppliers")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("suppliers").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: suppliersArgs,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "suppliers:create");
    const { name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.insert("suppliers", { name, ...rest, slug });
  },
});

export const update = mutation({
  args: { id: v.id("suppliers"), ...suppliersArgs },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "suppliers:update");
    const { id, name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.patch(id, { name, ...rest, slug });
  },
});

export const remove = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "suppliers:remove");
    return await ctx.db.delete(args.id);
  },
});
