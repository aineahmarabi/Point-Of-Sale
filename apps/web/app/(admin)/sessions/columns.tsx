"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Session = Doc<"sessions"> & { cashier_name?: string | null };

const statusStyles: Record<string, string> = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  suspended: "bg-yellow-100 text-yellow-800",
};

interface ActionCallbacks {
  onView: (row: Session) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Session>[] {
  return [
    {
      accessorKey: "cashier_name",
      header: "Cashier",
      cell: ({ row }) => row.getValue<string | null>("cashier_name") ?? "â€”",
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
      accessorKey: "opened_at",
      header: "Opened",
      cell: ({ row }) => {
        const ts = row.getValue<number>("opened_at");
        return ts ? new Date(ts).toLocaleString() : "â€”";
      },
    },
    {
      accessorKey: "closed_at",
      header: "Closed",
      cell: ({ row }) => {
        const ts = row.getValue<number | undefined>("closed_at");
        return ts ? new Date(ts).toLocaleString() : "â€”";
      },
    },
    {
      accessorKey: "total_sales",
      header: "Total Sales",
      cell: ({ row }) => row.getValue<number>("total_sales")?.toFixed(2) ?? "â€”",
    },
    {
      accessorKey: "cash_variance",
      header: "Variance",
      cell: ({ row }) => {
        const variance = row.getValue<number | undefined>("cash_variance");
        if (variance == null) return "â€”";
        return (
          <span
            className={
              variance === 0
                ? undefined
                : variance > 0
                  ? "text-green-600"
                  : "text-red-600"
            }
          >
            {variance.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "transaction_count",
      header: "Txns",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="sessions"
          onView={actions.onView}
        />
      ),
    },
  ];
}
