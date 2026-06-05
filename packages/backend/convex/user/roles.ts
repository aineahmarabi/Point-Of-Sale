import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server";
import { roles, userApps } from "../validators";
import { v } from "convex/values";
import { assertPermission } from "../auth.helpers";

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("roles").paginate(args.paginationOpts);
  },
});

export const listByApp = query({
  args: {
    app: v.union(...userApps.map((e) => v.literal(e))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_app", (q) => q.eq("app", args.app))
      .collect();
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("roles").collect();
    return items.length;
  },
});

export const get = query({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    return await ctx.db.get("roles", args.id);
  },
});

export const create = mutation({
  args: roles,
  handler: async (ctx, args) => {
    await assertPermission(ctx, "roles:create");
    return await ctx.db.insert("roles", args);
  },
});

export const update = mutation({
  args: { id: v.id("roles"), ...roles },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "roles:update");
    const { id, ...rest } = args;
    return await ctx.db.patch("roles", id, rest);
  },
});

export const remove = mutation({
  args: { id: v.id("roles") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "roles:remove");
    return await ctx.db.delete("roles", args.id);
  },
});
