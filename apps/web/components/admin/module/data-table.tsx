"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Icon } from "@repo/ui/components/ui/icon";
import { Button } from "@repo/ui/components/ui/button";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { Setting07Icon } from "@hugeicons/core-free-icons";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalPages: number | undefined;
  totalCount: number | null;
  isDone: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRequestCount: () => void;
  columnFilters?: ColumnFiltersState;
  hiddenOnMobile?: string[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
  page,
  pageSize,
  pageSizeOptions,
  totalPages,
  totalCount,
  isDone,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onRequestCount,
  columnFilters,
  hiddenOnMobile = [],
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();

  const columnVisibility: VisibilityState = useMemo(
    () =>
      isMobile
        ? Object.fromEntries(hiddenOnMobile.map((id) => [id, false]))
        : {},
    [isMobile, hiddenOnMobile],
  );

  const hasNextPage = totalPages != null ? page < totalPages : !isDone;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    state: {
      columnFilters: columnFilters ?? [],
      columnVisibility,
    },
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto px-4 sm:px-8">
        <Table>
          <TableHeader className="bg-accent sticky top-0 z-10 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-12">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="h-15"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="h-15">
                  {table
                    .getAllColumns()
                    .filter((col) => col.getIsVisible())
                    .map((col) => (
                      <TableCell key={col.id}>
                        <Skeleton className="h-4 w-3/4" />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-60">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="bg-muted rounded-full p-3">
                      <Icon
                        icon={Setting07Icon}
                        className="text-muted-foreground size-6"
                      />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">
                      No results found
                    </p>
                    <p className="text-muted-foreground/60 text-xs">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex shrink-0 items-center justify-between px-4 sm:px-8 py-4">
        <p className="text-muted-foreground text-sm">
          Total Count:{" "}
          {totalCount != null ? (
            <span className="text-primary font-medium">{totalCount}</span>
          ) : (
            <Button
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={onRequestCount}
            >
              View
            </Button>
          )}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    <Icon icon={Setting07Icon} />
                    {size}
                    <span>per page</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(page - 1)}
                  className={
                    page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink className="cursor-default hover:bg-transparent focus:bg-transparent">
                  {totalCount != null
                    ? `${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalCount)}`
                    : `${(page - 1) * pageSize + 1} - ${(page - 1) * pageSize + data.length}`}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(page + 1)}
                  className={
                    !hasNextPage
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
