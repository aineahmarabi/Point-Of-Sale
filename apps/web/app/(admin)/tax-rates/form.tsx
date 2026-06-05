"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { taxRateStatus } from "@repo/backend/validators";
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

const taxRateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.number(),
  is_inclusive: z.boolean(),
  is_default: z.boolean(),
  status: z.enum(taxRateStatus),
});

type TaxRateFormValues = z.infer<typeof taxRateFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Tax Rate",
  add: "Add Tax Rate",
  update: "Update Tax Rate",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View tax rate details.",
  add: "Fill in the details to create a new tax rate.",
  update: "Update the tax rate details below.",
};

interface TaxRateFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  taxRate?: Doc<"tax_rates">;
}

export function TaxRateForm({
  open,
  onOpenChange,
  mode,
  taxRate,
}: TaxRateFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createTaxRate = useMutation(api.settings.taxRates.create);
  const updateTaxRate = useMutation(api.settings.taxRates.update);

  const isViewMode = mode === "view";

  const form = useForm<TaxRateFormValues>({
    resolver: zodResolver(taxRateFormSchema),
    defaultValues: {
      name: "",
      rate: 0,
      is_inclusive: false,
      is_default: false,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: taxRate?.name ?? "",
        rate: taxRate?.rate ?? 0,
        is_inclusive: taxRate?.is_inclusive ?? false,
        is_default: taxRate?.is_default ?? false,
        status: taxRate?.status ?? "active",
      });
      setError(null);
    }
  }, [open, taxRate, mode, form]);

  async function onSubmit(values: TaxRateFormValues) {
    try {
      const payload = {
        name: values.name,
        rate: values.rate,
        is_inclusive: values.is_inclusive,
        is_default: values.is_default,
        status: values.status,
      };
      if (mode === "add") {
        await createTaxRate(payload);
      } else if (mode === "update" && taxRate) {
        await updateTaxRate({ id: taxRate._id, ...payload });
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
                  placeholder="e.g. VAT"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rate (%)</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_inclusive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inclusive</FormLabel>
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
          <FormField
            control={form.control}
            name="is_default"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default</FormLabel>
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
        </div>

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
                  {taxRateStatus.map((s) => (
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
      </Form>
    </FormSheet>
  );
}

interface TaxRateDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taxRate?: Doc<"tax_rates">;
}

export function TaxRateDelete({
  open,
  onOpenChange,
  taxRate,
}: TaxRateDeleteDialogProps) {
  const removeTaxRate = useMutation(api.settings.taxRates.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Tax Rate"
      description="Are you sure you want to delete"
      entityName={taxRate?.name}
      onConfirm={async () => {
        if (!taxRate) return;
        await removeTaxRate({ id: taxRate._id });
      }}
    />
  );
}
