"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
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
import { Button } from "@repo/ui/components/ui/button";

import { PermissionGuard } from "@/components/admin/module/permission-guard";

const storeSettingsSchema = z.object({
  store_name: z.string().min(1, "Store name is required"),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  receipt_header: z.string().optional(),
  receipt_footer: z.string().optional(),
  logo_url: z.string().optional(),
  allow_negative_stock: z.boolean(),
  require_customer_on_sale: z.boolean(),
});

type StoreSettingsValues = z.infer<typeof storeSettingsSchema>;

export default function StoreSettings() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const current = useQuery(api.settings.storeSettings.current);
  const upsert = useMutation(api.settings.storeSettings.upsert);

  const form = useForm<StoreSettingsValues>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      store_name: "",
      currency: "KES",
      timezone: "Africa/Nairobi",
      address: "",
      phone: "",
      email: "",
      receipt_header: "",
      receipt_footer: "",
      logo_url: "",
      allow_negative_stock: false,
      require_customer_on_sale: false,
    },
  });

  useEffect(() => {
    if (current) {
      form.reset({
        store_name: current.store_name,
        currency: current.currency,
        timezone: current.timezone,
        address: current.address ?? "",
        phone: current.phone ?? "",
        email: current.email ?? "",
        receipt_header: current.receipt_header ?? "",
        receipt_footer: current.receipt_footer ?? "",
        logo_url: current.logo_url ?? "",
        allow_negative_stock: current.allow_negative_stock,
        require_customer_on_sale: current.require_customer_on_sale,
      });
    }
  }, [current, form]);

  async function onSubmit(values: StoreSettingsValues) {
    setError(null);
    setSaved(false);
    try {
      await upsert({
        store_name: values.store_name,
        currency: values.currency,
        timezone: values.timezone,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        receipt_header: values.receipt_header || undefined,
        receipt_footer: values.receipt_footer || undefined,
        logo_url: values.logo_url || undefined,
        allow_negative_stock: values.allow_negative_stock,
        require_customer_on_sale: values.require_customer_on_sale,
      });
      setSaved(true);
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? (err.data as string)
          : "An unexpected error occurred. Please try again.";
      setError(message);
    }
  }

  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Store Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure your store details, receipts and selling rules.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Store Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="My Gift Shop" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="KES" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Africa/Nairobi" />
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
                    <Textarea {...field} placeholder="Store address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+254 700 000 000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        placeholder="store@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt_header"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Header</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Shown at the top of receipts"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receipt_footer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Footer</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Shown at the bottom of receipts"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allow_negative_stock"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <FormLabel>Allow Negative Stock</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Permit sales when stock would drop below zero.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="require_customer_on_sale"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <FormLabel>Require Customer On Sale</FormLabel>
                    <p className="text-muted-foreground text-xs">
                      Require selecting a customer before completing a sale.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && (
              <p className="text-sm text-green-600">Settings saved.</p>
            )}

            <PermissionGuard
              permission="settings:update"
              fallback={
                <p className="text-muted-foreground text-sm">
                  You do not have permission to edit store settings.
                </p>
              }
            >
              <div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </PermissionGuard>
          </form>
        </Form>
      </div>
    </main>
  );
}
