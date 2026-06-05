"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";

import { money } from "@/lib/format";

const statusStyles: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  voided: "bg-gray-100 text-gray-800",
  refunded: "bg-red-100 text-red-800",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${accent ?? ""}`}>
        {value}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const ordersResult = useQuery(api.pos.orders.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });
  const inventoryResult = useQuery(api.catalog.inventory.list, {
    paginationOpts: { numItems: 200, cursor: null },
  });
  const openSessions = useQuery(api.pos.sessions.count, { status: "open" });

  const orders = useMemo(() => ordersResult?.page ?? [], [ordersResult]);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const completedToday = orders.filter(
    (o) =>
      o.status === "completed" &&
      (o.completed_at ?? o._creationTime) >= startOfToday,
  );
  const totalSalesToday = completedToday.reduce(
    (s, o) => s + o.grand_total,
    0,
  );
  const lowStockCount = (inventoryResult?.page ?? []).filter(
    (i) => i.quantity <= i.reorder_point,
  ).length;

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort(
          (a, b) =>
            (b.completed_at ?? b._creationTime) -
            (a.completed_at ?? a._creationTime),
        )
        .slice(0, 10),
    [orders],
  );

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Today&apos;s activity at a glance.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sales Today"
          value={money(totalSalesToday, currency)}
          accent="text-emerald-600"
        />
        <StatCard
          label="Total Orders Today"
          value={String(completedToday.length)}
        />
        <StatCard
          label="Low Stock Items"
          value={String(lowStockCount)}
          accent={lowStockCount > 0 ? "text-amber-600" : undefined}
        />
        <StatCard
          label="Open Sessions"
          value={String(openSessions ?? 0)}
        />
      </div>

      <div className="mt-8 rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b text-left">
                <th className="px-5 py-3 font-medium">Order #</th>
                <th className="px-5 py-3 font-medium">Cashier</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {ordersResult === undefined ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-5 py-6 text-center"
                  >
                    Loading…
                  </td>
                </tr>
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-muted-foreground px-5 py-6 text-center"
                  >
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o._id} className="border-b last:border-0">
                    <td className="px-5 py-3 font-mono text-xs">
                      {o.order_number}
                    </td>
                    <td className="px-5 py-3">{o.cashier_name ?? "—"}</td>
                    <td className="px-5 py-3">
                      {o.customer_name ?? "Walk-in"}
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      {money(o.grand_total, currency)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusStyles[o.status] ?? ""}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-5 py-3">
                      {new Date(
                        o.completed_at ?? o._creationTime,
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
