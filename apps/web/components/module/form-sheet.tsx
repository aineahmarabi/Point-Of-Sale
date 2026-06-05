"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";

type FormSheetMode = "view" | "add" | "update";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  title: string;
  description: string;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
}

export type { FormSheetMode };

export function FormSheet({
  open,
  onOpenChange,
  mode,
  title,
  description,
  isSubmitting,
  error,
  onSubmit,
  children,
}: FormSheetProps) {
  const isViewMode = mode === "view";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-8 overflow-y-auto px-4"
        >
          {children}

          {!isViewMode && (
            <SheetFooter className="pt-4">
              {error && <div className="text-sm text-red-500">{error}</div>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : mode === "add"
                    ? "Create"
                    : "Update"}
              </Button>
            </SheetFooter>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}
