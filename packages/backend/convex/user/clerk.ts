import {
  internalMutation,
  internalQuery,
  httpAction,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { Doc } from "../_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { Webhook } from "svix";

import { clerkUser } from "../validators";

export const getUserByClerkId = internalQuery({
  args: { clerk_id: clerkUser.clerk_id },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .first();
  },
});

export const getRoleByName = internalQuery({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("roles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

export const create = internalMutation({
  args: clerkUser,
  handler: async (ctx, args) => {
    // 1. A row already exists for this Clerk id → patch it (re-sync), never
    //    insert a duplicate on repeated user.created events.
    const byClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
      .first();
    if (byClerkId) {
      await ctx.db.patch("users", byClerkId._id, args);
      return byClerkId._id;
    }

    // 2. A row already exists for this email → adopt the new clerk_id and keep
    //    the existing row (preserves any role/status already assigned to it).
    const byEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    if (byEmail) {
      await ctx.db.patch("users", byEmail._id, { clerk_id: args.clerk_id });
      return byEmail._id;
    }

    // 3. Neither exists → insert a new row.
    return await ctx.db.insert("users", args);
  },
});

export const update = internalMutation({
  args: clerkUser,
  handler: async (ctx, args) => {
    const user = (await ctx.runQuery(internal.user.clerk.getUserByClerkId, {
      clerk_id: args.clerk_id,
    })) as Doc<"users"> | null;
    if (!user) {
      throw new ConvexError(`User with clerk_id ${args.clerk_id} not found`);
    }
    return await ctx.db.patch("users", user._id, args);
  },
});

export const remove = internalMutation({
  args: v.object({ clerk_id: clerkUser.clerk_id }),
  handler: async (ctx, args) => {
    const user = (await ctx.runQuery(internal.user.clerk.getUserByClerkId, {
      clerk_id: args.clerk_id,
    })) as Doc<"users"> | null;
    if (!user) {
      throw new ConvexError(`User with clerk_id ${args.clerk_id} not found`);
    }
    return await ctx.db.patch("users", user._id, { status: "inactive" });
  },
});

export const clerkWebhook = httpAction(async (ctx, req) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    throw new ConvexError(
      "CLERK_WEBHOOK_SECRET environment variable is not set",
    );
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const body = await req.text();

  const wh = new Webhook(secret);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let request: { type: string; data: any };
  try {
    request = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof request;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const { data } = request;

  const meta = data.public_metadata ?? {};
  const roleName: string = meta.role ?? "Customer";
  const role = await ctx.runQuery(internal.user.clerk.getRoleByName, {
    name: roleName,
  });

  const appArray: string[] = Array.isArray(meta.app)
    ? meta.app
    : [meta.app ?? "web"];
  const isAdmin = appArray.includes("admin");

  // Name: prefer what the user entered at signup; fall back to what the admin
  // supplied in the invite metadata (stored as meta.first_name / meta.last_name).
  const firstName: string = data.first_name || meta.first_name || "";
  const lastName: string = data.last_name || meta.last_name || "";

  const userFields = {
    name:
      firstName || lastName
        ? { first: firstName, last: lastName }
        : undefined,
    email: data.email_addresses[0].email_address,
    phone: meta.phone ?? undefined,
    user_type: meta.user_type ?? undefined,
    status: meta.status ?? "active",
    app: appArray as ("admin" | "web")[],
    is_admin: isAdmin,
    role: role?._id,
    clerk_id: data.id,
  };

  switch (request.type) {
    case "user.created": {
      await ctx.runMutation(internal.user.clerk.create, userFields);
      break;
    }
    case "user.updated": {
      await ctx.runMutation(internal.user.clerk.update, userFields);
      break;
    }
    case "user.deleted": {
      await ctx.runMutation(internal.user.clerk.remove, {
        clerk_id: data.id,
      });
      break;
    }
    default: {
      // Unhandled event types are silently ignored.
    }
  }
  return new Response("Clerk webhook processed", { status: 200 });
});
