"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Package01Icon,
  UserEdit01Icon,
  ShoppingBag01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@repo/ui/lib/utils";

type ResultType = "Navigation" | "Products" | "Customers" | "Orders";

interface Result {
  key: string;
  type: ResultType;
  label: string;
  sublabel?: string;
  href: string;
  icon: IconSvgElement;
}

const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Analytics", href: "/analytics" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Inventory", href: "/inventory" },
  { label: "Inventory Adjustments", href: "/inventory-adjustments" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Purchase Orders", href: "/purchase-orders" },
  { label: "Customers", href: "/customers" },
  { label: "Discounts", href: "/discounts" },
  { label: "Orders", href: "/orders" },
  { label: "Tax Rates", href: "/tax-rates" },
  { label: "Store Settings", href: "/store-settings" },
  { label: "Staff", href: "/staff" },
];

const TYPE_ICON: Record<ResultType, IconSvgElement> = {
  Navigation: ArrowRight01Icon,
  Products: Package01Icon,
  Customers: UserEdit01Icon,
  Orders: ShoppingBag01Icon,
};

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const term = query.trim();
  const hasTerm = term.length >= 1;
  const searchArgs = hasTerm ? { search: term } : undefined;

  // Live searches — only run while the palette is open and a term is present.
  const products = useQuery(
    api.catalog.products.list,
    open && searchArgs
      ? { paginationOpts: { numItems: 6, cursor: null }, ...searchArgs }
      : "skip",
  );
  const customers = useQuery(
    api.crm.customers.list,
    open && searchArgs
      ? { paginationOpts: { numItems: 6, cursor: null }, ...searchArgs }
      : "skip",
  );
  const orders = useQuery(
    api.pos.orders.list,
    open && searchArgs
      ? { paginationOpts: { numItems: 6, cursor: null }, ...searchArgs }
      : "skip",
  );

  // Reset state whenever the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      // Focus the input after the modal mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const lower = term.toLowerCase();
    const out: Result[] = [];

    // Navigation always matches by label substring.
    for (const link of NAV_LINKS) {
      if (!hasTerm || link.label.toLowerCase().includes(lower)) {
        out.push({
          key: `nav:${link.href}`,
          type: "Navigation",
          label: link.label,
          href: link.href,
          icon: TYPE_ICON.Navigation,
        });
      }
    }

    if (hasTerm) {
      for (const p of products?.page ?? []) {
        out.push({
          key: `product:${p._id}`,
          type: "Products",
          label: p.name,
          sublabel: p.sku ? `SKU ${p.sku}` : undefined,
          href: "/products",
          icon: TYPE_ICON.Products,
        });
      }
      for (const c of customers?.page ?? []) {
        out.push({
          key: `customer:${c._id}`,
          type: "Customers",
          label: c.name,
          sublabel: c.email ?? c.phone ?? undefined,
          href: "/customers",
          icon: TYPE_ICON.Customers,
        });
      }
      for (const o of orders?.page ?? []) {
        out.push({
          key: `order:${o._id}`,
          type: "Orders",
          label: o.order_number,
          sublabel: o.customer_name ?? "Walk-in",
          href: "/orders",
          icon: TYPE_ICON.Orders,
        });
      }
    }

    // Cap navigation to the first 6 when there is no term, to avoid a wall.
    return hasTerm ? out : out.slice(0, 6);
  }, [term, hasTerm, products, customers, orders]);

  // Keep the active index within bounds as results change.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, results.length - 1)));
  }, [results.length]);

  function select(r: Result | undefined) {
    if (!r) return;
    onClose();
    router.push(r.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[active]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  // Scroll the active row into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  // Group ordered results by type for display, preserving the flat index.
  const grouped: { type: ResultType; items: { r: Result; index: number }[] }[] =
    [];
  results.forEach((r, index) => {
    let g = grouped.find((x) => x.type === r.type);
    if (!g) {
      g = { type: r.type, items: [] };
      grouped.push(g);
    }
    g.items.push({ r, index });
  });

  const loading =
    hasTerm &&
    (products === undefined ||
      customers === undefined ||
      orders === undefined);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-background relative z-10 flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-xl shadow-2xl"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            className="shrink-0 text-slate-400"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search products, customers, orders or pages…"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border border-slate-300 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {loading
                ? "Searching…"
                : hasTerm
                  ? "No results found."
                  : "Type to search."}
            </p>
          ) : (
            grouped.map((group) => (
              <div key={group.type} className="px-2 py-1">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {group.type}
                </p>
                {group.items.map(({ r, index }) => (
                  <button
                    key={r.key}
                    type="button"
                    data-index={index}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => select(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition",
                      index === active
                        ? "bg-burgundy-50 text-burgundy-900"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                        index === active
                          ? "bg-burgundy-600 text-white"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      <HugeiconsIcon icon={r.icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {r.label}
                      </span>
                      {r.sublabel ? (
                        <span className="block truncate text-xs text-slate-400">
                          {r.sublabel}
                        </span>
                      ) : null}
                    </span>
                    {index === active ? (
                      <kbd className="hidden rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline-block">
                        ↵
                      </kbd>
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
