"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Inventory = Doc<"inventory"> & {
  product_name?: string | null;
  variant_name?: string | null;
};

function isLowStock(item: Inventory): boolean {
  return item.quantity <= item.reorder_point;
}

interface ActionCallbacks {
  onView: (row: Inventory) => void;
  onEdit: (row: Inventory) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Inventory>[] {
  return [
    {
      accessorKey: "product_name",
      header: "Product",
      cell: ({ row }) => {
        const item = row.original;
        const name = item.product_name ?? "—";
        return item.variant_name ? `${name} · ${item.variant_name}` : name;
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <span
            className={
              isLowStock(item) ? "font-semibold text-red-600" : undefined
            }
          >
            {item.quantity}
          </span>
        );
      },
    },
    {
      accessorKey: "reorder_point",
      header: "Reorder Point",
    },
    {
      id: "stock_status",
      header: "Status",
      cell: ({ row }) => {
        const low = isLowStock(row.original);
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              low
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {low ? "Low stock" : "In stock"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="inventory"
          onView={actions.onView}
          onEdit={actions.onEdit}
        />
      ),
    },
  ];
}
