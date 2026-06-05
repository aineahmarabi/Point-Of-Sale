"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@repo/backend";
import { DataProvider } from "@repo/auth/providers";

import { isAdminRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-burgundy-400" />
    </div>
  );
}

type CurrentUser = NonNullable<
  FunctionReturnType<typeof api.user.users.currentUser>
>;

function AdminShell({
  user,
  children,
}: {
  user: CurrentUser;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-white">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-slate-100">
        {/* Mobile top bar with hamburger */}
        <div className="flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="text-xl leading-none"
          >
            ☰
          </button>
          <span className="font-semibold">Admin</span>
        </div>

        {children}
      </div>
    </div>
  );
}

function AdminGate({ children }: { children: ReactNode }) {
  const currentUser = useQuery(api.user.users.currentUser);
  const router = useRouter();

  const allowed = !!currentUser && isAdminRole(currentUser.role);

  useEffect(() => {
    if (currentUser === undefined) return;
    if (!allowed) router.replace("/terminal");
  }, [currentUser, allowed, router]);

  if (currentUser === undefined || !allowed) {
    return <FullScreenLoader />;
  }

  return (
    <DataProvider>
      <AdminShell user={currentUser}>{children}</AdminShell>
    </DataProvider>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
