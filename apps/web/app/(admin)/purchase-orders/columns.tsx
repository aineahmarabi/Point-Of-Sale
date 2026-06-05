"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type PurchaseOrder = Doc<"purchase_orders"> & { supplier_name?: string | null };

const statusStyles: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

interface ActionCallbacks {
  onView: (row: PurchaseOrder) => void;
  onEdit: (row: PurchaseOrder) => void;
  onDelete: (row: PurchaseOrder) => void;
}

export function getColumns(
  actions: ActionCallbacks,
): ColumnDef<PurchaseOrder>[] {
  return [
    {
      accessorKey: "_id",
      header: "Reference",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          #{row.original._id.slice(-6).toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "supplier_name",
      header: "Supplier",
      cell: ({ row }) => row.getValue<string | null>("supplier_name") ?? "—",
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
      accessorKey: "order_date",
      header: "Order Date",
      cell: ({ row }) => {
        const ts = row.getValue<number>("order_date");
        return ts ? new Date(ts).toLocaleDateString() : "—";
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total",
      cell: ({ row }) => row.getValue<number>("total_amount")?.toFixed(2) ?? "—",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="purchase_orders"
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ),
    },
  ];
}
