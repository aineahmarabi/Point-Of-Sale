"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Id } from "@repo/backend/dataModel";
import { productStatus } from "@repo/backend/validators";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

import { Modal } from "@/components/pos/modal";
import { ImageUploader } from "@/components/admin/image-uploader";
import { notifyError, notifySuccess } from "@/lib/errors";

const NEW_CATEGORY = "__new__";

type Status = (typeof productStatus)[number];

interface VariantRow {
  key: string;
  _id?: Id<"variants">;
  name: string;
  sku: string;
  price: string;
  stock: string;
}

let rowSeq = 0;
const newKey = () => `row-${rowSeq++}`;

function slugSku(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return base ? `${base}-${suffix}` : `SKU-${suffix}`;
}

export function ProductFormPage({
  mode,
  productId,
}: {
  mode: "new" | "edit";
  productId?: Id<"products">;
}) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const settings = useQuery(api.settings.storeSettings.current);
  const currency = settings?.currency ?? "KES";

  const product = useQuery(
    api.catalog.products.get,
    isEdit && productId ? { id: productId } : "skip",
  );
  const categoriesResult = useQuery(api.catalog.categories.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });
  const taxRatesResult = useQuery(api.settings.taxRates.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });
  const variantsResult = useQuery(
    api.catalog.variants.list,
    isEdit && productId
      ? { paginationOpts: { numItems: 200, cursor: null }, product_id: productId }
      : "skip",
  );
  const inventoryResult = useQuery(
    api.catalog.inventory.list,
    isEdit && productId
      ? { paginationOpts: { numItems: 200, cursor: null }, product_id: productId }
      : "skip",
  );

  const createProduct = useMutation(api.catalog.products.create);
  const updateProduct = useMutation(api.catalog.products.update);
  const createVariant = useMutation(api.catalog.variants.create);
  const updateVariant = useMutation(api.catalog.variants.update);
  const removeVariant = useMutation(api.catalog.variants.remove);
  const createInventory = useMutation(api.catalog.inventory.create);
  const updateInventory = useMutation(api.catalog.inventory.update);
  const createCategory = useMutation(api.catalog.categories.create);

  // ── Form state ──────────────────────────────────────────────
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [status, setStatus] = useState<Status>("draft");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [taxRate, setTaxRate] = useState<string>("none");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [trackInventory, setTrackInventory] = useState(true);
  const [stock, setStock] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [hasVariants, setHasVariants] = useState(false);
  const [optName, setOptName] = useState("");
  const [optValues, setOptValues] = useState("");
  const [opt2Name, setOpt2Name] = useState("");
  const [opt2Values, setOpt2Values] = useState("");
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [removedVariantIds, setRemovedVariantIds] = useState<Id<"variants">[]>(
    [],
  );
  const [images, setImages] = useState<string[]>([]);

  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Inventory lookup by variant key ("" = base product).
  const inventoryByKey = useMemo(() => {
    const map = new Map<
      string,
      {
        _id: Id<"inventory">;
        quantity: number;
        reorder_point: number;
        reorder_quantity: number;
        location_id?: string;
      }
    >();
    for (const inv of inventoryResult?.page ?? []) {
      map.set(inv.variant_id ?? "", {
        _id: inv._id,
        quantity: inv.quantity,
        reorder_point: inv.reorder_point,
        reorder_quantity: inv.reorder_quantity,
        location_id: inv.location_id,
      });
    }
    return map;
  }, [inventoryResult]);

  // Hydrate the form once all edit data is present.
  useEffect(() => {
    if (!isEdit || loaded) return;
    if (
      product === undefined ||
      variantsResult === undefined ||
      inventoryResult === undefined
    ) {
      return;
    }
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setCategoryId(product.category_id ?? "none");
      setStatus(product.status);
      setSellingPrice(String(product.selling_price));
      setCostPrice(String(product.cost_price));
      setTaxRate(product.tax_rate != null ? String(product.tax_rate) : "none");
      setSku(product.sku ?? "");
      setBarcode(product.barcode ?? "");
      setTrackInventory(!product.is_service);
      setImages(product.images ?? []);

      const base = inventoryByKey.get("");
      if (base) {
        setStock(String(base.quantity));
        setReorderPoint(String(base.reorder_point));
      }

      const variants = variantsResult.page ?? [];
      if (variants.length > 0) {
        setHasVariants(true);
        setVariantRows(
          variants.map((vv) => {
            const inv = inventoryByKey.get(vv._id);
            return {
              key: newKey(),
              _id: vv._id,
              name: vv.name,
              sku: vv.sku ?? "",
              price: vv.price_override != null ? String(vv.price_override) : "",
              stock: inv ? String(inv.quantity) : "",
            };
          }),
        );
      }
    }
    setLoaded(true);
  }, [isEdit, loaded, product, variantsResult, inventoryResult, inventoryByKey]);

  const sellingNum = Number(sellingPrice) || 0;
  const costNum = Number(costPrice) || 0;
  const margin =
    sellingNum > 0 ? ((sellingNum - costNum) / sellingNum) * 100 : 0;

  const categories = categoriesResult?.page ?? [];
  const taxRates = taxRatesResult?.page ?? [];

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const id = await createCategory({
        name: newCatName.trim(),
        status: "active",
        display_order: 0,
      });
      setCategoryId(id);
      setNewCatName("");
      setNewCatOpen(false);
      notifySuccess("Category created.");
    } catch (err) {
      notifyError(err);
    } finally {
      setCreatingCat(false);
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function generateVariants() {
    const vals1 = optValues
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const vals2 = opt2Values
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (vals1.length === 0) return;

    const combos: string[] = [];
    if (vals2.length > 0) {
      for (const a of vals1) for (const b of vals2) combos.push(`${a} / ${b}`);
    } else {
      combos.push(...vals1);
    }
    setVariantRows(
      combos.map((label) => ({
        key: newKey(),
        name: label,
        sku: "",
        price: "",
        stock: "",
      })),
    );
  }

  function addVariantRow() {
    setVariantRows((prev) => [
      ...prev,
      { key: newKey(), name: "", sku: "", price: "", stock: "" },
    ]);
  }

  function updateRow(key: string, patch: Partial<VariantRow>) {
    setVariantRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(key: string) {
    setVariantRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row?._id) setRemovedVariantIds((ids) => [...ids, row._id!]);
      return prev.filter((r) => r.key !== key);
    });
  }

  async function upsertInventory(
    pid: Id<"products">,
    variantId: Id<"variants"> | undefined,
    quantity: number,
    reorder: number,
  ) {
    const existing = inventoryByKey.get(variantId ?? "");
    if (existing) {
      await updateInventory({
        id: existing._id,
        product_id: pid,
        ...(variantId ? { variant_id: variantId } : {}),
        quantity,
        reorder_point: reorder,
        reorder_quantity: existing.reorder_quantity || reorder,
        ...(existing.location_id ? { location_id: existing.location_id } : {}),
      });
    } else {
      await createInventory({
        product_id: pid,
        ...(variantId ? { variant_id: variantId } : {}),
        quantity,
        reorder_point: reorder,
        reorder_quantity: reorder,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product title is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Optional ID/number fields: only send a real value, otherwise undefined
      // (never "" — that fails the v.id / v.float64 validators).
      const realCategory =
        categoryId && categoryId !== "none"
          ? (categoryId as Id<"categories">)
          : undefined;
      const taxNum = Number(taxRate);
      const realTax =
        taxRate && taxRate !== "none" && !Number.isNaN(taxNum)
          ? taxNum
          : undefined;

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        sku: sku.trim() || undefined,
        barcode: barcode.trim() || undefined,
        category_id: realCategory,
        cost_price: costNum,
        selling_price: sellingNum,
        tax_rate: realTax,
        status,
        is_service: !trackInventory,
        images,
      };

      let pid: Id<"products">;
      if (isEdit && productId) {
        await updateProduct({ id: productId, ...payload });
        pid = productId;
      } else {
        pid = await createProduct(payload);
      }

      // Remove variants the user deleted.
      for (const id of removedVariantIds) {
        await removeVariant({ id });
      }

      if (hasVariants) {
        for (const row of variantRows) {
          if (!row.name.trim()) continue;
          const priceOverride = row.price ? Number(row.price) : undefined;
          let variantId: Id<"variants">;
          if (row._id) {
            await updateVariant({
              id: row._id,
              product_id: pid,
              name: row.name.trim(),
              ...(row.sku.trim() ? { sku: row.sku.trim() } : {}),
              ...(priceOverride != null
                ? { price_override: priceOverride }
                : {}),
              status: "active",
            });
            variantId = row._id;
          } else {
            variantId = await createVariant({
              product_id: pid,
              name: row.name.trim(),
              ...(row.sku.trim() ? { sku: row.sku.trim() } : {}),
              ...(priceOverride != null
                ? { price_override: priceOverride }
                : {}),
              status: "active",
            });
          }
          if (trackInventory && row.stock !== "") {
            await upsertInventory(
              pid,
              variantId,
              Number(row.stock),
              Number(reorderPoint) || 0,
            );
          }
        }
      } else if (trackInventory && stock !== "") {
        await upsertInventory(
          pid,
          undefined,
          Number(stock),
          Number(reorderPoint) || 0,
        );
      }

      notifySuccess(isEdit ? "Product updated." : "Product created.");
      router.push("/products");
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? (err.data as string)
          : "Failed to save product. Please try again.",
      );
      notifyError(err);
      setSubmitting(false);
    }
  }

  const loadingEdit =
    isEdit &&
    (product === undefined ||
      variantsResult === undefined ||
      inventoryResult === undefined);

  if (loadingEdit) {
    return (
      <main className="p-6 w-full">
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
            />
          ))}
        </div>
      </main>
    );
  }

  if (isEdit && product === null) {
    return (
      <main className="flex-1 overflow-y-auto p-8">
        <p className="text-sm text-slate-500">Product not found.</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/products")}>
          Back to products
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6 pb-24">
        {/* Title bar */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? "Edit product" : "New product"}
          </h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={() => router.push("/products")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-[44px] bg-burgundy-600 hover:bg-burgundy-700"
              disabled={submitting}
            >
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SECTION 1 — Basic Info */}
        <Section title="Basic information">
          <Field label="Title" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cotton T-Shirt"
              autoFocus
              className="min-h-[44px] text-base"
            />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product…"
              rows={4}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  if (v === NEW_CATEGORY) {
                    setNewCatOpen(true);
                    return;
                  }
                  setCategoryId(v);
                }}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value={NEW_CATEGORY}
                    className="font-medium text-burgundy-600"
                  >
                    + New category
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <div className="flex gap-2">
                {productStatus.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      "min-h-[44px] flex-1 rounded-lg border px-3 text-sm font-medium capitalize transition",
                      status === s
                        ? "border-burgundy-600 bg-burgundy-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* SECTION 2 — Pricing */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Selling price" required>
              <PriceInput
                currency={currency}
                value={sellingPrice}
                onChange={setSellingPrice}
                big
              />
            </Field>
            <Field label="Cost price">
              <PriceInput
                currency={currency}
                value={costPrice}
                onChange={setCostPrice}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tax rate">
              <Select value={taxRate} onValueChange={setTaxRate}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Select tax rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tax</SelectItem>
                  {taxRates.map((t) => (
                    <SelectItem key={t._id} value={String(t.rate)}>
                      {t.name} ({t.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Profit margin">
              <div className="flex min-h-[44px] items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 tabular-nums">
                {margin.toFixed(1)}%
              </div>
            </Field>
          </div>
        </Section>

        {/* SECTION 3 — Inventory */}
        <Section title="Inventory">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU">
              <div className="flex gap-2">
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU"
                  className="min-h-[44px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] shrink-0"
                  onClick={() => setSku(slugSku(name))}
                >
                  Generate
                </Button>
              </div>
            </Field>
            <Field label="Barcode">
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barcode"
                className="min-h-[44px]"
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Track inventory
              </p>
              <p className="text-xs text-slate-500">
                Off for services that don&apos;t affect stock.
              </p>
            </div>
            <Switch
              checked={trackInventory}
              onCheckedChange={setTrackInventory}
            />
          </div>

          {trackInventory && !hasVariants && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Current stock">
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="min-h-[44px]"
                />
              </Field>
              <Field label="Reorder point">
                <Input
                  type="number"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                  placeholder="0"
                  className="min-h-[44px]"
                />
              </Field>
            </div>
          )}
        </Section>

        {/* SECTION 4 — Variants */}
        <Section title="Variants">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                This product has variants
              </p>
              <p className="text-xs text-slate-500">
                e.g. sizes or colours, each with its own price and stock.
              </p>
            </div>
            <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
          </div>

          {hasVariants && (
            <div className="space-y-4">
              {/* Option builder */}
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-medium text-slate-700">
                  Generate from options
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Input
                      value={optName}
                      onChange={(e) => setOptName(e.target.value)}
                      placeholder="Option 1 name (e.g. Size)"
                      className="min-h-[44px]"
                    />
                    <Input
                      value={optValues}
                      onChange={(e) => setOptValues(e.target.value)}
                      placeholder="Values: S, M, L, XL"
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={opt2Name}
                      onChange={(e) => setOpt2Name(e.target.value)}
                      placeholder="Option 2 name (e.g. Colour)"
                      className="min-h-[44px]"
                    />
                    <Input
                      value={opt2Values}
                      onChange={(e) => setOpt2Values(e.target.value)}
                      placeholder="Values: Red, Blue"
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 min-h-[44px]"
                  onClick={generateVariants}
                >
                  Generate variants
                </Button>
              </div>

              {/* Variant rows */}
              {variantRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-400">
                        <th className="px-2 py-2 font-medium">Variant</th>
                        <th className="px-2 py-2 font-medium">SKU</th>
                        <th className="px-2 py-2 font-medium">Price</th>
                        <th className="px-2 py-2 font-medium">Stock</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {variantRows.map((row) => (
                        <tr key={row.key}>
                          <td className="px-2 py-1.5">
                            <Input
                              value={row.name}
                              onChange={(e) =>
                                updateRow(row.key, { name: e.target.value })
                              }
                              placeholder="e.g. S / Red"
                              className="min-h-[44px]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              value={row.sku}
                              onChange={(e) =>
                                updateRow(row.key, { sku: e.target.value })
                              }
                              className="min-h-[44px]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              value={row.price}
                              onChange={(e) =>
                                updateRow(row.key, { price: e.target.value })
                              }
                              placeholder={sellingPrice || "Base"}
                              className="min-h-[44px] w-24"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <Input
                              type="number"
                              value={row.stock}
                              onChange={(e) =>
                                updateRow(row.key, { stock: e.target.value })
                              }
                              placeholder="0"
                              className="min-h-[44px] w-20"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => removeRow(row.key)}
                              className="text-xs font-medium text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={addVariantRow}
              >
                Add variant row
              </Button>
            </div>
          )}
        </Section>

        {/* SECTION 5 — Images */}
        <Section title="Images">
          <div className="flex items-center gap-3">
            <ImageUploader
              label="Upload image"
              onUploaded={(url) => setImages((prev) => [...prev, url])}
            />
            <p className="text-xs text-slate-500">
              PNG or JPG. Upload as many as you like.
            </p>
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </form>

      {/* Inline "new category" modal */}
      <Modal open={newCatOpen} onClose={() => setNewCatOpen(false)}>
        <form onSubmit={handleCreateCategory} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-slate-900">New category</h2>
          <div className="space-y-1.5">
            <Label htmlFor="new-cat-name" className="text-sm text-slate-700">
              Category name<span className="ml-0.5 text-red-500">*</span>
            </Label>
            <Input
              id="new-cat-name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Apparel"
              autoFocus
              className="min-h-[44px]"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] flex-1"
              onClick={() => setNewCatOpen(false)}
              disabled={creatingCat}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-[44px] flex-1 bg-burgundy-600 hover:bg-burgundy-700"
              disabled={creatingCat || !newCatName.trim()}
            >
              {creatingCat ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-slate-700">
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

function PriceInput({
  currency,
  value,
  onChange,
  big,
}: {
  currency: string;
  value: string;
  onChange: (v: string) => void;
  big?: boolean;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
        {currency}
      </span>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className={cn(
          "min-h-[44px] pl-12 tabular-nums",
          big && "text-lg font-semibold",
        )}
      />
    </div>
  );
}
