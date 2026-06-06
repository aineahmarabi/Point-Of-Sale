import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { store_settings } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("store_settings").paginate(args.paginationOpts);
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("store_settings").collect();
    return records.length;
  },
});

export const get = query({
  args: { id: v.id("store_settings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("store_settings").first();
  },
});

/** Public — no auth required. Returns only the fields safe to show on the
 *  sign-in page (store name + logo URL). */
export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("store_settings").first();
    if (!settings) return null;
    return {
      store_name: settings.store_name,
      logo_url: settings.logo_url ?? null,
    };
  },
});

export const upsert = mutation({
  args: store_settings,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "settings:update");
    const existing = await ctx.db.query("store_settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return await ctx.db.insert("store_settings", args);
  },
});

export const remove = mutation({
  args: { id: v.id("store_settings") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "settings:remove");
    return await ctx.db.delete(args.id);
  },
});
