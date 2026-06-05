import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { purchase_orders } from "../validators";
import { v } from "convex/values";
import { assertPermission, getAuthUser } from "../auth.helpers";

// created_by is stamped server-side from the authenticated user.
const { created_by: _createdBy, ...purchaseOrderArgs } = purchase_orders;

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    supplier_id: v.optional(v.id("suppliers")),
    status: v.optional(purchase_orders.status),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.supplier_id) {
      results = await ctx.db
        .query("purchase_orders")
        .withIndex("by_supplier", (q) =>
          q.eq("supplier_id", args.supplier_id!),
        )
        .paginate(args.paginationOpts);
    } else if (args.status) {
      results = await ctx.db
        .query("purchase_orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("purchase_orders")
        .paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (order) => {
        const supplier = await ctx.db.get(order.supplier_id);
        return { ...order, supplier_name: supplier?.name ?? null };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    supplier_id: v.optional(v.id("suppliers")),
    status: v.optional(purchase_orders.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.supplier_id) {
      records = await ctx.db
        .query("purchase_orders")
        .withIndex("by_supplier", (q) =>
          q.eq("supplier_id", args.supplier_id!),
        )
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("purchase_orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("purchase_orders").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: purchaseOrderArgs,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:create");
    const { user } = await getAuthUser(ctx);
    return await ctx.db.insert("purchase_orders", {
      ...args,
      created_by: user._id,
    });
  },
});

export const update = mutation({
  args: { id: v.id("purchase_orders"), ...purchaseOrderArgs },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:update");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "purchase_orders:remove");
    return await ctx.db.delete(args.id);
  },
});
