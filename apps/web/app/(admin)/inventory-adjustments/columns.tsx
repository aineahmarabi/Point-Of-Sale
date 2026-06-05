"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Adjustment = Doc<"inventory_adjustments"> & {
  product_name?: string | null;
  adjusted_by_name?: string | null;
};

const reasonStyles: Record<string, string> = {
  received: "bg-green-100 text-green-800",
  damaged: "bg-red-100 text-red-800",
  theft: "bg-red-100 text-red-800",
  correction: "bg-blue-100 text-blue-800",
  return: "bg-yellow-100 text-yellow-800",
};

interface ActionCallbacks {
  onView: (row: Adjustment) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Adjustment>[] {
  return [
    {
      accessorKey: "product_name",
      header: "Product",
      cell: ({ row }) => row.getValue<string | null>("product_name") ?? "—",
    },
    {
      accessorKey: "quantity_change",
      header: "Change",
      cell: ({ row }) => {
        const change = row.getValue<number>("quantity_change");
        const positive = change >= 0;
        return (
          <span
            className={positive ? "text-green-600" : "text-red-600"}
          >
            {positive ? `+${change}` : change}
          </span>
        );
      },
    },
    {
      accessorKey: "reason",
      header: "Reason",
      cell: ({ row }) => {
        const reason = row.getValue<string>("reason");
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${reasonStyles[reason] ?? ""}`}
          >
            {reason}
          </span>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.getValue<string | undefined>("notes") ?? "—",
    },
    {
      accessorKey: "adjusted_by_name",
      header: "Adjusted By",
      cell: ({ row }) =>
        row.getValue<string | null>("adjusted_by_name") ?? "—",
    },
    {
      accessorKey: "adjusted_at",
      header: "Date",
      cell: ({ row }) => {
        const ts = row.getValue<number>("adjusted_at");
        return ts ? new Date(ts).toLocaleDateString() : "—";
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
        />
      ),
    },
  ];
}
