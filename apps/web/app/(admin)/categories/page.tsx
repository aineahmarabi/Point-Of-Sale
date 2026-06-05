"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { categoryStatus } from "@repo/backend/validators";
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
import { CategoryForm, CategoryDelete } from "./form";

type FormSheetMode = "view" | "add" | "update";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Categories() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<FormSheetMode>("view");
  const [selected, setSelected] = useState<Doc<"categories"> | undefined>();
  const cursorsRef = useRef<Map<string, string>>(new Map());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Doc<"categories"> | undefined>();

  const handleView = useCallback((row: Doc<"categories">) => {
    setSelected(row);
    setSheetMode("view");
    setSheetOpen(true);
  }, []);

  const handleNew = useCallback(() => {
    setSelected(undefined);
    setSheetMode("add");
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback((row: Doc<"categories">) => {
    setSelected(row);
    setSheetMode("update");
    setSheetOpen(true);
  }, []);

  const handleDelete = useCallback((row: Doc<"categories">) => {
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
  const status = columnFilters.find((f) => f.id === "status")?.value as
    | (typeof categoryStatus)[number]
    | undefined;

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.catalog.categories.list, {
    paginationOpts: { numItems: pageSize, cursor },
    ...(activeSearch ? { search: activeSearch } : {}),
    ...(status ? { status } : {}),
  });
  const totalCount = useQuery(
    api.catalog.categories.count,
    showCount
      ? {
          ...(activeSearch ? { search: activeSearch } : {}),
          ...(status ? { status } : {}),
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
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-4 px-8 py-4">
        <Input
          placeholder="Search by name..."
          value={search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {categoryStatus.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PermissionGuard permission="categories:create">
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
        hiddenOnMobile={["status", "display_order"]}
      />
      <CategoryForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        category={selected}
      />
      <CategoryDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        category={toDelete}
      />
    </main>
  );
}
