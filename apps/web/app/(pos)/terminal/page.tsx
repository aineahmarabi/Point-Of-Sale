"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/backend";

import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";

export default function TerminalPage() {
  const session = useQuery(api.pos.sessions.getOpenByUser);
  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  // The (pos) layout guarantees an open session before rendering this route,
  // but guard while the query settles.
  if (!session) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-slate-400">
        <p className="text-sm">Loading terminal…</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-slate-900">
      {/* Left — product grid */}
      <div className="min-w-0 flex-1 bg-slate-900">
        <ProductGrid currency={currency} />
      </div>
      {/* Right — cart */}
      <div className="w-[40%] max-w-md border-l border-slate-700 bg-slate-800">
        <CartPanel
          session={session}
          currency={currency}
          requireCustomer={settings?.require_customer_on_sale ?? false}
        />
      </div>
    </div>
  );
}
