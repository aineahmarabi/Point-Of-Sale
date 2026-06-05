"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";

import { ActionsCell } from "@/components/admin/module/actions-cell";

type TaxRate = Doc<"tax_rates">;

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-red-100 text-red-800",
};

function YesNo({ value }: { value: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        value ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

interface ActionCallbacks {
  onView: (row: TaxRate) => void;
  onEdit: (row: TaxRate) => void;
  onDelete: (row: TaxRate) => void;
}

export function getColumns(actions: ActionCallbacks): ColumnDef<TaxRate>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => `${row.getValue<number>("rate")}%`,
    },
    {
      accessorKey: "is_inclusive",
      header: "Inclusive",
      cell: ({ row }) => <YesNo value={row.getValue<boolean>("is_inclusive")} />,
    },
    {
      accessorKey: "is_default",
      header: "Default",
      cell: ({ row }) => <YesNo value={row.getValue<boolean>("is_default")} />,
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
          module="tax_rates"
          onView={actions.onView}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      ),
    },
  ];
}
