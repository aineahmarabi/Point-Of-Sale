"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Package01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@repo/ui/lib/utils";
import { Input } from "@repo/ui/components/ui/input";

import { useCart } from "@/context/cart-context";
import { money } from "@/lib/format";
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
    const all = (productsResult?.page ?? []) as Product[];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku?.toLowerCase().includes(q) ?? false) ||
        (p.barcode?.toLowerCase().includes(q) ?? false),
    );
  }, [productsResult, search]);

  const categories = (categoriesResult?.page ?? []).filter(
    (c) => c.status === "active",
  );

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Search */}
      <div className="shrink-0 p-4">
        <Input
          placeholder="Search by name, SKU or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 border-slate-700 bg-slate-800 text-base text-slate-100 placeholder:text-slate-500 focus-visible:ring-burgundy-500"
          autoFocus
        />
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

      {/* Grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {productsResult === undefined ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="flex min-h-[150px] flex-col rounded-lg bg-slate-700 p-3"
              >
                <div className="shimmer mb-2 aspect-square rounded-md" />
                <div className="shimmer mb-2 h-3.5 w-3/4 rounded" />
                <div className="shimmer h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            No products found.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {products.map((product) => {
              const stock = stockMap.get(product._id);
              const outOfStock = !product.is_service && stock?.quantity === 0;
              const variantCount = (variantMap.get(product._id) ?? []).filter(
                (v) => v.status === "active",
              ).length;
              const imageUrl = product.images?.[0]?.startsWith("http")
                ? product.images[0]
                : null;
              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className={cn(
                    "flex min-h-[150px] flex-col rounded-lg bg-slate-700 p-3 text-left transition hover:bg-slate-600 active:scale-[0.98]",
                    outOfStock && "opacity-50",
                  )}
                >
                  <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-slate-800">
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
                        size={44}
                        className="text-slate-500"
                      />
                    )}
                  </div>
                  <div className="line-clamp-2 text-sm font-bold leading-tight text-white">
                    {product.name}
                  </div>
                  <div className="mt-1 text-base font-bold text-burgundy-400">
                    {money(product.selling_price, currency)}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                    <StockBadge product={product} stock={stock} />
                    {variantCount > 0 && (
                      <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                        {variantCount} options
                      </span>
                    )}
                  </div>
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
