"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { customerStatus } from "@repo/backend/validators";
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

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(customerStatus),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Customer",
  add: "Add Customer",
  update: "Update Customer",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View customer details.",
  add: "Fill in the details to create a new customer.",
  update: "Update the customer details below.",
};

interface CustomerFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  customer?: Doc<"customers">;
}

export function CustomerForm({
  open,
  onOpenChange,
  mode,
  customer,
}: CustomerFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createCustomer = useMutation(api.crm.customers.create);
  const updateCustomer = useMutation(api.crm.customers.update);

  const isViewMode = mode === "view";

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
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
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
        notes: customer?.notes ?? "",
        status: customer?.status ?? "active",
      });
      setError(null);
    }
  }, [open, customer, mode, form]);

  async function onSubmit(values: CustomerFormValues) {
    try {
      const base = {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        address: values.address || undefined,
        notes: values.notes || undefined,
        status: values.status,
      };
      if (mode === "add") {
        await createCustomer({ ...base, total_spend: 0, visit_count: 0 });
      } else if (mode === "update" && customer) {
        await updateCustomer({
          id: customer._id,
          ...base,
          total_spend: customer.total_spend,
          visit_count: customer.visit_count,
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
                  placeholder="Customer name"
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
                    placeholder="customer@example.com"
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
                  {customerStatus.map((s) => (
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

interface CustomerDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Doc<"customers">;
}

export function CustomerDelete({
  open,
  onOpenChange,
  customer,
}: CustomerDeleteDialogProps) {
  const removeCustomer = useMutation(api.crm.customers.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Customer"
      description="Are you sure you want to delete"
      entityName={customer?.name}
      onConfirm={async () => {
        if (!customer) return;
        await removeCustomer({ id: customer._id });
      }}
    />
  );
}
