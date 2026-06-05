"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { purchaseOrderStatus } from "@repo/backend/validators";
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

function toDateInput(ts?: number): string {
  return ts ? new Date(ts).toISOString().slice(0, 10) : "";
}

const purchaseOrderFormSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  status: z.enum(purchaseOrderStatus),
  order_date: z.string().min(1, "Order date is required"),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  total_amount: z.number(),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Purchase Order",
  add: "Add Purchase Order",
  update: "Update Purchase Order",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View purchase order details.",
  add: "Fill in the details to create a purchase order.",
  update: "Update the purchase order details below.",
};

interface PurchaseOrderFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  purchaseOrder?: Doc<"purchase_orders">;
}

export function PurchaseOrderForm({
  open,
  onOpenChange,
  mode,
  purchaseOrder,
}: PurchaseOrderFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createOrder = useMutation(api.purchasing.purchaseOrders.create);
  const updateOrder = useMutation(api.purchasing.purchaseOrders.update);
  const suppliersResult = useQuery(api.purchasing.suppliers.list, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  const isViewMode = mode === "view";

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      supplier_id: "",
      status: "draft",
      order_date: toDateInput(Date.now()),
      expected_date: "",
      notes: "",
      total_amount: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        supplier_id: purchaseOrder?.supplier_id ?? "",
        status: purchaseOrder?.status ?? "draft",
        order_date: toDateInput(purchaseOrder?.order_date ?? Date.now()),
        expected_date: toDateInput(purchaseOrder?.expected_date),
        notes: purchaseOrder?.notes ?? "",
        total_amount: purchaseOrder?.total_amount ?? 0,
      });
      setError(null);
    }
  }, [open, purchaseOrder, mode, form]);

  async function onSubmit(values: PurchaseOrderFormValues) {
    try {
      const payload = {
        supplier_id: values.supplier_id as Id<"suppliers">,
        status: values.status,
        order_date: new Date(values.order_date).getTime(),
        expected_date: values.expected_date
          ? new Date(values.expected_date).getTime()
          : undefined,
        notes: values.notes || undefined,
        total_amount: values.total_amount,
      };
      if (mode === "add") {
        await createOrder(payload);
      } else if (mode === "update" && purchaseOrder) {
        await updateOrder({ id: purchaseOrder._id, ...payload });
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
          name="supplier_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isViewMode}
              >
                <FormControl className="w-full">
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(suppliersResult?.page ?? []).map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
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
                  {purchaseOrderStatus.map((s) => (
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="order_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" disabled={isViewMode} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="expected_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Date</FormLabel>
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
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Amount</FormLabel>
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

interface PurchaseOrderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder?: Doc<"purchase_orders">;
}

export function PurchaseOrderDelete({
  open,
  onOpenChange,
  purchaseOrder,
}: PurchaseOrderDeleteDialogProps) {
  const removeOrder = useMutation(api.purchasing.purchaseOrders.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Purchase Order"
      description="Are you sure you want to delete this purchase order"
      entityName={purchaseOrder ? `#${purchaseOrder._id.slice(-6)}` : undefined}
      onConfirm={async () => {
        if (!purchaseOrder) return;
        await removeOrder({ id: purchaseOrder._id });
      }}
    />
  );
}
