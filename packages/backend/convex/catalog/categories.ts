import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { slugify } from "@repo/lib/utils";
import { categories } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

const { slug: _slug, ...categoriesArgs } = categories;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(categories.status),
  },
  handler: async (ctx, args) => {
    if (args.search) {
      return await ctx.db
        .query("categories")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .paginate(args.paginationOpts);
    }
    if (args.status) {
      return await ctx.db
        .query("categories")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    }
    return await ctx.db.query("categories").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(categories.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("categories")
        .withSearchIndex("by_name", (q) => {
          const sq = q.search("name", args.search!);
          return args.status ? sq.eq("status", args.status) : sq;
        })
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("categories")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("categories").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: categoriesArgs,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "categories:create");
    const { name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.insert("categories", { name, ...rest, slug });
  },
});

export const update = mutation({
  args: { id: v.id("categories"), ...categoriesArgs },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "categories:update");
    const { id, name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.patch(id, { name, ...rest, slug });
  },
});

export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "categories:remove");
    return await ctx.db.delete(args.id);
  },
});
