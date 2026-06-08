"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { orderStatus, orderPaymentMethods } from "@repo/backend/validators";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { getColumns } from "./columns";
import { DataTable } from "@/components/admin/module/data-table";
import { OrderView } from "./form";
import { formatCurrency } from "@/lib/format";

type OrderRow = Doc<"orders"> & { cashier_name?: string | null; customer_name?: string | null };

function exportCSV(rows: OrderRow[], currency: string) {
  const headers = ["Order #", "Cashier", "Customer", "Subtotal", "Discount", "Tax", "Total", "Payment", "Reference", "Status", "Completed At"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((o) =>
      [
        o.order_number,
        o.cashier_name ?? "",
        o.customer_name ?? "Walk-in",
        formatCurrency(o.subtotal, currency),
        formatCurrency(o.discount_total, currency),
        formatCurrency(o.tax_total, currency),
        formatCurrency(o.grand_total, currency),
        o.payment_method,
        o.payment_reference ?? "",
        o.status,
        o.completed_at ? new Date(o.completed_at).toLocaleString() : "",
      ]
        .map(String)
        .map(escape)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printOrders(rows: OrderRow[], currency: string) {
  const escape = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const rows_html = rows
    .map(
      (o) => `<tr>
        <td>${escape(o.order_number)}</td>
        <td>${escape(o.cashier_name ?? "")}</td>
        <td>${escape(o.customer_name ?? "Walk-in")}</td>
        <td>${escape(formatCurrency(o.grand_total, currency))}</td>
        <td>${escape(o.payment_method)}</td>
        <td>${escape(o.status)}</td>
        <td>${escape(o.completed_at ? new Date(o.completed_at).toLocaleString() : "")}</td>
      </tr>`,
    )
    .join("");
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Orders Export</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
      h1 { font-size: 16px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
      th { background: #f5f5f5; font-weight: bold; }
      tr:nth-child(even) { background: #fafafa; }
      @media print { @page { margin: 15mm; } }
    </style></head><body>
    <h1>Orders — exported ${new Date().toLocaleDateString()}</h1>
    <table><thead><tr>
      <th>Order #</th><th>Cashier</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Completed At</th>
    </tr></thead><tbody>${rows_html}</tbody></table>
    <script>window.onload=function(){window.print();}<\/script>
    </body></html>`);
  win.document.close();
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Orders() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Doc<"orders"> | undefined>();
  const cursorsRef = useRef<Map<string, string>>(new Map());
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const handleView = useCallback((row: Doc<"orders">) => {
    setSelected(row);
    setSheetOpen(true);
  }, []);

  const columns = useMemo(
    () => getColumns({ onView: handleView }),
    [handleView],
  );

  const status = columnFilters.find((f) => f.id === "status")?.value as
    | (typeof orderStatus)[number]
    | undefined;
  const paymentMethod = columnFilters.find((f) => f.id === "payment_method")
    ?.value as (typeof orderPaymentMethods)[number] | undefined;

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.pos.orders.list, {
    paginationOpts: { numItems: pageSize, cursor },
    ...(status ? { status } : {}),
    ...(paymentMethod ? { payment_method: paymentMethod } : {}),
  });
  const totalCount = useQuery(
    api.pos.orders.count,
    showCount
      ? {
          ...(status ? { status } : {}),
          ...(paymentMethod ? { payment_method: paymentMethod } : {}),
        }
      : "skip",
  );

  if (result?.continueCursor) {
    cursorsRef.current.set(`${pageSize}-${page + 1}`, result.continueCursor);
  }

  const totalPages =
    totalCount != null
      ? Math.max(1, Math.ceil(totalCount / pageSize))
      : undefined;

  const resetPagination = useCallback(() => {
    setPage(1);
    cursorsRef.current.clear();
    setShowCount(false);
  }, []);

  const handleStatusChange = useCallback(
    (value: string) => {
      setColumnFilters((prev) => {
        const next = prev.filter((f) => f.id !== "status");
        if (value && value !== "all") next.push({ id: "status", value });
        return next;
      });
      resetPagination();
    },
    [resetPagination],
  );

  const handlePaymentMethodChange = useCallback(
    (value: string) => {
      setColumnFilters((prev) => {
        const next = prev.filter((f) => f.id !== "payment_method");
        if (value && value !== "all")
          next.push({ id: "payment_method", value });
        return next;
      });
      resetPagination();
    },
    [resetPagination],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage < 1 || (totalPages != null && newPage > totalPages)) return;
      setPage(newPage);
      setShowCount(false);
    },
    [totalPages],
  );

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    cursorsRef.current.clear();
    setShowCount(false);
  }, []);

  return (
    <main className="p-6 w-full">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Select value={status ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {orderStatus.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={paymentMethod ?? "all"}
          onValueChange={handlePaymentMethodChange}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            {orderPaymentMethods.map((m) => (
              <SelectItem key={m} value={m}>
                <span className="capitalize">{m.replace("_", " ")}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!result?.page?.length}
            onClick={() => exportCSV(result?.page ?? [], currency)}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!result?.page?.length}
            onClick={() => printOrders(result?.page ?? [], currency)}
          >
            Print / PDF
          </Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={result?.page ?? []}
        page={page}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
        totalPages={totalPages}
        totalCount={totalCount ?? null}
        isDone={result?.isDone ?? false}
        isLoading={result === undefined}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRequestCount={() => setShowCount(true)}
        columnFilters={columnFilters}
        hiddenOnMobile={["cashier_name", "customer_name", "payment_method", "completed_at"]}
      />
      <OrderView
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        order={selected}
      />
    </main>
  );
}
