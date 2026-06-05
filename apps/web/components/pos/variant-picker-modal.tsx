"use client";

import type { Doc } from "@repo/backend/dataModel";
import { Button } from "@repo/ui/components/ui/button";

import { Modal } from "./modal";
import { money } from "@/lib/format";

type Product = Doc<"products"> & { category_name?: string | null };
type Variant = Doc<"variants">;

export function VariantPickerModal({
  open,
  onClose,
  product,
  variants,
  currency,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  variants: Variant[];
  currency: string;
  onSelect: (variant: Variant) => void;
}) {
  const active = variants.filter((v) => v.status === "active");

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="bg-slate-800 text-slate-100 sm:border sm:border-slate-700"
    >
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-bold text-white">{product?.name}</h2>
          <p className="text-sm text-slate-400">Choose a variant</p>
        </div>

        {active.length === 0 ? (
          <p className="text-sm text-slate-400">
            No variants available for this product.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {active.map((v) => {
              const price = v.price_override ?? product?.selling_price ?? 0;
              return (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => onSelect(v)}
                  className="flex min-h-[64px] flex-col items-start justify-center rounded-lg border-2 border-slate-600 bg-slate-700 p-3 text-left transition hover:border-burgundy-500 hover:bg-slate-600"
                >
                  <span className="text-sm font-semibold text-white">
                    {v.name}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">
                    {money(price, currency)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <Button
          variant="outline"
          className="h-11 w-full border-slate-600 bg-transparent text-white hover:bg-slate-700 hover:text-white"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
