import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser } from "./auth.helpers";

/**
 * Convex file storage helpers for image uploads (product images, store logo,
 * etc). Flow:
 *   1. client calls `generateUploadUrl` → short-lived upload URL
 *   2. client POSTs the file bytes to that URL → `{ storageId }`
 *   3. client calls `getUrl({ storageId })` → a stable public URL string,
 *      which is stored on the product/settings record like before.
 */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Any signed-in staff member may upload.
    await getAuthUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await getAuthUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
