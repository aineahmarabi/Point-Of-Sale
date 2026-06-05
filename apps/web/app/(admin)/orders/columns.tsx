"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Order = Doc<"orders"> & {
  cashier_name?: string | null;
  customer_name?: string | null;
};

const statusStyles: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  voided: "bg-gray-100 text-gray-800",
  refunded: "bg-red-100 text-red-800",
};

interface ActionCallbacks {
  onView: (row: Order) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Order>[] {
  return [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.getValue<string>("order_number")}
        </span>
      ),
    },
    {
      accessorKey: "cashier_name",
      header: "Cashier",
      cell: ({ row }) => row.getValue<string | null>("cashier_name") ?? "—",
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => row.getValue<string | null>("customer_name") ?? "Walk-in",
    },
    {
      accessorKey: "grand_total",
      header: "Total",
      cell: ({ row }) => row.getValue<number>("grand_total")?.toFixed(2) ?? "—",
    },
    {
      accessorKey: "payment_method",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-xs capitalize">
          {row.getValue<string>("payment_method").replace("_", " ")}
        </span>
      ),
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
      accessorKey: "completed_at",
      header: "Completed",
      cell: ({ row }) => {
        const ts = row.getValue<number | undefined>("completed_at");
        return ts ? new Date(ts).toLocaleString() : "—";
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="orders"
          onView={actions.onView}
        />
      ),
    },
  ];
}
