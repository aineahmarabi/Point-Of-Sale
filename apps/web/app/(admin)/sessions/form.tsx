"use client";

import type { Doc } from "@repo/backend/dataModel";

import { FormSheet } from "@/components/admin/module/form-sheet";

type Session = Doc<"sessions"> & { cashier_name?: string | null };

function money(value?: number): string {
  return value != null ? value.toFixed(2) : "—";
}

function dateTime(ts?: number): string {
  return ts ? new Date(ts).toLocaleString() : "—";
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b py-2 last:border-0">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

interface SessionViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: Session;
}

export function SessionView({
  open,
  onOpenChange,
  session,
}: SessionViewProps) {
  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      mode="view"
      title="Session Details"
      description="Cashier shift summary."
      isSubmitting={false}
      onSubmit={(e) => e.preventDefault()}
    >
      {session && (
        <dl className="flex flex-col">
          <Row label="Cashier" value={session.cashier_name ?? "—"} />
          <Row label="Status" value={<span className="capitalize">{session.status}</span>} />
          <Row label="Opened At" value={dateTime(session.opened_at)} />
          <Row label="Closed At" value={dateTime(session.closed_at)} />
          <Row label="Opening Cash" value={money(session.opening_cash)} />
          <Row label="Closing Cash" value={money(session.closing_cash)} />
          <Row label="Expected Cash" value={money(session.expected_cash)} />
          <Row label="Cash Variance" value={money(session.cash_variance)} />
          <Row label="Total Sales" value={money(session.total_sales)} />
          <Row label="Total Refunds" value={money(session.total_refunds)} />
          <Row label="Total Discounts" value={money(session.total_discounts)} />
          <Row label="Total Tax" value={money(session.total_tax)} />
          <Row label="Cash Sales" value={money(session.cash_sales)} />
          <Row label="Other Sales" value={money(session.other_sales)} />
          <Row label="Transactions" value={session.transaction_count} />
          <Row label="Notes" value={session.notes ?? "—"} />
        </dl>
      )}
    </FormSheet>
  );
}
