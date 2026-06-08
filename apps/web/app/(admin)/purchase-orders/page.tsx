"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { purchaseOrderStatus } from "@repo/backend/validators";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";

import { getColumns } from "./columns";
import { DataTable } from "@/components/admin/module/data-table";
import { PermissionGuard } from "@/components/admin/module/permission-guard";
import { PurchaseOrderForm, PurchaseOrderDelete } from "./form";

type FormSheetMode = "view" | "add" | "update";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function PurchaseOrders() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<FormSheetMode>("view");
  const [selected, setSelected] = useState<
    Doc<"purchase_orders"> | undefined
  >();
  const cursorsRef = useRef<Map<string, string>>(new Map());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<
    Doc<"purchase_orders"> | undefined
  >();

  const handleView = useCallback((row: Doc<"purchase_orders">) => {
    setSelected(row);
    setSheetMode("view");
    setSheetOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelected(undefined);
    setSheetMode("add");
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback((row: Doc<"purchase_orders">) => {
    setSelected(row);
    setSheetMode("update");
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((row: Doc<"purchase_orders">) => {
    setToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
      }),
    [handleView, handleEdit, handleDelete],
  );

  const status = columnFilters.find((f) => f.id === "status")?.value as
    | (typeof purchaseOrderStatus)[number]
    | undefined;

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.purchasing.purchaseOrders.list, {
    paginationOpts: { numItems: pageSize, cursor },
    ...(status ? { status } : {}),
  });
  const totalCount = useQuery(
    api.purchasing.purchaseOrders.count,
    showCount ? { ...(status ? { status } : {}) } : "skip",
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
            {purchaseOrderStatus.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PermissionGuard permission="purchase_orders:create">
          <div className="ml-auto">
            <Button onClick={handleNew}>New</Button>
          </div>
        </PermissionGuard>
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
        hiddenOnMobile={["order_date", "total_amount"]}
      />
      <PurchaseOrderForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        purchaseOrder={selected}
      />
      <PurchaseOrderDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        purchaseOrder={toDelete}
      />
    </main>
  );
}
