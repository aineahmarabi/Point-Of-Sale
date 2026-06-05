import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { slugify } from "@repo/lib/utils";
import { products } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

const { slug: _slug, ...productsArgs } = products;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(products.status),
    category_id: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.search) {
      results = await ctx.db
        .query("products")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name", args.search!);
          if (args.status) sq = sq.eq("status", args.status);
          if (args.category_id) sq = sq.eq("category_id", args.category_id);
          return sq;
        })
        .paginate(args.paginationOpts);
    } else if (args.category_id) {
      results = await ctx.db
        .query("products")
        .withIndex("by_category", (q) =>
          q.eq("category_id", args.category_id!),
        )
        .paginate(args.paginationOpts);
    } else if (args.status) {
      results = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db.query("products").paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (product) => {
        const category = product.category_id
          ? await ctx.db.get(product.category_id)
          : null;
        return { ...product, category_name: category?.name ?? null };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(products.status),
    category_id: v.optional(v.id("categories")),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("products")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name", args.search!);
          if (args.status) sq = sq.eq("status", args.status);
          if (args.category_id) sq = sq.eq("category_id", args.category_id);
          return sq;
        })
        .collect();
    } else if (args.category_id) {
      records = await ctx.db
        .query("products")
        .withIndex("by_category", (q) =>
          q.eq("category_id", args.category_id!),
        )
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("products")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("products").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const create = mutation({
  args: productsArgs,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "products:create");
    const { name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.insert("products", { name, ...rest, slug });
  },
});

export const update = mutation({
  args: { id: v.id("products"), ...productsArgs },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "products:update");
    const { id, name, ...rest } = args;
    const slug = slugify(name);
    return await ctx.db.patch(id, { name, ...rest, slug });
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "products:remove");
    return await ctx.db.delete(args.id);
  },
});
