"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import { cn } from "@repo/ui/lib/utils";

import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format";

export default function TerminalPage() {
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";
  const { item_count, grand_total } = useCart();
  const [view, setView] = useState<"products" | "cart">("products");

  return (
    <div className="relative flex h-full bg-slate-900">
      {/* Left — product grid (full width on mobile when products view) */}
      <div
        className={cn(
          "min-w-0 flex-1 bg-slate-900",
          view === "cart" && "hidden md:block",
        )}
      >
        <ProductGrid currency={currency} />
      </div>

      {/* Right — cart (full width on mobile when cart view) */}
      <div
        className={cn(
          "w-full flex-col border-slate-700 bg-slate-800 md:flex md:w-[40%] md:max-w-md md:border-l",
          view === "cart" ? "flex" : "hidden md:flex",
        )}
      >
        {/* Mobile-only back-to-products bar */}
        <button
          type="button"
          onClick={() => setView("products")}
          className="border-b border-slate-700 px-5 py-3 text-left text-sm font-medium text-burgundy-400 md:hidden"
        >
          ← Back to Products
        </button>
        <div className="min-h-0 flex-1">
          <CartPanel
            currency={currency}
            requireCustomer={settings?.require_customer_on_sale ?? false}
          />
        </div>
      </div>

      {/* Mobile floating cart button (bottom-right, only while browsing) */}
      {view === "products" && (
        <button
          type="button"
          onClick={() => setView("cart")}
          className="fixed bottom-5 right-5 z-30 flex min-h-[52px] items-center gap-3 rounded-full bg-burgundy-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/30 active:scale-95 md:hidden"
        >
          <span>Cart ({item_count})</span>
          {item_count > 0 && (
            <span className="tabular-nums">
              {formatCurrency(grand_total, currency)}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
