"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { discountTypes } from "@repo/backend/validators";
import { Input } from "@repo/ui/components/ui/input";
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
import { DiscountForm, DiscountDelete } from "./form";

type FormSheetMode = "view" | "add" | "update";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Discounts() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<FormSheetMode>("view");
  const [selected, setSelected] = useState<Doc<"discounts"> | undefined>();
  const cursorsRef = useRef<Map<string, string>>(new Map());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Doc<"discounts"> | undefined>();

  const handleView = useCallback((row: Doc<"discounts">) => {
    setSelected(row);
    setSheetMode("view");
    setSheetOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelected(undefined);
    setSheetMode("add");
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback((row: Doc<"discounts">) => {
    setSelected(row);
    setSheetMode("update");
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((row: Doc<"discounts">) => {
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

  const search =
    (columnFilters.find((f) => f.id === "name")?.value as string) || undefined;
  const activeSearch = search && search.length >= 3 ? search : undefined;
  const type = columnFilters.find((f) => f.id === "type")?.value as
    | (typeof discountTypes)[number]
    | undefined;

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.promotions.discounts.list, {
    paginationOpts: { numItems: pageSize, cursor },
    ...(activeSearch ? { search: activeSearch } : {}),
    ...(type ? { type } : {}),
  });
  const totalCount = useQuery(
    api.promotions.discounts.count,
    showCount
      ? {
          ...(activeSearch ? { search: activeSearch } : {}),
          ...(type ? { type } : {}),
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

  const handleSearchChange = useCallback(
    (value: string) => {
      setColumnFilters((prev) => {
        const next = prev.filter((f) => f.id !== "name");
        if (value) next.push({ id: "name", value });
        return next;
      });
      resetPagination();
    },
    [resetPagination],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setColumnFilters((prev) => {
        const next = prev.filter((f) => f.id !== "type");
        if (value && value !== "all") next.push({ id: "type", value });
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
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Input
          placeholder="Search by name..."
          value={search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-xs sm:max-w-sm"
        />
        <Select value={type ?? "all"} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {discountTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PermissionGuard permission="discounts:create">
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
        hiddenOnMobile={["code", "value", "usage"]}
      />
      <DiscountForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        discount={selected}
      />
      <DiscountDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        discount={toDelete}
      />
    </main>
  );
}
