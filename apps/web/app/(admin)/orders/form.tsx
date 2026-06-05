"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";

import { FormSheet } from "@/components/admin/module/form-sheet";

type Order = Doc<"orders"> & {
  cashier_name?: string | null;
  customer_name?: string | null;
};

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

interface OrderViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order;
}

export function OrderView({ open, onOpenChange, order }: OrderViewProps) {
  const items = useQuery(
    api.pos.orderItems.listByOrder,
    order ? { order_id: order._id } : "skip",
  );

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      mode="view"
      title="Order Details"
      description="Receipt summary for this order."
      isSubmitting={false}
      onSubmit={(e) => e.preventDefault()}
    >
      {order && (
        <div className="flex flex-col gap-6">
          <dl className="flex flex-col">
            <Row label="Order #" value={order.order_number} />
            <Row label="Cashier" value={order.cashier_name ?? "—"} />
            <Row label="Customer" value={order.customer_name ?? "Walk-in"} />
            <Row
              label="Status"
              value={<span className="capitalize">{order.status}</span>}
            />
            <Row
              label="Payment"
              value={
                <span className="capitalize">
                  {order.payment_method.replace("_", " ")}
                </span>
              }
            />
            <Row label="Reference" value={order.payment_reference ?? "—"} />
            <Row label="Subtotal" value={money(order.subtotal)} />
            <Row label="Discount" value={money(order.discount_total)} />
            <Row label="Tax" value={money(order.tax_total)} />
            <Row label="Grand Total" value={money(order.grand_total)} />
            <Row label="Completed" value={dateTime(order.completed_at)} />
            <Row label="Notes" value={order.notes ?? "—"} />
          </dl>

          <div>
            <p className="mb-2 text-sm font-medium">Items</p>
            <div className="divide-y rounded-md border">
              {items === undefined ? (
                <p className="text-muted-foreground p-3 text-sm">Loading…</p>
              ) : items.length === 0 ? (
                <p className="text-muted-foreground p-3 text-sm">No items.</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span>
                      {item.product_name}
                      <span className="text-muted-foreground">
                        {" "}
                        × {item.quantity}
                      </span>
                    </span>
                    <span className="font-medium">
                      {item.line_total.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </FormSheet>
  );
}
