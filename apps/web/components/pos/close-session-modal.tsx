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
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums", bold && "font-semibold")}>
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
    <Modal open={open} onClose={onClose} dismissable={!submitting}>
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-semibold">End Shift</h2>

        <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-sm">
          <SummaryRow label="Total sales" value={money(totalSales, currency)} />
          <SummaryRow label="Transactions" value={String(completed.length)} />
          <SummaryRow
            label="Opening float"
            value={money(session.opening_cash, currency)}
          />
          <SummaryRow label="Cash collected" value={money(cashSales, currency)} />
          <SummaryRow
            label="Expected cash"
            value={money(expected, currency)}
            bold
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="actual-cash">Actual Cash Count</Label>
          <Input
            id="actual-cash"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm font-medium">Variance</span>
          <span
            className={cn(
              "text-lg font-semibold tabular-nums",
              variance === 0
                ? ""
                : variance > 0
                  ? "text-green-600"
                  : "text-red-600",
            )}
          >
            {money(variance, currency)}
          </span>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-12 flex-1"
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
