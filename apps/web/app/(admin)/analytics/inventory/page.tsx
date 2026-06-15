"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { cn } from "@repo/ui/lib/utils";

type SortDir = "asc" | "desc";

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

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ok: { label: "In Stock", cls: "bg-emerald-100 text-emerald-700" },
  low: { label: "Low Stock", cls: "bg-amber-100 text-amber-700" },
  out: { label: "Out of Stock", cls: "bg-red-100 text-red-700" },
};

export default function InventoryReportPage() {
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const report = useQuery(api.analytics.getInventoryReport, {});

  const sortedItems = useMemo(() => {
    if (!report) return [];
    return [...report.items].sort((a, b) =>
      sortDir === "asc" ? a.quantity - b.quantity : b.quantity - a.quantity,
    );
  }, [report, sortDir]);

  function toggleSort() {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  function handleExport() {
    if (!report) return;
    const headers = [
      "Product",
      "Variant",
      "Category",
      "Quantity",
      "Reorder Point",
      "Status",
    ];
    const rows = sortedItems.map((i) => [
      i.product_name,
      i.variant_name ?? "",
      i.category_name,
      String(i.quantity),
      String(i.reorder_point),
      STATUS_LABEL[i.status]?.label ?? i.status,
    ]);
    downloadCSV("inventory-report.csv", headers, rows);
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
          Inventory Report
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Products"
          value={report ? String(report.totalProducts) : "—"}
        />
        <KpiCard
          label="In Stock"
          value={report ? String(report.inStock) : "—"}
          accent="text-emerald-600"
        />
        <KpiCard
          label="Low Stock"
          value={report ? String(report.lowStock) : "—"}
          accent="text-amber-600"
        />
        <KpiCard
          label="Out of Stock"
          value={report ? String(report.outOfStock) : "—"}
          accent="text-red-600"
        />
      </div>

      {/* Stock by category chart */}
      {report && report.byCategory.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Stock Levels by Category
          </h2>
          <div className="h-[220px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.byCategory}
                margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, "Total Units"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar
                  dataKey="totalQuantity"
                  fill="#8e1f38"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory table */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">
            All Products
          </h2>
          <button
            type="button"
            onClick={handleExport}
            disabled={!report || report.items.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-5 py-2.5 font-medium">Product</th>
                <th className="px-5 py-2.5 font-medium">Category</th>
                <th className="px-5 py-2.5 font-medium">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="flex items-center gap-1 hover:text-slate-900 transition-colors"
                  >
                    Stock
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "transition-transform",
                        sortDir === "desc" ? "rotate-180" : "",
                      )}
                      aria-hidden
                    >
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                  </button>
                </th>
                <th className="px-5 py-2.5 font-medium">Reorder At</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {report === undefined ? (
                <SkeletonRows cols={6} />
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-8 text-center text-slate-400"
                  >
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => {
                  const badge = STATUS_LABEL[item.status];
                  const isLow = item.status !== "ok";
                  return (
                    <tr
                      key={item._id}
                      className={cn(
                        "border-b border-slate-50 last:border-0 hover:bg-slate-50",
                        isLow && "bg-red-50/30",
                      )}
                    >
                      <td className="px-5 py-2.5">
                        <span className="font-medium text-slate-900">
                          {item.product_name}
                        </span>
                        {item.variant_name && (
                          <span className="ml-1.5 text-slate-400">
                            — {item.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-slate-500">
                        {item.category_name}
                      </td>
                      <td className="px-5 py-2.5 tabular-nums">
                        <span
                          className={cn(
                            "font-semibold",
                            item.status === "out"
                              ? "text-red-600"
                              : item.status === "low"
                                ? "text-amber-600"
                                : "text-slate-900",
                          )}
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 tabular-nums text-slate-500">
                        {item.reorder_point}
                      </td>
                      <td className="px-5 py-2.5">
                        {badge && (
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              badge.cls,
                            )}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-2.5">
                        <Link
                          href={`/inventory?product=${item.product_id}`}
                          className="text-xs font-medium text-burgundy-600 hover:underline"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  );
                })
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

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, r) => (
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
