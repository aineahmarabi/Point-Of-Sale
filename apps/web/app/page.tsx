"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";

import { isAdminRole } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();
  const currentUser = useQuery(api.user.users.currentUser);

  useEffect(() => {
    // Wait for both Clerk and Convex to finish loading
    if (!isClerkLoaded || currentUser === undefined) return;

    // Clerk says not signed in → go to sign-in
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    // Signed in with Clerk but Convex user not yet created — webhook race condition
    // after invite acceptance. Convex is real-time, so this will re-run automatically
    // once the clerk webhook fires and creates the user record.
    if (currentUser === null) return;

    if (isAdminRole(currentUser.role)) {
      router.replace("/dashboard");
    } else {
      router.replace("/terminal");
    }
  }, [isClerkLoaded, isSignedIn, currentUser, router]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-burgundy-400" />
    </div>
  );
}
