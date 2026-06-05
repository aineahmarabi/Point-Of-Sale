"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/ui/button";

/**
 * Admin route error boundary. Never renders raw error details (which could
 * leak internal messages) — shows a friendly recovery screen instead.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for diagnostics without surfacing details to the user.
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-slate-900">
          Something went wrong
        </h2>
        <p className="max-w-sm text-sm text-slate-500">
          We hit an unexpected error loading this page. You can try again, and
          if it keeps happening, refresh or sign in again.
        </p>
      </div>
      <Button
        onClick={reset}
        className="min-h-[44px] bg-burgundy-600 hover:bg-burgundy-700"
      >
        Try again
      </Button>
    </div>
  );
}
