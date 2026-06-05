"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { Modal } from "./modal";
import { money } from "@/lib/format";
import type { AppliedDiscount } from "@/context/cart-context";

function toApplied(d: Doc<"discounts">): AppliedDiscount {
  return {
    id: d._id,
    code: d.code,
    name: d.name,
    type: d.type,
    value: d.value,
  };
}

function describe(d: Doc<"discounts">, currency: string): string {
  if (d.type === "percentage") return `${d.value}% off`;
  if (d.type === "fixed") return `${money(d.value, currency)} off`;
  return "Buy one get one";
}

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  currency: string;
  onApply: (discount: AppliedDiscount | null) => void;
}

export function DiscountModal({
  open,
  onClose,
  currency,
  onApply,
}: DiscountModalProps) {
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const codeResult = useQuery(
    api.promotions.discounts.getByCode,
    lookup ? { code: lookup } : "skip",
  );
  const activeDiscounts = useQuery(
    api.promotions.discounts.list,
    open
      ? { paginationOpts: { numItems: 50, cursor: null }, is_active: true }
      : "skip",
  );

  useEffect(() => {
    if (!lookup || codeResult === undefined) return;
    if (codeResult === null) {
      setNotFound(true);
      setLookup(null);
      return;
    }
    onApply(toApplied(codeResult));
  }, [codeResult, lookup, onApply]);

  // Reset transient state when the modal closes.
  useEffect(() => {
    if (!open) {
      setCode("");
      setLookup(null);
      setNotFound(false);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-semibold">Apply Discount</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotFound(false);
            if (code.trim()) setLookup(code.trim());
          }}
          className="space-y-2"
        >
          <Label htmlFor="discount-code">Coupon Code</Label>
          <div className="flex gap-2">
            <Input
              id="discount-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="h-11"
            />
            <Button type="submit" className="h-11" disabled={!code.trim()}>
              Apply
            </Button>
          </div>
          {notFound && (
            <p className="text-sm text-red-500">No discount found for that code.</p>
          )}
        </form>

        <div>
          <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase">
            Available discounts
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {activeDiscounts === undefined ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : activeDiscounts.page.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No active discounts.
              </p>
            ) : (
              activeDiscounts.page.map((d) => (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => onApply(toApplied(d))}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:bg-zinc-50"
                >
                  <span className="text-sm font-medium">{d.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {describe(d, currency)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={() => onApply(null)}
          >
            Remove Discount
          </Button>
          <Button variant="ghost" className="h-11 flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
