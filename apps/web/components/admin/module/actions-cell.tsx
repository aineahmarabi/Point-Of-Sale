"use client";

import { Icon } from "@repo/ui/components/ui/icon";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import { useData } from "@repo/auth/hooks";
import {
  ViewIcon,
  PencilEdit02Icon,
  Delete01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons";

interface ActionsCellProps<T> {
  row: T;
  module?: string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

export function ActionsCell<T>({
  row,
  module: moduleName,
  onView,
  onEdit,
  onDelete,
}: ActionsCellProps<T>) {
  const isMobile = useIsMobile();
  const { hasPermission } = useData();

  const canView =
    onView && (!moduleName || hasPermission(`${moduleName}:view`));
  const canEdit =
    onEdit && (!moduleName || hasPermission(`${moduleName}:update`));
  const canDelete =
    onDelete && (!moduleName || hasPermission(`${moduleName}:remove`));

  if (!canView && !canEdit && !canDelete) return null;

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="flex items-center justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Icon icon={MoreVerticalIcon} size={16} />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canView && (
            <DropdownMenuItem onClick={() => onView!(row)}>
              <Icon icon={ViewIcon} size={16} className="text-emerald-600" />
              View
            </DropdownMenuItem>
          )}
          {canEdit && (
            <DropdownMenuItem onClick={() => onEdit!(row)}>
              <Icon
                icon={PencilEdit02Icon}
                size={16}
                className="text-blue-500"
              />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem onClick={() => onDelete!(row)}>
              <Icon
                icon={Delete01Icon}
                size={16}
                className="text-destructive"
              />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {canView && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onView!(row)}
        >
          <Icon icon={ViewIcon} size={16} className="text-emerald-600" />
          <span className="sr-only">View</span>
        </Button>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit!(row)}
        >
          <Icon icon={PencilEdit02Icon} size={16} className="text-blue-500" />
          <span className="sr-only">Edit</span>
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDelete!(row)}
        >
          <Icon icon={Delete01Icon} size={16} className="text-destructive" />
          <span className="sr-only">Delete</span>
        </Button>
      )}
    </div>
  );
}
