"use client";

import { useState } from "react";
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";

import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/format";
import { DiscountModal } from "./discount-modal";
import { CustomerModal } from "./customer-modal";
import { PaymentModal } from "./payment-modal";

interface CartPanelProps {
  currency: string;
  requireCustomer: boolean;
}

export function CartPanel({ currency, requireCustomer }: CartPanelProps) {
  const { currentUser } = useData();
  const {
    items,
    item_count,
    subtotal,
    discount,
    discount_total,
    tax_total,
    grand_total,
    customer,
    updateQuantity,
    removeItem,
    applyDiscount,
    setCustomer,
  } = useCart();

  const [discountOpen, setDiscountOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const blockedNoCustomer = requireCustomer && !customer;
  const canCharge = items.length > 0 && !blockedNoCustomer;

  return (
    <div className="flex h-full flex-col bg-slate-800 text-slate-100">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            Cart
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-burgundy-500 px-2 text-xs font-bold text-white">
              {item_count}
            </span>
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {currentUser?.name
            ? `${currentUser.name.first} ${currentUser.name.last}`.trim()
            : (currentUser?.email ?? "—")}
        </p>
      </div>

      {/* Line items */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-500">No items in cart</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-700">
            {items.map((item) => (
              <li key={item.key} className="animate-slide-in px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.unit_price, currency)}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 px-1 text-lg leading-none text-slate-500 hover:text-red-400"
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity - 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-600 text-xl text-slate-200 hover:bg-slate-700"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.key, item.quantity + 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-600 text-xl text-slate-200 hover:bg-slate-700"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-slate-100">
                    {formatCurrency(item.line_total, currency)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer / totals */}
      <div className="shrink-0 space-y-3 border-t border-slate-700 px-5 py-4">
        {/* Customer */}
        {customer ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-sm">
            <span className="truncate">
              <span className="text-slate-400">Customer: </span>
              {customer.name}
            </span>
            <button
              type="button"
              onClick={() => setCustomer(null)}
              className="text-xs text-slate-400 hover:text-red-400"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-11 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => setDiscountOpen(true)}
          >
            {discount ? "Edit Discount" : "Apply Discount"}
          </Button>
          <Button
            variant="outline"
            className="h-11 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => setCustomerOpen(true)}
          >
            {customer ? "Change Customer" : "Add Customer"}
          </Button>
        </div>

        {/* Totals */}
        <div className="space-y-1.5 border-t border-slate-700 pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Subtotal</span>
            <span className="tabular-nums">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>
          {discount && discount_total > 0 ? (
            <div className="flex justify-between text-burgundy-400">
              <span className="flex items-center gap-2">
                Discount
                <button
                  type="button"
                  onClick={() => applyDiscount(null)}
                  className="text-xs text-slate-400 hover:text-red-400"
                >
                  (remove)
                </button>
              </span>
              <span className="tabular-nums">
                −{formatCurrency(discount_total, currency)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-slate-400">Tax</span>
            <span className="tabular-nums">
              {formatCurrency(tax_total, currency)}
            </span>
          </div>
          <div className="flex items-baseline justify-between border-t border-slate-700 pt-2">
            <span className="text-base font-semibold">Total</span>
            <span className="text-2xl font-bold tabular-nums text-burgundy-400">
              {formatCurrency(grand_total, currency)}
            </span>
          </div>
        </div>

        {blockedNoCustomer ? (
          <p className="text-center text-xs text-amber-400">
            A customer is required to complete a sale.
          </p>
        ) : null}

        <Button
          className="h-14 w-full bg-burgundy-500 text-lg font-bold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
          disabled={!canCharge}
          onClick={() => setPaymentOpen(true)}
        >
          Charge {formatCurrency(grand_total, currency)}
        </Button>
      </div>

      {/* Modals */}
      <DiscountModal
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        currency={currency}
        onApply={(d) => {
          applyDiscount(d);
          setDiscountOpen(false);
        }}
      />
      <CustomerModal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        onSelect={(c) => {
          setCustomer(c);
          setCustomerOpen(false);
        }}
      />
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        currency={currency}
      />
    </div>
  );
}
