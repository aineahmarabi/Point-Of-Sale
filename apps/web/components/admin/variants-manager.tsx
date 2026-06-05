"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { Modal } from "@/components/pos/modal";
import { money } from "@/lib/format";

export function VariantsManager({
  open,
  onClose,
  product,
  currency,
}: {
  open: boolean;
  onClose: () => void;
  product?: Doc<"products">;
  currency: string;
}) {
  const variants = useQuery(
    api.catalog.variants.list,
    open && product
      ? {
          paginationOpts: { numItems: 200, cursor: null },
          product_id: product._id,
        }
      : "skip",
  );
  const createVariant = useMutation(api.catalog.variants.create);
  const removeVariant = useMutation(api.catalog.variants.remove);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createVariant({
        product_id: product._id,
        name: name.trim(),
        ...(sku.trim() ? { sku: sku.trim() } : {}),
        ...(price.trim() ? { price_override: Number(price) } : {}),
        status: "active",
      });
      setName("");
      setSku("");
      setPrice("");
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? (err.data as string)
          : "Failed to add variant.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold">Variants</h2>
          <p className="text-muted-foreground text-sm">{product?.name}</p>
        </div>

        <div className="max-h-56 space-y-2 overflow-y-auto">
          {variants === undefined ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : variants.page.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No variants yet. Add size/colour combinations below.
            </p>
          ) : (
            variants.page.map((v) => (
              <div
                key={v._id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{v.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {v.sku ? `${v.sku} · ` : ""}
                    {v.price_override != null
                      ? money(v.price_override, currency)
                      : `Base ${money(product?.selling_price ?? 0, currency)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant({ id: v._id })}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add variant</p>
          <div className="space-y-1.5">
            <Label htmlFor="v-name">Name (e.g. Red / M)</Label>
            <Input
              id="v-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Red / M"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-sku">SKU (optional)</Label>
              <Input
                id="v-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-price">Price (optional)</Label>
              <Input
                id="v-price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Base price"
                className="h-10"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              type="submit"
              className="h-10 flex-1"
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Adding…" : "Add Variant"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
