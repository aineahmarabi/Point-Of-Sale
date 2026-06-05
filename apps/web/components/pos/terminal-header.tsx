"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";

import { CloseSessionModal } from "./close-session-modal";
import { cashierName } from "@/lib/format";

export function TerminalHeader({ session }: { session: Doc<"sessions"> }) {
  const { currentUser } = useData();
  const settings = useQuery(api.settings.storeSettings.current);
  const [now, setNow] = useState<Date | null>(null);
  const [closeOpen, setCloseOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const storeName = settings?.store_name ?? "POS Terminal";
  const roleName = currentUser?.role?.name;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-slate-900 px-6 text-slate-100">
      {/* Left — store name */}
      <div className="text-lg font-bold tracking-tight text-emerald-400">
        {storeName}
      </div>

      {/* Center — live clock */}
      <div className="font-mono text-xl tabular-nums text-slate-200">
        {now ? now.toLocaleTimeString([], { hour12: false }) : "--:--:--"}
      </div>

      {/* Right — cashier + role + end shift */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {cashierName(currentUser)}
          </span>
          {roleName && (
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
              {roleName}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          className="h-9 border-red-500/60 bg-transparent text-red-400 hover:bg-red-500/10 hover:text-red-300"
          onClick={() => setCloseOpen(true)}
        >
          End Shift
        </Button>
      </div>

      <CloseSessionModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        session={session}
      />
    </header>
  );
}
