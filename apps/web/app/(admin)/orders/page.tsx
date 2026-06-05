"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { orderStatus, orderPaymentMethods } from "@repo/backend/validators";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Orders() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<Doc<"orders"> | undefined>();
  const cursorsRef = useRef<Map<string, string>>(new Map());

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
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-4 px-8 py-4">
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
