"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Category = Doc<"categories">;

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-800",
};

interface ActionCallbacks {
  onView: (row: Category) => void;
  onEdit: (row: Category) => void;
  onDelete: (row: Category) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Category>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
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
      accessorKey: "display_order",
      header: "Order",
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="categories"
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ),
    },
  ];
}
