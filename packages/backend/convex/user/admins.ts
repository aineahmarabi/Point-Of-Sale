import { mutation } from "../_generated/server";
import { v } from "convex/values";

import { assertPermission } from "../auth.helpers";

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "admins:remove");
    return await ctx.db.delete("users", args.id);
  },
});
