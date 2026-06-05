"use client";

import { useParams } from "next/navigation";
import type { Id } from "@repo/backend/dataModel";

import { ProductFormPage } from "../../product-form-page";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProductFormPage mode="edit" productId={params.id as Id<"products">} />
  );
}
