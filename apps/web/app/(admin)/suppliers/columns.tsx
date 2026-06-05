"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Supplier = Doc<"suppliers">;

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
};

interface ActionCallbacks {
  onView: (row: Supplier) => void;
  onEdit: (row: Supplier) => void;
  onDelete: (row: Supplier) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Supplier>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "contact_name",
      header: "Contact",
      cell: ({ row }) => row.getValue<string | undefined>("contact_name") ?? "â€”",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => row.getValue<string | undefined>("email") ?? "â€”",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.getValue<string | undefined>("phone") ?? "â€”",
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
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="suppliers"
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ),
    },
  ];
}
