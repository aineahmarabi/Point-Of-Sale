"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import { CommandPalette } from "./command-palette";

/**
 * Sticky page header shown on every admin page. Page title on the left,
 * search + page-specific actions on the right. The store name lives in the
 * sidebar, so it is intentionally not repeated here. Pass `actions` for
 * page-specific controls and `leading` for the mobile menu button.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  leading,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Global Ctrl/Cmd+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5 md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900 md:text-2xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {/* Search trigger — opens the command palette (Ctrl/Cmd+K) */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-400 transition hover:bg-slate-100 md:min-h-[40px] md:w-56 md:justify-between"
          >
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Search01Icon} size={16} />
              <span className="hidden text-sm md:inline">Search…</span>
            </span>
            <kbd className="hidden items-center rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 md:inline-flex">
              ⌘K
            </kbd>
          </button>

          {actions}
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  );
}
