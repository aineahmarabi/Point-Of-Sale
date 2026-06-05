"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { productStatus } from "@repo/backend/validators";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Switch } from "@repo/ui/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { FormSheet, type FormSheetMode } from "@/components/admin/module/form-sheet";
import { DeleteMessage } from "@/components/admin/module/delete-message";

const NO_CATEGORY = "none";

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string(),
  cost_price: z.number(),
  selling_price: z.number(),
  unit: z.string().optional(),
  tax_rate: z.number().optional(),
  status: z.enum(productStatus),
  is_service: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Product",
  add: "Add Product",
  update: "Update Product",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View product details.",
  add: "Fill in the details to create a new product.",
  update: "Update the product details below.",
};

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  product?: Doc<"products">;
}

export function ProductForm({
  open,
  onOpenChange,
  mode,
  product,
}: ProductFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createProduct = useMutation(api.catalog.products.create);
  const updateProduct = useMutation(api.catalog.products.update);
  const categoriesResult = useQuery(api.catalog.categories.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const isViewMode = mode === "view";

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      barcode: "",
      category_id: NO_CATEGORY,
      cost_price: 0,
      selling_price: 0,
      unit: "",
      tax_rate: undefined,
      status: "draft",
      is_service: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: product?.name ?? "",
        description: product?.description ?? "",
        sku: product?.sku ?? "",
        barcode: product?.barcode ?? "",
        category_id: product?.category_id ?? NO_CATEGORY,
        cost_price: product?.cost_price ?? 0,
        selling_price: product?.selling_price ?? 0,
        unit: product?.unit ?? "",
        tax_rate: product?.tax_rate ?? undefined,
        status: product?.status ?? "draft",
        is_service: product?.is_service ?? false,
      });
      setError(null);
    }
  }, [open, product, mode, form]);

  async function onSubmit(values: ProductFormValues) {
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        sku: values.sku || undefined,
        barcode: values.barcode || undefined,
        category_id:
          values.category_id && values.category_id !== NO_CATEGORY
            ? (values.category_id as Id<"categories">)
            : undefined,
        cost_price: values.cost_price,
        selling_price: values.selling_price,
        unit: values.unit || undefined,
        tax_rate: values.tax_rate,
        status: values.status,
        is_service: values.is_service,
        images: product?.images ?? [],
      };
      if (mode === "add") {
        await createProduct(payload);
      } else if (mode === "update" && product) {
        await updateProduct({ id: product._id, ...payload });
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isViewMode}
                  placeholder="Product name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isViewMode}
                  placeholder="Optional description"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isViewMode} placeholder="SKU" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Barcode</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="Barcode"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isViewMode}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                  {(categoriesResult?.page ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cost_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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
            name="selling_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="e.g. piece"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tax_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isViewMode}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productStatus.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
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
            name="is_service"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Service</FormLabel>
                <FormControl>
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isViewMode}
                    />
                    <span className="text-muted-foreground ml-2 text-xs">
                      Does not affect stock
                    </span>
                  </div>
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

interface ProductDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Doc<"products">;
}

export function ProductDelete({
  open,
  onOpenChange,
  product,
}: ProductDeleteDialogProps) {
  const removeProduct = useMutation(api.catalog.products.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Product"
      description="Are you sure you want to delete"
      entityName={product?.name}
      onConfirm={async () => {
        if (!product) return;
        await removeProduct({ id: product._id });
      }}
    />
  );
}
