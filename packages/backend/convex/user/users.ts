import { query, mutation } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { users, userApps } from "../validators";
import { ConvexError, v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { assertPermission, getAuthUser } from "../auth.helpers";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }

    // There may be duplicate rows for the same Clerk user (e.g. repeated
    // user.created webhooks). Resolve every match and pick the most useful one:
    // prefer a row WITH a role, and among those the most privileged ("*").
    const matches = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", identity.subject))
      .collect();

    const candidates = await Promise.all(
      matches.map(async (u) => ({
        user: u,
        role: u.role ? await ctx.db.get(u.role) : null,
      })),
    );

    // Prefer the best row among duplicates: active + wildcard, then active +
    // any role, then wildcard, then any role, then any active, then the first.
    const chosen =
      candidates.find(
        (c) => c.user.status === "active" && c.role?.permissions?.includes("*"),
      ) ??
      candidates.find((c) => c.user.status === "active" && c.role) ??
      candidates.find((c) => c.role?.permissions?.includes("*")) ??
      candidates.find((c) => c.role) ??
      candidates.find((c) => c.user.status === "active") ??
      candidates[0];

    if (!chosen) {
      // The Clerk session references a user that no longer exists in Convex
      // (e.g. deleted). Treat it as unauthenticated rather than throwing, so
      // the client can prompt a clean sign-in instead of crashing.
      return null;
    }

    const { user, role } = chosen;
    const image_url = user.image
      ? await ctx.storage.getUrl(user.image as Id<"_storage">)
      : null;
    return { ...user, image_url, role: role ? role : null };
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    isAdmin: v.boolean(),
    app: v.optional(v.array(v.union(...userApps.map((e) => v.literal(e))))),
    status: v.optional(users.status),
    userType: v.optional(users.user_type),
  },
  handler: async (ctx, args) => {
    let results;
    if (args.search) {
      results = await ctx.db
        .query("users")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name.first", args.search!);
          sq = sq.eq("is_admin", args.isAdmin);
          if (args.status) sq = sq.eq("status", args.status);
          if (args.userType) sq = sq.eq("user_type", args.userType);
          return sq;
        })
        .paginate(args.paginationOpts);
    } else if (args.status && args.userType) {
      results = await ctx.db
        .query("users")
        .withIndex("by_is_admin_status_usertype", (q) =>
          q
            .eq("is_admin", args.isAdmin)
            .eq("status", args.status!)
            .eq("user_type", args.userType!),
        )
        .paginate(args.paginationOpts);
    } else if (args.status) {
      results = await ctx.db
        .query("users")
        .withIndex("by_is_admin_status", (q) =>
          q.eq("is_admin", args.isAdmin).eq("status", args.status!),
        )
        .paginate(args.paginationOpts);
    } else if (args.userType) {
      results = await ctx.db
        .query("users")
        .withIndex("by_is_admin_usertype", (q) =>
          q.eq("is_admin", args.isAdmin).eq("user_type", args.userType!),
        )
        .paginate(args.paginationOpts);
    } else {
      results = await ctx.db
        .query("users")
        .withIndex("by_is_admin", (q) => q.eq("is_admin", args.isAdmin))
        .paginate(args.paginationOpts);
    }

    const enriched = await Promise.all(
      results.page.map(async (user) => {
        const image_url = user.image
          ? await ctx.storage.getUrl(user.image as Id<"_storage">)
          : null;
        const role = user.role ? await ctx.db.get(user.role) : null;
        return { ...user, image_url, role_name: role ? role.name : null };
      }),
    );

    return { ...results, page: enriched };
  },
});

export const count = query({
  args: {
    search: v.optional(v.string()),
    isAdmin: v.boolean(),
    app: v.optional(v.array(v.union(...userApps.map((e) => v.literal(e))))),
    status: v.optional(users.status),
    userType: v.optional(users.user_type),
  },
  handler: async (ctx, args) => {
    let records;
    if (args.search) {
      records = await ctx.db
        .query("users")
        .withSearchIndex("by_name", (q) => {
          let sq = q.search("name.first", args.search!);
          sq = sq.eq("is_admin", args.isAdmin);
          if (args.status) sq = sq.eq("status", args.status);
          if (args.userType) sq = sq.eq("user_type", args.userType);
          return sq;
        })
        .collect();
    } else if (args.status && args.userType) {
      records = await ctx.db
        .query("users")
        .withIndex("by_is_admin_status_usertype", (q) =>
          q
            .eq("is_admin", args.isAdmin)
            .eq("status", args.status!)
            .eq("user_type", args.userType!),
        )
        .collect();
    } else if (args.status) {
      records = await ctx.db
        .query("users")
        .withIndex("by_is_admin_status", (q) =>
          q.eq("is_admin", args.isAdmin).eq("status", args.status!),
        )
        .collect();
    } else if (args.userType) {
      records = await ctx.db
        .query("users")
        .withIndex("by_is_admin_usertype", (q) =>
          q.eq("is_admin", args.isAdmin).eq("user_type", args.userType!),
        )
        .collect();
    } else {
      records = await ctx.db
        .query("users")
        .withIndex("by_is_admin", (q) => q.eq("is_admin", args.isAdmin))
        .collect();
    }
    return records.length;
  },
});

/** Admin staff management: change a user's role, status, and optionally name. */
export const updateStaff = mutation({
  args: {
    id: v.id("users"),
    role: v.optional(v.id("roles")),
    status: users.status,
    name: v.optional(v.object({ first: v.string(), last: v.string() })),
  },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "staff:update");
    const { user } = await getAuthUser(ctx);
    if (user._id === args.id) {
      throw new ConvexError("You cannot edit your own account.");
    }
    const target = await ctx.db.get(args.id);
    if (!target) {
      throw new ConvexError("Staff member not found.");
    }
    if (args.role) {
      const role = await ctx.db.get(args.role);
      if (!role) {
        throw new ConvexError("Selected role no longer exists.");
      }
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.role
        ? {
            role: args.role,
            is_admin: await roleIsAdmin(ctx, args.role),
          }
        : {}),
      ...(args.name ? { name: args.name } : {}),
    });
    return args.id;
  },
});

/** True when a role carries wildcard or admin-level access. */
async function roleIsAdmin(
  ctx: { db: { get: (id: Id<"roles">) => Promise<Doc<"roles"> | null> } },
  roleId: Id<"roles">,
): Promise<boolean> {
  const role = await ctx.db.get(roleId);
  if (!role) return false;
  return (
    role.permissions?.includes("*") ||
    role.name.toLowerCase().includes("admin") ||
    role.app === "admin"
  );
}

/**
 * Assign a role to a user and mark them active. Used by staff management and
 * the invite-acceptance flow so accounts never end up role-less.
 */
export const assignRole = mutation({
  args: {
    userId: v.id("users"),
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    await assertPermission(ctx, "staff:update");
    const target = await ctx.db.get(args.userId);
    if (!target) {
      throw new ConvexError("User not found.");
    }
    const role = await ctx.db.get(args.roleId);
    if (!role) {
      throw new ConvexError("Role not found.");
    }
    await ctx.db.patch(args.userId, {
      role: args.roleId,
      status: "active",
      is_admin: await roleIsAdmin(ctx, args.roleId),
    });
    return args.userId;
  },
});
