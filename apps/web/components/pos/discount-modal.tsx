"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { cn } from "@repo/ui/lib/utils";
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

function typeBadge(d: Doc<"discounts">): string {
  if (d.type === "percentage") return "%";
  if (d.type === "fixed") return "KES";
  return "BOGO";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      setSelectedId(null);
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="bg-slate-800 text-slate-100 sm:border sm:border-slate-700"
    >
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-bold text-white">Apply Discount</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setNotFound(false);
            if (code.trim()) setLookup(code.trim());
          }}
          className="space-y-2"
        >
          <Label htmlFor="discount-code" className="text-slate-300">
            Coupon Code
          </Label>
          <div className="flex gap-2">
            <Input
              id="discount-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="h-11 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
            />
            <Button
              type="submit"
              className="h-11 bg-burgundy-500 font-semibold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
              disabled={!code.trim()}
            >
              Apply
            </Button>
          </div>
          {notFound && (
            <p className="text-sm text-red-400">No discount found for that code.</p>
          )}
        </form>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available discounts
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {activeDiscounts === undefined ? (
              <p className="text-sm text-slate-400">Loading…</p>
            ) : activeDiscounts.page.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
                <p className="text-sm font-medium text-slate-300">
                  No active discounts
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Create discounts in the admin area to offer them here.
                </p>
              </div>
            ) : (
              activeDiscounts.page.map((d) => {
                const selected = selectedId === d._id;
                return (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => {
                      setSelectedId(d._id);
                      onApply(toApplied(d));
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                      selected
                        ? "border-burgundy-500 bg-burgundy-500/10"
                        : "border-slate-700 bg-slate-900/50 hover:bg-slate-700/50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {d.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {describe(d, currency)}
                        {d.code ? ` · Code ${d.code}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-700 px-2 py-1 text-xs font-bold text-slate-100">
                      {typeBadge(d)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => {
              setSelectedId(null);
              onApply(null);
            }}
          >
            Remove Discount
          </Button>
          <Button
            variant="ghost"
            className="h-11 flex-1 text-slate-300 hover:bg-slate-700 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
