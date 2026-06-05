import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { orders } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    status: v.optional(orders.status),
    payment_method: v.optional(orders.payment_method),
    session_id: v.optional(v.id("sessions")),
    customer_id: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    const pm = args.payment_method;
    let results;
    if (args.search) {
      results = await ctx.db
        .query("orders")
        .withSearchIndex("by_order_number_search", (q) => {
          let sq = q.search("order_number", args.search!);
          if (args.status) sq = sq.eq("status", args.status);
          if (pm) sq = sq.eq("payment_method", pm);
          return sq;
        })
        .paginate(args.paginationOpts);
    } else if (args.session_id) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_session", (qq) => qq.eq("session_id", args.session_id!));
      results = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).paginate(args.paginationOpts);
    } else if (args.customer_id) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_customer", (qq) =>
          qq.eq("customer_id", args.customer_id!),
        );
      results = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).paginate(args.paginationOpts);
    } else if (args.status) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_status", (qq) => qq.eq("status", args.status!));
      results = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).paginate(args.paginationOpts);
    } else if (pm) {
      results = await ctx.db
        .query("orders")
        .withIndex("by_payment_method", (qq) => qq.eq("payment_method", pm))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db.query("orders").paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (order) => {
        const cashier = await ctx.db.get(order.cashier_id);
        const cashier_name = cashier?.name
          ? `${cashier.name.first} ${cashier.name.last}`
          : (cashier?.email ?? null);
        const customer = order.customer_id
          ? await ctx.db.get(order.customer_id)
          : null;
        return {
          ...order,
          cashier_name,
          customer_name: customer?.name ?? null,
        };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(orders.status),
    payment_method: v.optional(orders.payment_method),
    session_id: v.optional(v.id("sessions")),
    customer_id: v.optional(v.id("customers")),
  },
  handler: async (ctx, args) => {
    const pm = args.payment_method;
    let records;
    if (args.search) {
      records = await ctx.db
        .query("orders")
        .withSearchIndex("by_order_number_search", (q) => {
          let sq = q.search("order_number", args.search!);
          if (args.status) sq = sq.eq("status", args.status);
          if (pm) sq = sq.eq("payment_method", pm);
          return sq;
        })
        .collect();
    } else if (args.session_id) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_session", (qq) => qq.eq("session_id", args.session_id!));
      records = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).collect();
    } else if (args.customer_id) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_customer", (qq) =>
          qq.eq("customer_id", args.customer_id!),
        );
      records = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).collect();
    } else if (args.status) {
      const q = ctx.db
        .query("orders")
        .withIndex("by_status", (qq) => qq.eq("status", args.status!));
      records = await (pm
        ? q.filter((c) => c.eq(c.field("payment_method"), pm))
        : q
      ).collect();
    } else if (pm) {
      records = await ctx.db
        .query("orders")
        .withIndex("by_payment_method", (qq) => qq.eq("payment_method", pm))
        .collect();
    } else {
      records = await ctx.db.query("orders").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: orders,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:create");
    const orderId = await ctx.db.insert("orders", args);

    // Update customer lifetime stats when the sale is attributed to one.
    if (args.customer_id) {
      const customer = await ctx.db.get(args.customer_id);
      if (customer) {
        await ctx.db.patch(args.customer_id, {
          visit_count: customer.visit_count + 1,
          total_spend: customer.total_spend + args.grand_total,
        });
      }
    }

    return orderId;
  },
});

export const update = mutation({
  args: { id: v.id("orders"), ...orders },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:void");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "orders:void");
    return await ctx.db.delete(args.id);
  },
});
