"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { Modal } from "./modal";
import { money } from "@/lib/format";

interface CloseSessionModalProps {
  open: boolean;
  onClose: () => void;
  session: Doc<"sessions">;
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span
        className={cn(
          "tabular-nums text-slate-100",
          bold ? "font-bold text-white" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function CloseSessionModal({
  open,
  onClose,
  session,
}: CloseSessionModalProps) {
  const router = useRouter();
  const closeSession = useMutation(api.pos.sessions.close);
  const settings = useQuery(api.settings.storeSettings.current);
  const ordersResult = useQuery(
    api.pos.orders.list,
    open
      ? {
          paginationOpts: { numItems: 500, cursor: null },
          session_id: session._id,
        }
      : "skip",
  );

  const [actual, setActual] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = settings?.currency ?? "KES";
  const completed = (ordersResult?.page ?? []).filter(
    (o) => o.status === "completed",
  );
  const totalSales = completed.reduce((s, o) => s + o.grand_total, 0);
  const cashSales = completed
    .filter((o) => o.payment_method === "cash")
    .reduce((s, o) => s + o.grand_total, 0);
  const expected = session.opening_cash + cashSales;
  const actualNum = actual === "" ? 0 : Number(actual);
  const variance = actualNum - expected;

  async function handleClose() {
    setSubmitting(true);
    setError(null);
    try {
      await closeSession({ id: session._id, closing_cash: actualNum });
      onClose();
      router.replace("/open-session");
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? (err.data as string)
          : "Could not close the shift. Please try again.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={!submitting}
      className="bg-slate-800 text-slate-100 sm:border sm:border-slate-700"
    >
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-bold text-white">End Shift</h2>

        <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm">
          <SummaryRow label="Total sales" value={money(totalSales, currency)} />
          <SummaryRow label="Transactions" value={String(completed.length)} />
          <SummaryRow
            label="Opening float"
            value={money(session.opening_cash, currency)}
          />
          <SummaryRow label="Cash collected" value={money(cashSales, currency)} />
          <div className="my-1 border-t border-slate-700" />
          <SummaryRow
            label="Expected cash"
            value={money(expected, currency)}
            bold
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual-cash" className="text-slate-300">
            Actual Cash Count
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-slate-400">
              {currency}
            </span>
            <Input
              id="actual-cash"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="h-12 border-slate-600 bg-slate-900 pl-14 text-lg font-semibold text-white placeholder:text-slate-600 focus-visible:ring-burgundy-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/60 p-3">
          <span className="text-sm font-medium text-slate-300">Variance</span>
          <span
            className={cn(
              "text-lg font-bold tabular-nums",
              variance === 0
                ? "text-green-400"
                : variance < 0
                  ? "text-red-400"
                  : "text-amber-400",
            )}
          >
            {money(variance, currency)}
          </span>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-12 flex-1 bg-burgundy-500 font-bold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
            onClick={handleClose}
            disabled={submitting || actual === ""}
          >
            {submitting ? "Closing…" : "Close Shift"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
