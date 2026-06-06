"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Package01Icon, Add01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@repo/ui/lib/utils";
import { Input } from "@repo/ui/components/ui/input";

import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format";
import { VariantPickerModal } from "./variant-picker-modal";

type Product = Doc<"products"> & { category_name?: string | null };
type Variant = Doc<"variants">;

interface StockInfo {
  quantity: number;
  reorder_point: number;
}

function StockBadge({
  product,
  stock,
}: {
  product: Product;
  stock?: StockInfo;
}) {
  if (product.is_service) {
    return (
      <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
        Service
      </span>
    );
  }
  if (!stock) {
    return <span className="text-xs text-slate-500">Untracked</span>;
  }
  if (stock.quantity <= 0) {
    return (
      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
        Out of stock
      </span>
    );
  }
  const low = stock.quantity <= stock.reorder_point;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        low
          ? "bg-amber-500/20 text-amber-300"
          : "bg-green-500/20 text-green-300",
      )}
    >
      {stock.quantity} in stock
    </span>
  );
}

export function ProductGrid({ currency }: { currency: string }) {
  const { addItem } = useCart();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "all">("all");
  const [sort, setSort] = useState<"alpha" | "latest">("alpha");
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const categoriesResult = useQuery(api.catalog.categories.list, {
    paginationOpts: { numItems: 100, cursor: null },
    status: "active",
  });
  const productsResult = useQuery(api.catalog.products.list, {
    paginationOpts: { numItems: 100, cursor: null },
    status: "active",
    ...(categoryId !== "all" ? { category_id: categoryId } : {}),
  });
  const inventoryResult = useQuery(api.catalog.inventory.list, {
    paginationOpts: { numItems: 200, cursor: null },
  });
  const variantsResult = useQuery(api.catalog.variants.list, {
    paginationOpts: { numItems: 500, cursor: null },
    status: "active",
  });

  const stockMap = useMemo(() => {
    const map = new Map<string, StockInfo>();
    for (const item of inventoryResult?.page ?? []) {
      // First inventory record per product wins (base stock).
      if (!map.has(item.product_id)) {
        map.set(item.product_id, {
          quantity: item.quantity,
          reorder_point: item.reorder_point,
        });
      }
    }
    return map;
  }, [inventoryResult]);

  const variantMap = useMemo(() => {
    const map = new Map<string, Variant[]>();
    for (const v of variantsResult?.page ?? []) {
      const list = map.get(v.product_id) ?? [];
      list.push(v);
      map.set(v.product_id, list);
    }
    return map;
  }, [variantsResult]);

  function handleProductClick(product: Product) {
    const variants = (variantMap.get(product._id) ?? []).filter(
      (v) => v.status === "active",
    );
    if (variants.length > 0) {
      setPickerProduct(product);
      setPickerOpen(true);
      return;
    }
    addItem({
      product_id: product._id,
      product_name: product.name,
      sku: product.sku ?? "",
      unit_price: product.selling_price,
      tax_rate: product.tax_rate ?? 0,
    });
  }

  function handleVariantSelect(variant: Variant) {
    if (!pickerProduct) return;
    addItem({
      product_id: pickerProduct._id,
      variant_id: variant._id,
      product_name: `${pickerProduct.name} — ${variant.name}`,
      sku: variant.sku ?? pickerProduct.sku ?? "",
      unit_price: variant.price_override ?? pickerProduct.selling_price,
      tax_rate: pickerProduct.tax_rate ?? 0,
    });
    setPickerOpen(false);
  }

  const products = useMemo(() => {
    let all = (productsResult?.page ?? []) as Product[];
    const q = search.trim().toLowerCase();
    if (q) {
      all = all.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false) ||
          (p.barcode?.toLowerCase().includes(q) ?? false),
      );
    }
    if (sort === "alpha") {
      all = [...all].sort((a, b) => a.name.localeCompare(b.name));
    }
    // "latest" keeps Convex's default insertion order (newest first)
    return all;
  }, [productsResult, search, sort]);

  const categories = (categoriesResult?.page ?? []).filter(
    (c) => c.status === "active",
  );

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Search + sort dropdown */}
      <div className="shrink-0 flex gap-2 p-4 pb-2">
        <Input
          placeholder="Search by name, SKU or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 min-w-0 flex-1 border-slate-700 bg-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:ring-burgundy-500"
          autoFocus
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "alpha" | "latest")}
          className="h-11 shrink-0 rounded-md border border-slate-700 bg-slate-800 px-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-burgundy-500"
        >
          <option value="alpha">A – Z</option>
          <option value="latest">Latest</option>
        </select>
      </div>

      {/* Category pills — horizontal scroll */}
      <div className="shrink-0 px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <CategoryPill
            active={categoryId === "all"}
            onClick={() => setCategoryId("all")}
          >
            All
          </CategoryPill>
          {categories.map((c) => (
            <CategoryPill
              key={c._id}
              active={categoryId === c._id}
              onClick={() => setCategoryId(c._id)}
            >
              {c.name}
            </CategoryPill>
          ))}
        </div>
      </div>

      {/* Product list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {productsResult === undefined ? (
          // Skeleton rows
          <div className="divide-y divide-slate-700/60">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="shimmer h-10 w-10 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-3.5 w-2/3 rounded" />
                  <div className="shimmer h-3 w-1/3 rounded" />
                </div>
                <div className="shimmer h-6 w-16 rounded-full" />
                <div className="shimmer h-8 w-14 rounded-md" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No products found.
          </p>
        ) : (
          <div className="divide-y divide-slate-700/60">
            {products.map((product) => {
              const stock = stockMap.get(product._id);
              const outOfStock = !product.is_service && stock?.quantity === 0;
              const hasVariants =
                (variantMap.get(product._id) ?? []).filter(
                  (v) => v.status === "active",
                ).length > 0;
              const imageUrl = product.images?.[0]?.startsWith("http")
                ? product.images[0]
                : null;

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className={cn(
                    "flex h-16 w-full items-center gap-3 border-b border-slate-700 bg-slate-800 px-4 text-left transition hover:bg-slate-700 active:bg-slate-600",
                    outOfStock && "opacity-50",
                  )}
                >
                  {/* Thumbnail — 40×40 */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-700">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={Package01Icon}
                        size={20}
                        className="text-slate-500"
                      />
                    )}
                  </div>

                  {/* Name + category — takes remaining space */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {product.name}
                      {hasVariants && (
                        <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                          · options
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {product.category_name ?? ""}
                    </p>
                  </div>

                  {/* Stock badge — fixed */}
                  <div className="shrink-0">
                    <StockBadge product={product} stock={stock} />
                  </div>

                  {/* Price — fixed width, right-aligned */}
                  <span className="w-24 shrink-0 text-right text-sm font-bold tabular-nums text-emerald-400">
                    {formatCurrency(product.selling_price, currency)}
                  </span>

                  {/* Add button — fixed */}
                  <span className="shrink-0 rounded-lg bg-burgundy-600 px-3 py-1.5 text-xs font-semibold text-white">
                    Add
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <VariantPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        product={pickerProduct}
        variants={
          pickerProduct ? (variantMap.get(pickerProduct._id) ?? []) : []
        }
        currency={currency}
        onSelect={handleVariantSelect}
      />
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-medium transition",
        active
          ? "bg-burgundy-500 text-white"
          : "bg-slate-700 text-slate-300 hover:bg-slate-600",
      )}
    >
      {children}
    </button>
  );
}
