"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { categoryStatus } from "@repo/backend/validators";
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

const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(categoryStatus),
  display_order: z.number(),
  image: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const TITLE_MAP: Record<FormSheetMode, string> = {
  view: "View Category",
  add: "Add Category",
  update: "Update Category",
};

const DESCRIPTION_MAP: Record<FormSheetMode, string> = {
  view: "View category details.",
  add: "Fill in the details to create a new category.",
  update: "Update the category details below.",
};

interface CategoryFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: FormSheetMode;
  category?: Doc<"categories">;
}

export function CategoryForm({
  open,
  onOpenChange,
  mode,
  category,
}: CategoryFormSheetProps) {
  const [error, setError] = useState<string | null>(null);
  const createCategory = useMutation(api.catalog.categories.create);
  const updateCategory = useMutation(api.catalog.categories.update);

  const isViewMode = mode === "view";

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      display_order: 0,
      image: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? "",
        description: category?.description ?? "",
        status: category?.status ?? "active",
        display_order: category?.display_order ?? 0,
        image: category?.image ?? "",
      });
      setError(null);
    }
  }, [open, category, mode, form]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        status: values.status,
        display_order: values.display_order,
        image: values.image || undefined,
      };
      if (mode === "add") {
        await createCategory(payload);
      } else if (mode === "update" && category) {
        await updateCategory({ id: category._id, ...payload });
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
                  placeholder="Category name"
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
                    {categoryStatus.map((s) => (
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
            name="display_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
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

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={isViewMode}
                  placeholder="https://..."
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

interface CategoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Doc<"categories">;
}

export function CategoryDelete({
  open,
  onOpenChange,
  category,
}: CategoryDeleteDialogProps) {
  const removeCategory = useMutation(api.catalog.categories.remove);

  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Category"
      description="Are you sure you want to delete"
      entityName={category?.name}
      onConfirm={async () => {
        if (!category) return;
        await removeCategory({ id: category._id });
      }}
    />
  );
}
