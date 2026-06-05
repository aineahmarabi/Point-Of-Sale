import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { sessions } from "../validators";
import { ConvexError, v } from "convex/values";
import { assertPermission, getAuthUser } from "../auth.helpers";

export const getOpenByUser = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await getAuthUser(ctx);
    return await ctx.db
      .query("sessions")
      .withIndex("by_cashier_status", (q) =>
        q.eq("cashier_id", user._id).eq("status", "open"),
      )
      .first();
  },
});

export const close = mutation({
  args: {
    id: v.id("sessions"),
    closing_cash: v.float64(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "pos:close_session");
    const session = await ctx.db.get(args.id);
    if (!session) throw new ConvexError("Session not found");

    // Aggregate all orders booked against this session.
    const sessionOrders = await ctx.db
      .query("orders")
      .withIndex("by_session", (q) => q.eq("session_id", args.id))
      .collect();
    const completed = sessionOrders.filter((o) => o.status === "completed");

    const total_sales = completed.reduce((s, o) => s + o.grand_total, 0);
    const total_tax = completed.reduce((s, o) => s + o.tax_total, 0);
    const total_discounts = completed.reduce(
      (s, o) => s + o.discount_total,
      0,
    );
    const cash_sales = completed
      .filter((o) => o.payment_method === "cash")
      .reduce((s, o) => s + o.grand_total, 0);
    const other_sales = total_sales - cash_sales;
    const transaction_count = completed.length;

    const sessionReturns = await ctx.db
      .query("returns")
      .withIndex("by_session", (q) => q.eq("session_id", args.id))
      .collect();
    const total_refunds = sessionReturns
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + r.refund_amount, 0);

    // Cash drawer is opening float plus cash collected (paybill never adds cash).
    const expected_cash = session.opening_cash + cash_sales;
    const cash_variance = args.closing_cash - expected_cash;

    await ctx.db.patch(args.id, {
      status: "closed",
      closing_cash: args.closing_cash,
      expected_cash,
      cash_variance,
      closed_at: Date.now(),
      total_sales,
      total_refunds,
      total_discounts,
      total_tax,
      cash_sales,
      other_sales,
      transaction_count,
      ...(args.notes ? { notes: args.notes } : {}),
    });

    return args.id;
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    cashier_id: v.optional(v.id("users")),
    status: v.optional(sessions.status),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.cashier_id && args.status) {
      results = await ctx.db
        .query("sessions")
        .withIndex("by_cashier_status", (q) =>
          q.eq("cashier_id", args.cashier_id!).eq("status", args.status!),
        )
        .paginate(args.paginationOpts);
    } else if (args.cashier_id) {
      results = await ctx.db
        .query("sessions")
        .withIndex("by_cashier", (q) => q.eq("cashier_id", args.cashier_id!))
        .paginate(args.paginationOpts);
    } else if (args.status) {
      results = await ctx.db
        .query("sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db.query("sessions").paginate(args.paginationOpts);
    }

    const page = await Promise.all(
      results.page.map(async (session) => {
        const cashier = await ctx.db.get(session.cashier_id);
        const cashier_name = cashier?.name
          ? `${cashier.name.first} ${cashier.name.last}`
          : (cashier?.email ?? null);
        return { ...session, cashier_name };
      }),
    );

    return { ...results, page };
  },
});

export const count = query({
  args: {
    cashier_id: v.optional(v.id("users")),
    status: v.optional(sessions.status),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.cashier_id && args.status) {
      records = await ctx.db
        .query("sessions")
        .withIndex("by_cashier_status", (q) =>
          q.eq("cashier_id", args.cashier_id!).eq("status", args.status!),
        )
        .collect();
    } else if (args.cashier_id) {
      records = await ctx.db
        .query("sessions")
        .withIndex("by_cashier", (q) => q.eq("cashier_id", args.cashier_id!))
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("sessions")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      records = await ctx.db.query("sessions").collect();
    }
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: sessions,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "pos:open_session");
    return await ctx.db.insert("sessions", args);
  },
});

export const update = mutation({
  args: { id: v.id("sessions"), ...sessions },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "pos:close_session");
    const { id, ...rest } = args;
    return await ctx.db.patch(id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("sessions") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "sessions:remove");
    return await ctx.db.delete(args.id);
  },
});
