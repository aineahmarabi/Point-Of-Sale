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
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold">{product?.name}</h2>
          <p className="text-muted-foreground text-sm">Choose a variant</p>
        </div>

        {active.length === 0 ? (
          <p className="text-muted-foreground text-sm">
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
                  className="hover:border-burgundy-600 flex min-h-[64px] flex-col items-start justify-center rounded-lg border-2 border-zinc-200 p-3 text-left transition"
                >
                  <span className="text-sm font-semibold">{v.name}</span>
                  <span className="text-burgundy-600 text-sm font-bold">
                    {money(price, currency)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <Button variant="ghost" className="h-11 w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
