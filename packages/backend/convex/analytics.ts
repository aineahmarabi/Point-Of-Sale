import { query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

/**
 * Analytics queries powering the admin dashboard. All are read-only and scoped
 * to completed orders. Date bounds are epoch milliseconds; ranges are treated
 * as [startDate, endDate].
 */

/**
 * Completed orders whose effective timestamp falls within [start, end].
 * Uses completed_at when set (set by the cashier client at checkout time).
 * Falls back to _creationTime so records without completed_at are still found.
 * Both start and end must be unix epoch milliseconds.
 */
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
    // completed_at is set by the browser via Date.now() at checkout.
    // _creationTime is set by Convex server when the document is inserted.
    // Prefer completed_at; it is stored as a float64 but always an integer ms.
    const t = typeof o.completed_at === "number" ? o.completed_at : o._creationTime;
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

// ── REPORT QUERIES ────────────────────────────────────────────

async function allOrdersInRange(
  ctx: QueryCtx,
  start: number,
  end: number,
): Promise<Doc<"orders">[]> {
  const all = await ctx.db.query("orders").collect();
  return all.filter((o) => {
    const t = typeof o.completed_at === "number" ? o.completed_at : o._creationTime;
    return t >= start && t <= end;
  });
}

export const getSalesReport = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const orders = await completedOrdersInRange(ctx, args.startDate, args.endDate);
    const totalSales = orders.reduce((s, o) => s + o.grand_total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalTax = orders.reduce((s, o) => s + o.tax_total, 0);

    const span = args.endDate - args.startDate;
    const groupBy: "hour" | "day" = span <= 2 * 24 * 60 * 60 * 1000 ? "hour" : "day";

    const timeBuckets = new Map<number, number>();
    for (const o of orders) {
      const t = o.completed_at ?? o._creationTime;
      const d = new Date(t);
      if (groupBy === "hour") { d.setMinutes(0, 0, 0); } else { d.setHours(0, 0, 0, 0); }
      const key = d.getTime();
      timeBuckets.set(key, (timeBuckets.get(key) ?? 0) + o.grand_total);
    }
    const salesOverTime = Array.from(timeBuckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([period, total]) => ({ period, total }));

    const byPaymentMethod = { cash: 0, paybill: 0, split: 0, other: 0 };
    for (const o of orders) {
      if (o.payment_method === "cash") byPaymentMethod.cash += o.grand_total;
      else if (o.payment_method === "paybill") byPaymentMethod.paybill += o.grand_total;
      else if (o.payment_method === "split") byPaymentMethod.split += o.grand_total;
      else byPaymentMethod.other += o.grand_total;
    }

    const sorted = [...orders].sort(
      (a, b) => (b.completed_at ?? b._creationTime) - (a.completed_at ?? a._creationTime),
    );
    const orderRows = await Promise.all(
      sorted.map(async (o) => {
        const cashier = await ctx.db.get(o.cashier_id);
        const cashier_name = cashier?.name
          ? `${cashier.name.first} ${cashier.name.last}`
          : (cashier?.email ?? "—");
        const items = await ctx.db
          .query("order_items")
          .withIndex("by_order", (q) => q.eq("order_id", o._id))
          .collect();
        const item_count = items.reduce((s, i) => s + i.quantity, 0);
        return {
          _id: o._id,
          order_number: o.order_number,
          cashier_name,
          item_count,
          grand_total: o.grand_total,
          payment_method: o.payment_method,
          completed_at: o.completed_at ?? o._creationTime,
        };
      }),
    );

    return { totalSales, totalOrders, avgOrderValue, totalTax, salesOverTime, byPaymentMethod, groupBy, orders: orderRows };
  },
});

export const getOrdersReport = query({
  args: { startDate: v.number(), endDate: v.number() },
  handler: async (ctx, args) => {
    const orders = await allOrdersInRange(ctx, args.startDate, args.endDate);
    const totalOrders = orders.length;

    const byStatus = { completed: 0, voided: 0, refunded: 0 };
    const byHourMap = new Map<number, number>();

    for (const o of orders) {
      if (o.status === "completed") byStatus.completed++;
      else if (o.status === "voided") byStatus.voided++;
      else if (o.status === "refunded") byStatus.refunded++;

      const t = o.completed_at ?? o._creationTime;
      const hour = new Date(t).getHours();
      byHourMap.set(hour, (byHourMap.get(hour) ?? 0) + 1);
    }

    const cashierIds = [...new Set(orders.map((o) => o.cashier_id))];
    const cashierNameMap = new Map<string, string>();
    for (const id of cashierIds) {
      const c = await ctx.db.get(id);
      cashierNameMap.set(
        id,
        c?.name ? `${c.name.first} ${c.name.last}` : (c?.email ?? "—"),
      );
    }

    const cashierCountMap = new Map<string, { name: string; count: number }>();
    for (const o of orders) {
      const name = cashierNameMap.get(o.cashier_id) ?? "—";
      const ex = cashierCountMap.get(o.cashier_id);
      if (ex) { ex.count++; } else { cashierCountMap.set(o.cashier_id, { name, count: 1 }); }
    }

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      count: byHourMap.get(h) ?? 0,
    }));

    const byCashier = Array.from(cashierCountMap.values()).sort((a, b) => b.count - a.count);

    const orderRows = [...orders]
      .sort((a, b) => (b.completed_at ?? b._creationTime) - (a.completed_at ?? a._creationTime))
      .map((o) => ({
        _id: o._id,
        order_number: o.order_number,
        cashier_name: cashierNameMap.get(o.cashier_id) ?? "—",
        grand_total: o.grand_total,
        status: o.status,
        payment_method: o.payment_method,
        completed_at: o.completed_at ?? o._creationTime,
      }));

    return { totalOrders, byStatus, byHour, byCashier, orders: orderRows };
  },
});

export const getInventoryReport = query({
  args: {},
  handler: async (ctx) => {
    const inventory = await ctx.db.query("inventory").collect();
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    const items = await Promise.all(
      inventory.map(async (i) => {
        const product = await ctx.db.get(i.product_id);
        const variant = i.variant_id ? await ctx.db.get(i.variant_id) : null;
        const category = product?.category_id ? await ctx.db.get(product.category_id) : null;

        let status: "ok" | "low" | "out";
        if (i.quantity === 0) {
          status = "out";
          outOfStock++;
        } else if (i.quantity <= i.reorder_point) {
          status = "low";
          lowStock++;
        } else {
          status = "ok";
          inStock++;
        }

        return {
          _id: i._id,
          product_id: i.product_id,
          product_name: product?.name ?? "Unknown",
          variant_name: variant?.name ?? null,
          category_name: category?.name ?? "Uncategorized",
          quantity: i.quantity,
          reorder_point: i.reorder_point,
          status,
        };
      }),
    );

    const categoryMap = new Map<string, number>();
    for (const item of items) {
      const cat = item.category_name;
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + item.quantity);
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, totalQuantity]) => ({ category, totalQuantity }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return {
      totalProducts: inventory.length,
      inStock,
      lowStock,
      outOfStock,
      items: [...items].sort((a, b) => a.quantity - b.quantity),
      byCategory,
    };
  },
});
