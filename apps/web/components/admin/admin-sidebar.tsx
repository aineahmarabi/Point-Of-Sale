"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useClerk } from "@clerk/nextjs";
import { api } from "@repo/backend";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  DashboardCircleIcon,
  Package01Icon,
  GroupItemsIcon,
  UngroupItemsIcon,
  UserEdit01Icon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";

import { cashierName } from "@/lib/format";

type NavLink = { label: string; href: string; icon: IconSvgElement };
type NavGroup = { title: string; links: NavLink[] };

const NAV: NavGroup[] = [
  {
    title: "Overview",
    links: [
      { label: "Dashboard", href: "/dashboard", icon: DashboardCircleIcon },
    ],
  },
  {
    title: "Catalog",
    links: [
      { label: "Products", href: "/products", icon: Package01Icon },
      { label: "Categories", href: "/categories", icon: GroupItemsIcon },
      { label: "Inventory", href: "/inventory", icon: UngroupItemsIcon },
      {
        label: "Inventory Adjustments",
        href: "/inventory-adjustments",
        icon: UngroupItemsIcon,
      },
    ],
  },
  {
    title: "Purchasing",
    links: [
      { label: "Suppliers", href: "/suppliers", icon: GroupItemsIcon },
      {
        label: "Purchase Orders",
        href: "/purchase-orders",
        icon: Package01Icon,
      },
    ],
  },
  {
    title: "CRM",
    links: [{ label: "Customers", href: "/customers", icon: UserEdit01Icon }],
  },
  {
    title: "Promotions",
    links: [{ label: "Discounts", href: "/discounts", icon: GroupItemsIcon }],
  },
  {
    title: "Reports",
    links: [
      { label: "Orders", href: "/orders", icon: Package01Icon },
      { label: "Sessions", href: "/sessions", icon: DashboardCircleIcon },
    ],
  },
  {
    title: "Settings",
    links: [
      { label: "Tax Rates", href: "/tax-rates", icon: Setting07Icon },
      { label: "Store Settings", href: "/store-settings", icon: Setting07Icon },
      { label: "Staff", href: "/staff", icon: UserEdit01Icon },
    ],
  },
];

type CurrentUser = NonNullable<
  FunctionReturnType<typeof api.user.users.currentUser>
>;

export function AdminSidebar({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: CurrentUser;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const settings = useQuery(api.settings.storeSettings.current);
  const storeName = settings?.store_name ?? "POS";
  const roleName = user.role?.name ?? "Staff";

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-lg font-bold tracking-tight text-burgundy-400">
            {storeName}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-lg leading-none text-slate-400 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-2">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {group.title}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.links.map((link) => {
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition",
                        active
                          ? "bg-slate-700 font-medium text-white"
                          : "text-slate-300 hover:bg-slate-800",
                      )}
                    >
                      <HugeiconsIcon icon={link.icon} size={16} />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 px-3 py-3">
          <div className="px-2">
            <p className="truncate text-sm font-medium text-white">
              {cashierName(user)}
            </p>
            <span className="mt-1 inline-block rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {roleName}
            </span>
          </div>
          <Button
            variant="outline"
            className="mt-3 h-9 w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800 hover:text-white"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
