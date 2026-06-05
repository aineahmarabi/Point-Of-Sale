"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { FormSheet, type FormSheetMode } from "@/components/admin/module/form-sheet";

const NO_VARIANT = "none";

const inventoryFormSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  variant_id: z.string(),
  quantity: z.number(),
  reorder_point: z.number(),
  reorder_quantity: z.number(),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Stock",
  add: "Add Stock Record",
  update: "Adjust Stock",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View stock record details.",
  add: "Create a stock record for a product.",
  update: "Update stock levels for this product.",
};

interface InventoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  inventory?: Doc<"inventory">;
}

export function InventoryForm({
  open,
  onOpenChange,
  mode,
  inventory,
}: InventoryFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createInventory = useMutation(api.catalog.inventory.create);
  const updateInventory = useMutation(api.catalog.inventory.update);
  const productsResult = useQuery(api.catalog.products.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const isViewMode = mode === "view";

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      product_id: "",
      variant_id: NO_VARIANT,
      quantity: 0,
      reorder_point: 0,
      reorder_quantity: 0,
    },
  });

  const selectedProduct = form.watch("product_id");
  const variantsResult = useQuery(
    api.catalog.variants.list,
    selectedProduct
      ? {
          paginationOpts: { numItems: 100, cursor: null },
          product_id: selectedProduct as Id<"products">,
        }
      : "skip",
  );

  useEffect(() => {
    if (open) {
      form.reset({
        product_id: inventory?.product_id ?? "",
        variant_id: inventory?.variant_id ?? NO_VARIANT,
        quantity: inventory?.quantity ?? 0,
        reorder_point: inventory?.reorder_point ?? 0,
        reorder_quantity: inventory?.reorder_quantity ?? 0,
      });
      setError(null);
    }
  }, [open, inventory, mode, form]);

  async function onSubmit(values: InventoryFormValues) {
    try {
      const payload = {
        product_id: values.product_id as Id<"products">,
        variant_id:
          values.variant_id && values.variant_id !== NO_VARIANT
            ? (values.variant_id as Id<"variants">)
            : undefined,
        quantity: values.quantity,
        reorder_point: values.reorder_point,
        reorder_quantity: values.reorder_quantity,
      };
      if (mode === "add") {
        await createInventory(payload);
      } else if (mode === "update" && inventory) {
        await updateInventory({ id: inventory._id, ...payload });
      }
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ConvexError
          ? (error.data as string)
          : "An unexpected error occurred. Please try again.";
      setError(message);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      title={TITLE_MAP[mode]}
      description={DESCRIPTION_MAP[mode]}
      isSubmitting={form.formState.isSubmitting}
      error={error}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Form {...form}>
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isViewMode}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(productsResult?.page ?? []).map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="variant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Variant</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isViewMode || !selectedProduct}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="No variant" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_VARIANT}>No variant</SelectItem>
                  {(variantsResult?.page ?? []).map((variant) => (
                    <SelectItem key={variant._id} value={variant._id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  disabled={isViewMode}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? undefined
                        : e.target.valueAsNumber,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reorder_point"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Point</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isViewMode}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reorder_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={isViewMode}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ""
                          ? undefined
                          : e.target.valueAsNumber,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </FormSheet>
  );
}
