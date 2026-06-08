"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import { formatCurrency } from "@/lib/format";
import { cn } from "@repo/ui/lib/utils";

const DAY = 24 * 60 * 60 * 1000;

export default function DashboardPage() {
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);
  // Stable snapshot — must NOT be recomputed each render or the useQuery args
  // would change every render and trigger an infinite re-render loop.
  const now = useMemo(() => Date.now(), []);

  const stats = useQuery(api.analytics.getDashboardStats, {
    startDate: todayStart,
    endDate: now,
  });
  // Small chart: last 7 days of sales.
  const weekSales = useQuery(api.analytics.getSalesOverTime, {
    startDate: todayStart - 6 * DAY,
    endDate: now,
    groupBy: "day",
  });
  const lowStock = useQuery(api.analytics.getLowStockItems, {});
  const recentOrders = useQuery(api.analytics.getRecentOrders, { limit: 8 });
  const openSessions = useQuery(api.pos.sessions.count, { status: "open" });

  const chartData = useMemo(
    () =>
      (weekSales ?? []).map((d) => ({
        total: d.total,
        label: new Date(d.period).toLocaleDateString([], {
          day: "numeric",
          month: "short",
        }),
      })),
    [weekSales],
  );

  return (
    <main className="p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-20">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">Today&apos;s activity at a glance.</p>
        <Link
          href="/analytics"
          className="shrink-0 text-sm font-medium text-burgundy-600 hover:underline"
        >
          View analytics
        </Link>
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Sales Today"
          value={stats ? formatCurrency(stats.totalSales, currency) : "—"}
          accent="text-burgundy-600"
        />
        <StatCard
          label="Total Orders Today"
          value={stats ? String(stats.totalOrders) : "—"}
        />
        <StatCard
          label="Low Stock Items"
          value={lowStock ? String(lowStock.length) : "—"}
          accent={
            lowStock && lowStock.length > 0 ? "text-red-600" : "text-slate-900"
          }
        />
        <StatCard
          label="Active Sessions"
          value={openSessions != null ? String(openSessions) : "—"}
        />
      </div>

      {/* Small sales chart — Shopify-style overview */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Sales — last 7 days
          </h2>
          <Link
            href="/analytics"
            className="text-xs font-medium text-slate-400 hover:text-burgundy-600"
          >
            Details
          </Link>
        </div>
        <div className="mt-3 h-[180px] w-full sm:h-[220px]">
          {chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              {weekSales === undefined ? "Loading…" : "No sales yet."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
              >
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8e1f38" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#8e1f38" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                  }
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value), currency)}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#8e1f38"
                  strokeWidth={2.5}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-5 py-2.5 font-medium">Order #</th>
                <th className="px-5 py-2.5 font-medium">Cashier</th>
                <th className="px-5 py-2.5 font-medium">Items</th>
                <th className="px-5 py-2.5 font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders === undefined ? (
                Array.from({ length: 5 }).map((_, r) => (
                  <tr key={r} className="border-b border-slate-50 last:border-0">
                    {Array.from({ length: 5 }).map((_, c) => (
                      <td key={c} className="px-5 py-3">
                        <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr
                    key={o._id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs">
                      {o.order_number}
                    </td>
                    <td className="px-5 py-2.5">{o.cashier_name}</td>
                    <td className="px-5 py-2.5 tabular-nums">{o.item_count}</td>
                    <td className="px-5 py-2.5 tabular-nums">
                      {formatCurrency(o.grand_total, currency)}
                    </td>
                    <td className="px-5 py-2.5 text-slate-500">
                      {new Date(o.completed_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums sm:text-3xl",
          accent ?? "text-slate-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
