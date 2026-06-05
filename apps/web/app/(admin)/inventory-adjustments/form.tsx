"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { adjustmentReasons } from "@repo/backend/validators";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { FormSheet, type FormSheetMode } from "@/components/admin/module/form-sheet";

const adjustmentFormSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity_change: z.number(),
  reason: z.enum(adjustmentReasons),
  notes: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Adjustment",
  add: "New Adjustment",
  update: "Adjustment",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View stock adjustment details.",
  add: "Record a stock adjustment. This cannot be edited later.",
  update: "Adjustments are an audit trail and cannot be edited.",
};

interface AdjustmentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  adjustment?: Doc<"inventory_adjustments">;
}

export function AdjustmentForm({
  open,
  onOpenChange,
  mode,
  adjustment,
}: AdjustmentFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createAdjustment = useMutation(api.catalog.inventoryAdjustments.create);
  const productsResult = useQuery(api.catalog.products.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const isViewMode = mode === "view";

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      product_id: "",
      quantity_change: 0,
      reason: "received",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        product_id: adjustment?.product_id ?? "",
        quantity_change: adjustment?.quantity_change ?? 0,
        reason: adjustment?.reason ?? "received",
        notes: adjustment?.notes ?? "",
      });
      setError(null);
    }
  }, [open, adjustment, mode, form]);

  async function onSubmit(values: AdjustmentFormValues) {
    try {
      if (mode === "add") {
        await createAdjustment({
          product_id: values.product_id as Id<"products">,
          quantity_change: values.quantity_change,
          reason: values.reason,
          notes: values.notes || undefined,
        });
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
          name="quantity_change"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity Change</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  disabled={isViewMode}
                  placeholder="e.g. -3 or 10"
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
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isViewMode}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {adjustmentReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isViewMode}
                  placeholder="Optional notes"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormSheet>
  );
}
