"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useClerk } from "@clerk/nextjs";
import { api } from "@repo/backend";
import { useData } from "@repo/auth/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { cashierFirstName } from "@/lib/format";
import { isAdminRole } from "@/lib/auth";

function greeting(d: Date | null): string {
  if (!d) return "Welcome";
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function OpenSessionScreen() {
  const router = useRouter();
  const { currentUser } = useData();
  const { signOut } = useClerk();
  const settings = useQuery(api.settings.storeSettings.current);
  const createSession = useMutation(api.pos.sessions.create);

  const [openingCash, setOpeningCash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currency = settings?.currency ?? "KES";
  const storeName = settings?.store_name ?? "POS Terminal";
  const firstName = cashierFirstName(currentUser);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSession({
        cashier_id: currentUser._id,
        status: "open",
        opening_cash: openingCash === "" ? 0 : Number(openingCash),
        opened_at: Date.now(),
        total_sales: 0,
        total_refunds: 0,
        total_discounts: 0,
        total_tax: 0,
        cash_sales: 0,
        other_sales: 0,
        transaction_count: 0,
      });
      router.replace("/terminal");
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? (err.data as string)
          : "Could not open shift. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <button
        type="button"
        onClick={() => void signOut({ redirectUrl: "/sign-in" })}
        className="absolute left-4 top-4 flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Sign out
      </button>

      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 text-slate-100 shadow-2xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-burgundy-400">
            {storeName}
          </p>
          <h1 className="mt-3 text-2xl font-bold">
            {greeting(now)}, {firstName}
          </h1>
          <p className="mt-1 font-mono text-sm tabular-nums text-slate-400">
            {now ? now.toLocaleString([], { hour12: false }) : " "}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="opening-cash" className="text-slate-300">
              Opening Cash Float
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-slate-400">
                {currency}
              </span>
              <Input
                id="opening-cash"
                type="number"
                inputMode="decimal"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="h-14 border-slate-600 bg-slate-900 pl-16 text-center text-2xl font-bold text-white placeholder:text-slate-600 focus-visible:ring-burgundy-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button
            type="submit"
            className="h-14 w-full bg-burgundy-500 text-base font-bold text-white hover:bg-burgundy-600"
            disabled={submitting || !currentUser}
          >
            {submitting ? "Opening…" : "Start Shift"}
          </Button>
        </form>

        {isAdminRole(currentUser?.role) && (
          <div className="mt-6 border-t border-slate-700 pt-4 text-center text-xs text-slate-500">
            <span>Are you an admin? </span>
            <Link
              href="/dashboard"
              className="font-medium text-burgundy-400 hover:underline"
            >
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
