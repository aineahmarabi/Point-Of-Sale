"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@repo/backend";
import { DataProvider } from "@repo/auth/providers";

import { isAdminRole } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { PageHeader } from "@/components/admin/page-header";

/** Route segment → human page title for the shared header. */
const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  products: "Products",
  categories: "Categories",
  inventory: "Inventory",
  "inventory-adjustments": "Inventory Adjustments",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  customers: "Customers",
  discounts: "Discounts",
  orders: "Orders",
  sessions: "Sessions",
  "tax-rates": "Tax Rates",
  "store-settings": "Store Settings",
  staff: "Staff",
};

function titleForPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return PAGE_TITLES[segment] ?? "Admin";
}

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
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden overflow-x-hidden bg-white">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
        <PageHeader
          title={titleForPath(pathname)}
          leading={
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="text-xl leading-none text-slate-700 md:hidden"
            >
              ☰
            </button>
          }
        />

        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
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
