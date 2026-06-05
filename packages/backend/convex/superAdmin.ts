import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const superAdmin = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", "Super Admin"))
      .first();
    let roleId = existing?._id;
    if (existing) {
      await ctx.db.patch(existing._id, {
        permissions: ["*"],
        description: "Full unrestricted access to all resources and actions",
      });
    } else {
      roleId = await ctx.db.insert("roles", {
        name: "Super Admin",
        app: "admin",
        description: "Full unrestricted access to all resources and actions",
        permissions: ["*"],
      });
    }
    const users = await ctx.db.query("users").collect();
    const matches = users.filter(
      (u) => u.email.toLowerCase() === args.email.toLowerCase(),
    );
    if (matches.length === 0) {
      throw new Error(
        `User with email "${args.email}" not found. Make sure they have signed in at least once.`,
      );
    }
    // Patch EVERY row with this email so duplicate rows can't leave one stale.
    for (const user of matches) {
      await ctx.db.patch(user._id, {
        role: roleId,
        status: "active",
        app: user.app.includes("admin") ? user.app : [...user.app, "admin"],
      });
    }
    return {
      roleId,
      userIds: matches.map((u) => u._id),
      patchedCount: matches.length,
      message: `Super Admin role assigned to ${args.email} (${matches.length} row(s) patched)`,
    };
  },
});
