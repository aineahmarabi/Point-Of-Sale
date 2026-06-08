import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public auth routes. /sign-up is required by Clerk's invite acceptance flow
// even though we don't host a custom sign-up page.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Signed-in staff shouldn't see the auth screens. Send them to "/", where the
  // role router redirects admins → /dashboard and cashiers → /terminal.
  // (Role lives in Convex, not the Clerk token, so the authoritative admin-only
  // gate is the (admin) layout — cashiers hitting /dashboard are redirected to
  // /terminal there. /terminal and /open-session are open to all staff.)
  if (userId && isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!isPublicRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
