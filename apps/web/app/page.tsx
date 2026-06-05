"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";

import { isAdminRole } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();
  const currentUser = useQuery(api.user.users.currentUser);

  useEffect(() => {
    if (currentUser === undefined) return;
    if (currentUser && isAdminRole(currentUser.role)) {
      router.replace("/dashboard");
    } else {
      router.replace("/terminal");
    }
  }, [currentUser, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
    </div>
  );
}
