"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { supplierStatus } from "@repo/backend/validators";
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
import { DeleteMessage } from "@/components/admin/module/delete-message";

const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(supplierStatus),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Supplier",
  add: "Add Supplier",
  update: "Update Supplier",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View supplier details.",
  add: "Fill in the details to create a new supplier.",
  update: "Update the supplier details below.",
};

interface SupplierFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  supplier?: Doc<"suppliers">;
}

export function SupplierForm({
  open,
  onOpenChange,
  mode,
  supplier,
}: SupplierFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createSupplier = useMutation(api.purchasing.suppliers.create);
  const updateSupplier = useMutation(api.purchasing.suppliers.update);

  const isViewMode = mode === "view";

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contact_name: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: supplier?.name ?? "",
        contact_name: supplier?.contact_name ?? "",
        email: supplier?.email ?? "",
        phone: supplier?.phone ?? "",
        address: supplier?.address ?? "",
        notes: supplier?.notes ?? "",
        status: supplier?.status ?? "active",
      });
      setError(null);
    }
  }, [open, supplier, mode, form]);

  async function onSubmit(values: SupplierFormValues) {
    try {
      const payload = {
        name: values.name,
        contact_name: values.contact_name || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        status: values.status,
      };
      if (mode === "add") {
        await createSupplier(payload);
      } else if (mode === "update" && supplier) {
        await updateSupplier({ id: supplier._id, ...payload });
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
                  placeholder="Supplier name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isViewMode}
                  placeholder="Contact person"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    disabled={isViewMode}
                    placeholder="supplier@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isViewMode}
                    placeholder="+254 700 000 000"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={isViewMode}
                  placeholder="Optional address"
                />
              </FormControl>
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
                  {supplierStatus.map((s) => (
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

interface SupplierDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Doc<"suppliers">;
}

export function SupplierDelete({
  open,
  onOpenChange,
  supplier,
}: SupplierDeleteDialogProps) {
  const removeSupplier = useMutation(api.purchasing.suppliers.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Supplier"
      description="Are you sure you want to delete"
      entityName={supplier?.name}
      onConfirm={async () => {
        if (!supplier) return;
        await removeSupplier({ id: supplier._id });
      }}
    />
  );
}
