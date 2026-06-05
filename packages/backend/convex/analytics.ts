import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Analytics queries powering the admin dashboard. All are read-only and scoped
 * to completed orders. Date bounds are epoch milliseconds; ranges are treated
 * as [startDate, endDate].
 */

/** Completed orders whose effective timestamp falls within [start, end]. */
async function completedOrdersInRange(
  ctx: QueryCtx,
  start: number,
  end: number,
): Promise<Doc<"orders">[]> {
  const completed = await ctx.db
    .query("orders")
    .withIndex("by_status", (q) => q.eq("status", "completed"))
    .collect();
  return completed.filter((o) => {
    const t = o.completed_at ?? o._creationTime;
    return t >= start && t <= end;
  });
}

export const getDashboardStats = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const orders = await completedOrdersInRange(
      ctx,
      args.startDate,
      args.endDate,
    );
    const totalSales = orders.reduce((s, o) => s + o.grand_total, 0);
    const totalOrders = orders.length;
    const totalDiscounts = orders.reduce((s, o) => s + o.discount_total, 0);
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    return { totalSales, totalOrders, avgOrderValue, totalDiscounts };
  },
});

export const getSalesOverTime = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    groupBy: v.union(v.literal("hour"), v.literal("day")),
  },
  handler: async (ctx, args) => {
    const orders = await completedOrdersInRange(
      ctx,
      args.startDate,
      args.endDate,
    );

    const buckets = new Map<number, number>();
    for (const o of orders) {
      const t = o.completed_at ?? o._creationTime;
      const d = new Date(t);
      if (args.groupBy === "hour") {
        d.setMinutes(0, 0, 0);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      const key = d.getTime();
      buckets.set(key, (buckets.get(key) ?? 0) + o.grand_total);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([period, total]) => ({ period, total }));
  },
});

export const getSalesByPaymentMethod = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const orders = await completedOrdersInRange(
      ctx,
      args.startDate,
      args.endDate,
    );
    const totals = { cash: 0, paybill: 0, split: 0, other: 0 };
    for (const o of orders) {
      if (o.payment_method === "cash") totals.cash += o.grand_total;
      else if (o.payment_method === "paybill") totals.paybill += o.grand_total;
      else if (o.payment_method === "split") totals.split += o.grand_total;
      else totals.other += o.grand_total;
    }
    return totals;
  },
});

export const getTopProducts = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orders = await completedOrdersInRange(
      ctx,
      args.startDate,
      args.endDate,
    );

    const tally = new Map<string, { name: string; quantity: number }>();
    for (const order of orders) {
      const items = await ctx.db
        .query("order_items")
        .withIndex("by_order", (q) => q.eq("order_id", order._id))
        .collect();
      for (const item of items) {
        const key = item.product_name;
        const existing = tally.get(key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          tally.set(key, { name: item.product_name, quantity: item.quantity });
        }
      }
    }

    return Array.from(tally.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, args.limit ?? 5);
  },
});

export const getRecentOrders = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();
    const recent = orders
      .sort(
        (a, b) =>
          (b.completed_at ?? b._creationTime) -
          (a.completed_at ?? a._creationTime),
      )
      .slice(0, args.limit ?? 10);

    return await Promise.all(
      recent.map(async (order) => {
        const cashier = await ctx.db.get(order.cashier_id);
        const cashier_name = cashier?.name
          ? `${cashier.name.first} ${cashier.name.last}`
          : (cashier?.email ?? "—");
        const customer = order.customer_id
          ? await ctx.db.get(order.customer_id)
          : null;
        const items = await ctx.db
          .query("order_items")
          .withIndex("by_order", (q) => q.eq("order_id", order._id))
          .collect();
        const item_count = items.reduce((s, i) => s + i.quantity, 0);
        return {
          _id: order._id,
          order_number: order.order_number,
          cashier_name,
          customer_name: customer?.name ?? null,
          item_count,
          grand_total: order.grand_total,
          payment_method: order.payment_method,
          completed_at: order.completed_at ?? order._creationTime,
        };
      }),
    );
  },
});

export const getLowStockItems = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await ctx.db.query("inventory").collect();
    const low = inventory.filter((i) => i.quantity <= i.reorder_point);
    return await Promise.all(
      low.map(async (i) => {
        const product = await ctx.db.get(i.product_id);
        const variant = i.variant_id ? await ctx.db.get(i.variant_id) : null;
        return {
          _id: i._id,
          product_name: product?.name ?? "Unknown product",
          variant_name: variant?.name ?? null,
          quantity: i.quantity,
          reorder_point: i.reorder_point,
        };
      }),
    );
  },
});
