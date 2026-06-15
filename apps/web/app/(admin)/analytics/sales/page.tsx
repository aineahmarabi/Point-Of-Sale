"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { formatCurrency } from "@/lib/format";
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

function resolveRange(
  preset: Preset,
  customStart: string,
  customEnd: string,
  now: number,
): { start: number; end: number } {
  const todayStart = startOfDay(new Date(now));
  switch (preset) {
    case "today":
      return { start: todayStart, end: now };
    case "yesterday":
      return { start: todayStart - DAY, end: todayStart - 1 };
    case "7d":
      return { start: todayStart - 6 * DAY, end: now };
    case "30d":
      return { start: todayStart - 29 * DAY, end: now };
    case "month": {
      const d = new Date(now);
      return { start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), end: now };
    }
    case "custom": {
      const s = customStart ? startOfDay(new Date(customStart)) : todayStart;
      const e = customEnd ? startOfDay(new Date(customEnd)) + DAY - 1 : now;
      return { start: s, end: Math.max(e, now) };
    }
  }
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SalesReportPage() {
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const [preset, setPreset] = useState<Preset>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [preset, customStart, customEnd]);
  const range = useMemo(
    () => resolveRange(preset, customStart, customEnd, now),
    [preset, customStart, customEnd, now],
  );

  const report = useQuery(api.analytics.getSalesReport, {
    startDate: range.start,
    endDate: range.end,
  });

  const lineData = useMemo(() => {
    if (!report) return [];
    return report.salesOverTime.map((d) => ({
      total: d.total,
      label:
        report.groupBy === "hour"
          ? new Date(d.period).toLocaleTimeString([], {
              hour: "2-digit",
              hour12: false,
            })
          : new Date(d.period).toLocaleDateString([], {
              day: "numeric",
              month: "short",
            }),
    }));
  }, [report]);

  const barData = useMemo(() => {
    if (!report) return [];
    return [
      { name: "Cash", value: report.byPaymentMethod.cash },
      { name: "Paybill", value: report.byPaymentMethod.paybill },
      { name: "Split", value: report.byPaymentMethod.split },
      { name: "Other", value: report.byPaymentMethod.other },
    ].filter((d) => d.value > 0);
  }, [report]);

  function handleExport() {
    if (!report) return;
    const headers = ["Order #", "Cashier", "Items", "Total", "Payment Method", "Time"];
    const rows = report.orders.map((o) => [
      o.order_number,
      o.cashier_name,
      String(o.item_count),
      formatCurrency(o.grand_total, currency),
      o.payment_method,
      new Date(o.completed_at).toLocaleString(),
    ]);
    downloadCSV("sales-report.csv", headers, rows);
  }

  return (
    <main className="p-6 w-full">
      {/* Breadcrumb */}
      <div className="mb-5">
        <Link
          href="/dashboard"
          className="flex w-fit items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
          Sales Report
        </h1>
      </div>

      {/* Date filter */}
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

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Sales"
          value={report ? formatCurrency(report.totalSales, currency) : "—"}
          accent="text-burgundy-600"
        />
        <KpiCard
          label="Total Orders"
          value={report ? String(report.totalOrders) : "—"}
        />
        <KpiCard
          label="Avg Order Value"
          value={report ? formatCurrency(report.avgOrderValue, currency) : "—"}
        />
        <KpiCard
          label="Total Tax Collected"
          value={report ? formatCurrency(report.totalTax, currency) : "—"}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Sales Over Time" className="lg:col-span-2">
          <div className="h-[240px] w-full sm:h-[280px]">
            {lineData.length === 0 ? (
              <EmptyChart loading={report === undefined} />
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
                    formatter={(value) => formatCurrency(Number(value), currency)}
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

        <ChartCard title="Sales by Payment Method" className="lg:col-span-2">
          <div className="h-[220px] w-full sm:h-[260px]">
            {barData.length === 0 ? (
              <EmptyChart loading={report === undefined} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                  <XAxis
                    dataKey="name"
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
                    formatter={(value) =>
                      formatCurrency(Number(value), currency)
                    }
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#8e1f38"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={64}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Orders table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">All Orders</h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={!report || report.orders.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-5 py-2.5 font-medium">Order #</th>
                <th className="px-5 py-2.5 font-medium">Cashier</th>
                <th className="px-5 py-2.5 font-medium">Items</th>
                <th className="px-5 py-2.5 font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Method</th>
                <th className="px-5 py-2.5 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {report === undefined ? (
                <SkeletonRows cols={6} />
              ) : report.orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    No orders for this period.
                  </td>
                </tr>
              ) : (
                report.orders.map((o) => (
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
    </main>
  );
}

function KpiCard({
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
