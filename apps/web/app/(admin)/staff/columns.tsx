"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

type Staff = Doc<"users"> & { role_name?: string | null };

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

interface ActionCallbacks {
  currentUserId?: string;
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

export function getColumns({
  currentUserId,
  onEdit,
  onDelete,
}: ActionCallbacks): ColumnDef<Staff>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const n = row.original.name;
        return n ? `${n.first} ${n.last}` : row.original.email;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role_name",
      header: "Role",
      cell: ({ row }) => {
        const r = row.original.role_name;
        return r ? (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium capitalize text-blue-800">
            {r}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusStyles[s] ?? ""}`}
          >
            {s}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const staff = row.original;
        if (currentUserId && staff._id === currentUserId) {
          return (
            <div className="text-muted-foreground flex justify-end text-xs">
              You
            </div>
          );
        }
        return (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onEdit(staff)}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(staff)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];
}
