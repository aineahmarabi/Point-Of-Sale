"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import { money } from "@/lib/format";
import { cn } from "@repo/ui/lib/utils";

type Preset = "today" | "yesterday" | "7d" | "30d" | "month" | "custom";

const PRESETS: { value: Preset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

interface Range {
  start: number;
  end: number;
  groupBy: "hour" | "day";
}

function resolveRange(
  preset: Preset,
  customStart: string,
  customEnd: string,
): Range {
  const now = Date.now();
  const todayStart = startOfDay(new Date());
  switch (preset) {
    case "today":
      return { start: todayStart, end: now, groupBy: "hour" };
    case "yesterday":
      return {
        start: todayStart - DAY,
        end: todayStart - 1,
        groupBy: "hour",
      };
    case "7d":
      return { start: todayStart - 6 * DAY, end: now, groupBy: "day" };
    case "30d":
      return { start: todayStart - 29 * DAY, end: now, groupBy: "day" };
    case "month": {
      const d = new Date();
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      return { start: monthStart, end: now, groupBy: "day" };
    }
    case "custom": {
      const s = customStart ? startOfDay(new Date(customStart)) : todayStart;
      const e = customEnd
        ? startOfDay(new Date(customEnd)) + DAY - 1
        : now;
      return { start: s, end: e, groupBy: "day" };
    }
  }
}

const PIE_COLORS = ["#8e1f38", "#cf6076", "#10b981", "#94a3b8"];

function pct(current: number, prev: number): number | null {
  if (prev === 0) return current > 0 ? 100 : null;
  return ((current - prev) / prev) * 100;
}

export default function AnalyticsPage() {
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const [preset, setPreset] = useState<Preset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo(
    () => resolveRange(preset, customStart, customEnd),
    [preset, customStart, customEnd],
  );
  const prevRange = useMemo(() => {
    const span = range.end - range.start;
    return { start: range.start - span, end: range.start - 1 };
  }, [range]);

  const stats = useQuery(api.analytics.getDashboardStats, {
    startDate: range.start,
    endDate: range.end,
  });
  const prevStats = useQuery(api.analytics.getDashboardStats, {
    startDate: prevRange.start,
    endDate: prevRange.end,
  });
  const salesOverTime = useQuery(api.analytics.getSalesOverTime, {
    startDate: range.start,
    endDate: range.end,
    groupBy: range.groupBy,
  });
  const byMethod = useQuery(api.analytics.getSalesByPaymentMethod, {
    startDate: range.start,
    endDate: range.end,
  });
  const topProducts = useQuery(api.analytics.getTopProducts, {
    startDate: range.start,
    endDate: range.end,
    limit: 5,
  });
  const lowStock = useQuery(api.analytics.getLowStockItems, {});
  const recentOrders = useQuery(api.analytics.getRecentOrders, { limit: 10 });
  const openSessions = useQuery(api.pos.sessions.count, { status: "open" });

  const salesChange = stats && prevStats
    ? pct(stats.totalSales, prevStats.totalSales)
    : null;
  const ordersChange = stats && prevStats
    ? pct(stats.totalOrders, prevStats.totalOrders)
    : null;

  const lineData = useMemo(
    () =>
      (salesOverTime ?? []).map((d) => ({
        period: d.period,
        total: d.total,
        label:
          range.groupBy === "hour"
            ? new Date(d.period).toLocaleTimeString([], {
                hour: "2-digit",
                hour12: false,
              })
            : new Date(d.period).toLocaleDateString([], {
                day: "numeric",
                month: "short",
              }),
      })),
    [salesOverTime, range.groupBy],
  );

  const pieData = useMemo(() => {
    if (!byMethod) return [];
    return [
      { name: "Cash", value: byMethod.cash },
      { name: "Paybill", value: byMethod.paybill },
      { name: "Split", value: byMethod.split },
      { name: "Other", value: byMethod.other },
    ].filter((d) => d.value > 0);
  }, [byMethod]);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      {/* Date filter bar — horizontally scrollable on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPreset(p.value)}
            className={cn(
              "min-h-[40px] shrink-0 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition",
              preset === p.value
                ? "border-burgundy-600 bg-burgundy-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {p.label}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-[40px] rounded-lg border border-slate-200 px-2 text-sm"
            />
            <span className="text-slate-400">–</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-[40px] rounded-lg border border-slate-200 px-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Sales"
          value={stats ? money(stats.totalSales, currency) : "—"}
          change={salesChange}
          accent="text-burgundy-600"
        />
        <KpiCard
          label="Total Orders"
          value={stats ? String(stats.totalOrders) : "—"}
          change={ordersChange}
        />
        <KpiCard
          label="Low Stock Items"
          value={lowStock ? String(lowStock.length) : "—"}
          accent={
            lowStock && lowStock.length > 0 ? "text-red-600" : "text-slate-900"
          }
        />
        <KpiCard
          label="Active Sessions"
          value={openSessions != null ? String(openSessions) : "—"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sales over time — full width */}
        <ChartCard title="Sales Over Time" className="lg:col-span-2">
          <div className="h-[250px] w-full sm:h-[300px]">
            {lineData.length === 0 ? (
              <EmptyChart loading={salesOverTime === undefined} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={lineData}
                  margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
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
                    width={56}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value) => money(Number(value), currency)}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8e1f38"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        {/* Payment method donut */}
        <ChartCard title="Sales by Payment Method">
          <div className="h-[250px] w-full sm:h-[280px]">
            {pieData.length === 0 ? (
              <EmptyChart loading={byMethod === undefined} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => money(Number(value), currency)}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {/* Custom legend with % + amount */}
          {pieData.length > 0 && (
            <ul className="mt-2 space-y-1">
              {pieData.map((d, i) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    {d.name}
                    <span className="text-slate-400">
                      {pieTotal > 0
                        ? `${Math.round((d.value / pieTotal) * 100)}%`
                        : ""}
                    </span>
                  </span>
                  <span className="tabular-nums text-slate-600">
                    {money(d.value, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        {/* Top products horizontal bar */}
        <ChartCard title="Top Products">
          <div className="h-[250px] w-full sm:h-[280px]">
            {!topProducts || topProducts.length === 0 ? (
              <EmptyChart loading={topProducts === undefined} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#eef0f3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={96}
                  />
                  <Tooltip
                    formatter={(value) => [`${value}`, "Qty sold"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="quantity"
                    fill="#8e1f38"
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Bottom row: recent orders + low stock */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Order #</th>
                  <th className="px-5 py-2.5 font-medium">Cashier</th>
                  <th className="px-5 py-2.5 font-medium">Items</th>
                  <th className="px-5 py-2.5 font-medium">Total</th>
                  <th className="px-5 py-2.5 font-medium">Method</th>
                  <th className="px-5 py-2.5 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders === undefined ? (
                  <SkeletonRows cols={6} />
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-slate-400"
                    >
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
                      <td className="px-5 py-2.5 tabular-nums">
                        {o.item_count}
                      </td>
                      <td className="px-5 py-2.5 tabular-nums">
                        {money(o.grand_total, currency)}
                      </td>
                      <td className="px-5 py-2.5 capitalize">
                        {o.payment_method}
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

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Low Stock Alerts
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="px-5 py-2.5 font-medium">Product</th>
                  <th className="px-5 py-2.5 font-medium">In Stock</th>
                  <th className="px-5 py-2.5 font-medium">Reorder At</th>
                </tr>
              </thead>
              <tbody>
                {lowStock === undefined ? (
                  <SkeletonRows cols={3} />
                ) : lowStock.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-8 text-center text-slate-400"
                    >
                      Everything is well stocked.
                    </td>
                  </tr>
                ) : (
                  lowStock.map((i) => {
                    const critical = i.quantity <= i.reorder_point;
                    return (
                      <tr
                        key={i._id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-2.5">
                          {i.product_name}
                          {i.variant_name ? (
                            <span className="text-slate-400">
                              {" "}
                              — {i.variant_name}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={cn(
                              "tabular-nums",
                              critical
                                ? "font-semibold text-red-600"
                                : "text-slate-700",
                            )}
                          >
                            {i.quantity}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 tabular-nums text-slate-500">
                          {i.reorder_point}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  change,
  accent,
}: {
  label: string;
  value: string;
  change?: number | null;
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
      {change != null ? (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            change >= 0 ? "text-emerald-600" : "text-red-600",
          )}
        >
          {change >= 0 ? "+" : "-"}
          {Math.abs(change).toFixed(1)}% vs prev
        </p>
      ) : (
        <p className="mt-1 text-xs text-slate-400">—</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-400">
      {loading ? "Loading…" : "No data for this period."}
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, r) => (
        <tr key={r} className="border-b border-slate-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-5 py-3">
              <div className="h-3.5 w-full max-w-[120px] animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
