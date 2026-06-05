import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";

export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerk_id", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError("User not found");
  }

  const role = user.role ? await ctx.db.get(user.role) : null;
  const permissions = role?.permissions ?? [];

  return { user, role, permissions };
}

export async function assertPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string,
) {
  const { permissions } = await getAuthUser(ctx);

  if (permissions.includes("*")) return;
  if (permissions.includes(permission)) return;

  throw new ConvexError(`Forbidden: missing permission "${permission}"`);
}

export async function hasPermission(
  ctx: QueryCtx | MutationCtx,
  permission: string,
): Promise<boolean> {
  try {
    const { permissions } = await getAuthUser(ctx);
    return permissions.includes("*") || permissions.includes(permission);
  } catch {
    return false;
  }
}
