"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useClerk } from "@clerk/nextjs";
import { api } from "@repo/backend";
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";

import { cashierName } from "@/lib/format";
import { isAdminRole } from "@/lib/auth";

/** Terminal top bar — clock, cashier identity, and exit action. */
export function TerminalHeader() {
  const { currentUser } = useData();
  const { signOut } = useClerk();
  const settings = useQuery(api.settings.storeSettings.current);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const storeName = settings?.store_name ?? "POS Terminal";
  const fullName = cashierName(currentUser);

  // Use the shared role helper — reads live role.name/permissions only.
  // Never reads the stale is_admin boolean on the user record.
  const isAdmin = isAdminRole(currentUser?.role);
  const roleLabel = isAdmin ? "Admin" : "Cashier";

  const storeInitial = storeName.charAt(0).toUpperCase();
  const cashierInitials = initials(fullName);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 px-6 text-slate-100 shadow-lg shadow-black/20">
      {/* Left — store identity */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-burgundy-600 text-base font-bold text-white shadow-sm">
          {storeInitial}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-base font-bold tracking-tight text-white">
            {storeName}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-burgundy-400">
            Point of Sale
          </p>
        </div>
      </div>

      {/* Center — live clock + date */}
      <div className="hidden flex-col items-center leading-none sm:flex">
        <span className="font-mono text-2xl font-semibold tabular-nums text-slate-100">
          {now ? now.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {now
            ? now.toLocaleDateString([], {
                weekday: "short",
                day: "numeric",
                month: "short",
              })
            : ""}
        </span>
      </div>

      {/* Right — cashier identity + exit action */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-100 ring-2 ring-slate-600">
          {cashierInitials}
        </div>
        <div className="hidden text-right leading-tight md:block">
          <p className="max-w-[160px] truncate text-sm font-semibold text-white">
            {fullName}
          </p>
          <span
            className={
              isAdmin
                ? "text-[11px] font-semibold uppercase tracking-wider text-burgundy-400"
                : "text-[11px] font-semibold uppercase tracking-wider text-emerald-400"
            }
          >
            {roleLabel}
          </span>
        </div>

        {/* Exit: admins go to dashboard, cashiers sign out */}
        {isAdmin ? (
          <Button
            asChild
            variant="outline"
            className="h-9 border-burgundy-500/60 bg-transparent px-3 text-xs text-burgundy-300 hover:bg-burgundy-500/10 hover:text-burgundy-200"
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-9 border-slate-600 bg-transparent px-3 text-xs text-slate-400 hover:bg-slate-700 hover:text-white"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            Sign out
          </Button>
        )}
      </div>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}
