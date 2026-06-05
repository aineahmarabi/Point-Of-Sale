"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Disable closing via backdrop/Escape (e.g. while processing). */
  dismissable?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  className,
  dismissable = true,
}: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={dismissable ? onClose : undefined}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "bg-background relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl shadow-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
