"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type Discount = Doc<"discounts">;

const typeStyles: Record<string, string> = {
  percentage: "bg-blue-100 text-blue-800",
  fixed: "bg-purple-100 text-purple-800",
  bogo: "bg-amber-100 text-amber-800",
};

interface ActionCallbacks {
  onView: (row: Discount) => void;
  onEdit: (row: Discount) => void;
  onDelete: (row: Discount) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<Discount>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const code = row.getValue<string | undefined>("code");
        return code ? (
          <span className="font-mono text-xs">{code}</span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue<string>("type");
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${typeStyles[type] ?? ""}`}
          >
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const value = row.getValue<number>("value");
        const type = row.original.type;
        return type === "percentage" ? `${value}%` : value?.toFixed(2);
      },
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => {
        const active = row.getValue<boolean>("is_active");
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      id: "usage",
      header: "Usage",
      cell: ({ row }) => {
        const { usage_count, usage_limit } = row.original;
        return usage_limit != null
          ? `${usage_count} / ${usage_limit}`
          : `${usage_count}`;
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <ActionsCell
          row={row.original}
          module="discounts"
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ),
    },
  ];
}
