"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { discountTypes, discountAppliesTo } from "@repo/backend/validators";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@repo/ui/components/ui/form";
import { Input } from "@repo/ui/components/ui/input";
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

function toDateInput(ts?: number): string {
  return ts ? new Date(ts).toISOString().slice(0, 10) : "";
}

const discountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  type: z.enum(discountTypes),
  value: z.number(),
  min_order_amount: z.number().optional(),
  applies_to: z.enum(discountAppliesTo),
  is_active: z.boolean(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  usage_limit: z.number().optional(),
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Discount",
  add: "Add Discount",
  update: "Update Discount",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View discount details.",
  add: "Fill in the details to create a new discount.",
  update: "Update the discount details below.",
};

interface DiscountFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  discount?: Doc<"discounts">;
}

export function DiscountForm({
  open,
  onOpenChange,
  mode,
  discount,
}: DiscountFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createDiscount = useMutation(api.promotions.discounts.create);
  const updateDiscount = useMutation(api.promotions.discounts.update);

  const isViewMode = mode === "view";

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "percentage",
      value: 0,
      min_order_amount: undefined,
      applies_to: "cart",
      is_active: true,
      start_date: "",
      end_date: "",
      usage_limit: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: discount?.name ?? "",
        code: discount?.code ?? "",
        type: discount?.type ?? "percentage",
        value: discount?.value ?? 0,
        min_order_amount: discount?.min_order_amount ?? undefined,
        applies_to: discount?.applies_to ?? "cart",
        is_active: discount?.is_active ?? true,
        start_date: toDateInput(discount?.start_date),
        end_date: toDateInput(discount?.end_date),
        usage_limit: discount?.usage_limit ?? undefined,
      });
      setError(null);
    }
  }, [open, discount, mode, form]);

  async function onSubmit(values: DiscountFormValues) {
    try {
      const base = {
        name: values.name,
        code: values.code || undefined,
        type: values.type,
        value: values.value,
        min_order_amount: values.min_order_amount,
        applies_to: values.applies_to,
        is_active: values.is_active,
        start_date: values.start_date
          ? new Date(values.start_date).getTime()
          : undefined,
        end_date: values.end_date
          ? new Date(values.end_date).getTime()
          : undefined,
        usage_limit: values.usage_limit,
      };
      if (mode === "add") {
        await createDiscount({ ...base, usage_count: 0 });
      } else if (mode === "update" && discount) {
        await updateDiscount({
          id: discount._id,
          ...base,
          usage_count: discount.usage_count,
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isViewMode}
                  placeholder="Discount name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="Optional coupon code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isViewMode}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {discountTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
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
            name="min_order_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Order Amount</FormLabel>
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
            name="applies_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Applies To</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isViewMode}
                >
                  <FormControl className="w-full">
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {discountAppliesTo.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a.charAt(0).toUpperCase() + a.slice(1)}
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
            name="usage_limit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usage Limit</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isViewMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isViewMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Active</FormLabel>
              <FormControl>
                <div className="flex h-9 items-center">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isViewMode}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Form>
    </FormSheet>
  );
}

interface DiscountDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Doc<"discounts">;
}

export function DiscountDelete({
  open,
  onOpenChange,
  discount,
}: DiscountDeleteDialogProps) {
  const removeDiscount = useMutation(api.promotions.discounts.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Discount"
      description="Are you sure you want to delete"
      entityName={discount?.name}
      onConfirm={async () => {
        if (!discount) return;
        await removeDiscount({ id: discount._id });
      }}
    />
  );
}
