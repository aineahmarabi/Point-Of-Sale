"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { productStatus } from "@repo/backend/validators";
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
import { ProductDelete } from "./form";
import { ProductImportModal } from "./import";
import { VariantsManager } from "@/components/admin/variants-manager";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export default function Products() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showCount, setShowCount] = useState(false);
  const cursorsRef = useRef<Map<string, string>>(new Map());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Doc<"products"> | undefined>();

  const [importOpen, setImportOpen] = useState(false);

  const [variantsOpen, setVariantsOpen] = useState(false);
  const [variantsProduct, setVariantsProduct] =
    useState<Doc<"products"> | undefined>();

  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const handleView = useCallback(
    (row: Doc<"products">) => router.push(`/products/${row._id}/edit`),
    [router],
  );

  const handleNew = useCallback(
    () => router.push("/products/new"),
    [router],
  );

  const handleEdit = useCallback(
    (row: Doc<"products">) => router.push(`/products/${row._id}/edit`),
    [router],
  );

  const handleDelete = useCallback((row: Doc<"products">) => {
    setToDelete(row);
    setDeleteDialogOpen(true);
  }, []);

  const handleManageVariants = useCallback((row: Doc<"products">) => {
    setVariantsProduct(row);
    setVariantsOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onManageVariants: handleManageVariants,
      }),
    [handleView, handleEdit, handleDelete, handleManageVariants],
  );

  const search =
    (columnFilters.find((f) => f.id === "name")?.value as string) || undefined;
  const activeSearch = search && search.length >= 3 ? search : undefined;
  const status = columnFilters.find((f) => f.id === "status")?.value as
    | (typeof productStatus)[number]
    | undefined;

  const cursorKey = `${pageSize}-${page}`;
  const cursor =
    page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

  const result = useQuery(api.catalog.products.list, {
    paginationOpts: { numItems: pageSize, cursor },
    ...(activeSearch ? { search: activeSearch } : {}),
    ...(status ? { status } : {}),
  });
  const totalCount = useQuery(
    api.catalog.products.count,
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
    <main className="p-6 w-full">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <Input
          placeholder="Search by name..."
          value={search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-xs sm:max-w-sm"
        />
        <Select value={status ?? "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {productStatus.map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <PermissionGuard permission="products:create">
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import
            </Button>
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
        hiddenOnMobile={["sku", "status", "category_name"]}
      />
      <ProductDelete
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={toDelete}
      />
      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
      <VariantsManager
        open={variantsOpen}
        onClose={() => setVariantsOpen(false)}
        product={variantsProduct}
        currency={currency}
      />
    </main>
  );
}
