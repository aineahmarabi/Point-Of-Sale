"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { Doc, Id } from "@repo/backend/dataModel";

export interface CartItem {
  /** Stable identity = product + variant, so each variant is its own line. */
  key: string;
  product_id: Id<"products">;
  variant_id?: Id<"variants">;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  /** Tax rate (%) kept so tax recomputes on quantity change. Internal. */
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export interface AddItemInput {
  product_id: Id<"products">;
  variant_id?: Id<"variants">;
  product_name: string;
  sku: string;
  unit_price: number;
  tax_rate: number;
}

export interface AppliedDiscount {
  id?: Id<"discounts">;
  code?: string;
  name: string;
  type: "percentage" | "fixed" | "bogo";
  value: number;
}

interface CartContextValue {
  items: CartItem[];
  customer: Doc<"customers"> | null;
  discount: AppliedDiscount | null;
  addItem: (input: AddItemInput) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  applyDiscount: (discount: AppliedDiscount | null) => void;
  setCustomer: (customer: Doc<"customers"> | null) => void;
  clearCart: () => void;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  item_count: number;
}

const STORAGE_KEY = "pos-cart-v1";

function itemKey(productId: string, variantId?: string): string {
  return `${productId}::${variantId ?? ""}`;
}

/** Recompute line_total and tax_amount from unit_price/quantity. */
function recompute(item: CartItem): CartItem {
  const base = item.unit_price * item.quantity;
  const line_total = base - item.discount_amount;
  const tax_amount = (line_total * item.tax_rate) / 100;
  return { ...item, line_total, tax_amount };
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customer, setCustomerState] = useState<Doc<"customers"> | null>(null);
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const loaded: CartItem[] = Array.isArray(parsed.items)
          ? parsed.items.map((i: CartItem) => ({
              ...i,
              key: i.key ?? itemKey(i.product_id, i.variant_id),
            }))
          : [];
        setItems(loaded);
        setCustomerState(parsed.customer ?? null);
        setDiscount(parsed.discount ?? null);
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (only after hydration so we don't clobber stored state).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, customer, discount }),
      );
    } catch {
      // storage may be unavailable; ignore
    }
  }, [items, customer, discount, hydrated]);

  const addItem = useCallback((input: AddItemInput) => {
    const key = itemKey(input.product_id, input.variant_id);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing) {
          const next = [...prev];
          next[idx] = recompute({
            ...existing,
            quantity: existing.quantity + 1,
          });
          return next;
        }
      }
      return [
        ...prev,
        recompute({
          key,
          product_id: input.product_id,
          variant_id: input.variant_id,
          product_name: input.product_name,
          sku: input.sku,
          unit_price: input.unit_price,
          quantity: 1,
          discount_amount: 0,
          tax_rate: input.tax_rate,
          tax_amount: 0,
          line_total: 0,
        }),
      ];
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.key !== key);
      return prev.map((i) =>
        i.key === key ? recompute({ ...i, quantity }) : i,
      );
    });
  }, []);

  const applyDiscount = useCallback(
    (d: AppliedDiscount | null) => setDiscount(d),
    [],
  );
  const setCustomer = useCallback(
    (c: Doc<"customers"> | null) => setCustomerState(c),
    [],
  );
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(null);
    setCustomerState(null);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
    [items],
  );
  const tax_total = useMemo(
    () => items.reduce((s, i) => s + i.tax_amount, 0),
    [items],
  );
  const discount_total = useMemo(() => {
    if (!discount) return 0;
    if (discount.type === "percentage")
      return Math.min(subtotal, (subtotal * discount.value) / 100);
    if (discount.type === "fixed") return Math.min(subtotal, discount.value);
    return 0; // bogo is not auto-computed in this terminal
  }, [discount, subtotal]);
  const grand_total = useMemo(
    () => Math.max(0, subtotal - discount_total + tax_total),
    [subtotal, discount_total, tax_total],
  );
  const item_count = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    customer,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    applyDiscount,
    setCustomer,
    clearCart,
    subtotal,
    discount_total,
    tax_total,
    grand_total,
    item_count,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
