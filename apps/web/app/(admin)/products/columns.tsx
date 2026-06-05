"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Product = Doc<"products"> & { category_name?: string | null };

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  draft: "bg-yellow-100 text-yellow-800",
  archived: "bg-gray-100 text-gray-800",
};

interface ActionCallbacks {
  onView: (row: Product) => void;
  onEdit: (row: Product) => void;
  onDelete: (row: Product) => void;
  onManageVariants: (row: Product) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => row.getValue<string | undefined>("sku") ?? "—",
    },
    {
      accessorKey: "selling_price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.getValue<number>("selling_price");
        return price?.toFixed(2) ?? "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusStyles[status] ?? ""}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) =>
        row.getValue<string | null>("category_name") ?? "—",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => actions.onManageVariants(row.original)}
            className="text-burgundy-600 rounded-md px-2 py-1 text-xs font-medium hover:underline"
          >
            Variants
          </button>
          <ActionsCell
            row={row.original}
            module="products"
            onView={actions.onView}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
          />
        </div>
      ),
    },
  ];
}
