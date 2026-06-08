"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConvex, useQuery } from "convex/react";
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
      { label: "Analytics", href: "/analytics", icon: DashboardCircleIcon },
    ],
  },
  {
    title: "Catalog",
    links: [
      { label: "Products", href: "/products", icon: Package01Icon },
      { label: "Categories", href: "/categories", icon: GroupItemsIcon },
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
    links: [{ label: "Orders", href: "/orders", icon: Package01Icon }],
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

function isLinkActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/** The first non-Overview group that owns the current route. */
function activeGroupTitle(pathname: string): string | null {
  for (const group of NAV) {
    if (group.title === "Overview") continue;
    if (group.links.some((l) => isLinkActive(pathname, l.href))) {
      return group.title;
    }
  }
  return null;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "shrink-0 transition-transform duration-200",
        open ? "rotate-90" : "rotate-0",
      )}
      aria-hidden
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/** Polls the Convex websocket connection so we can show Live / Offline. */
function useConnectionLive(): boolean {
  const convex = useConvex();
  const [live, setLive] = useState(true);
  useEffect(() => {
    const check = () => {
      try {
        setLive(convex.connectionState().isWebSocketConnected);
      } catch {
        setLive(false);
      }
    };
    check();
    const t = setInterval(check, 2000);
    return () => clearInterval(t);
  }, [convex]);
  return live;
}

function LiveBadge({ live }: { live: boolean }) {
  return (
    <span className="mt-0.5 flex items-center gap-1.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          live ? "animate-pulse bg-green-500" : "bg-red-500",
        )}
      />
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          live ? "text-green-400" : "text-red-400",
        )}
      >
        {live ? "Live" : "Offline"}
      </span>
    </span>
  );
}

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
  const live = useConnectionLive();
  const settings = useQuery(api.settings.storeSettings.current);
  const storeName = settings?.store_name ?? "POS";
  const logoUrl = settings?.logo_url ?? null;
  const roleName = user.role?.name ?? "Staff";
  const storeInitial = storeName.charAt(0).toUpperCase();

  const overview = NAV.find((g) => g.title === "Overview");
  const collapsibleGroups = NAV.filter((g) => g.title !== "Overview");

  // Active group starts expanded; the rest collapsed. Re-expand when the
  // active route moves to a different group.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const active = activeGroupTitle(pathname);
    return active ? { [active]: true } : {};
  });

  useEffect(() => {
    const active = activeGroupTitle(pathname);
    if (active) {
      setOpenGroups((prev) =>
        prev[active] ? prev : { ...prev, [active]: true },
      );
    }
  }, [pathname]);

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

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
        <div className="flex items-start justify-between gap-2 px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-sm font-bold text-white">
                  {storeInitial}
                </div>
              )}
              <span className="truncate text-base font-bold tracking-tight text-burgundy-400">
                {storeName}
              </span>
            </div>
            <LiveBadge live={live} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="text-lg leading-none text-slate-400 hover:text-white md:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {/* Overview — always visible, not collapsible */}
          {overview?.links.map((link) => {
            const active = isLinkActive(pathname, link.href);
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

          {/* Collapsible groups */}
          {collapsibleGroups.map((group) => {
            const isOpen = !!openGroups[group.title];
            const hasActive = group.links.some((l) =>
              isLinkActive(pathname, l.href),
            );
            return (
              <div key={group.title} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition hover:bg-slate-800",
                    hasActive ? "text-burgundy-400" : "text-slate-500",
                  )}
                >
                  <span>{group.title}</span>
                  <Chevron open={isOpen} />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-200 ease-in-out",
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-1 space-y-0.5 pb-1">
                      {group.links.map((link) => {
                        const active = isLinkActive(pathname, link.href);
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
                </div>
              </div>
            );
          })}
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
