"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { Button } from "@repo/ui/components/ui/button";

import { getColumns } from "./columns";
import { DataTable } from "@/components/admin/module/data-table";
import { PermissionGuard } from "@/components/admin/module/permission-guard";
import { AdjustmentForm } from "./form";

type FormSheetMode = "view" | "add" | "update";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function InventoryAdjustments() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<FormSheetMode>("view");
  const [selected, setSelected] = useState<
    Doc<"inventory_adjustments"> | undefined
  >();
  const cursorsRef = useRef<Map<string, string>>(new Map());

  const handleView = useCallback((row: Doc<"inventory_adjustments">) => {
    setSelected(row);
    setSheetMode("view");
    setSheetOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelected(undefined);
    setSheetMode("add");
    setSheetOpen(true);
  }, []);

  const columns = useMemo(
    () => getColumns({ onView: handleView }),
    [handleView],
  );

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.catalog.inventoryAdjustments.list, {
    paginationOpts: { numItems: pageSize, cursor },
  });
  const totalCount = useQuery(
    api.catalog.inventoryAdjustments.count,
    showCount ? {} : "skip",
  );

  if (result?.continueCursor) {
    cursorsRef.current.set(`${pageSize}-${page + 1}`, result.continueCursor);
  }

  const totalPages =
    totalCount != null
      ? Math.max(1, Math.ceil(totalCount / pageSize))
      : undefined;

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
    <main className="flex flex-1 flex-col overflow-hidden pb-20">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <PermissionGuard permission="inventory:adjust">
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
        hiddenOnMobile={["notes", "adjusted_by_name", "adjusted_at"]}
      />
      <AdjustmentForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        adjustment={selected}
      />
    </main>
  );
}
