---
description: "Scaffold a full admin module: page with DataTable, columns, form with CRUD, and filters. Use when adding a new module page to apps/admin."
agent: "agent"
argument-hint: "<module-name> <convex-table> [view, create, update, remove] [filters: name, status, ...]"
---

Scaffold a complete admin module from the specification below.

**Input spec:** $input

## Parsing Rules

Extract from the spec:

- **Module name** — the first word (e.g. `products`). This becomes the folder name under the route group and the display name (capitalised).
- **Convex table** — the second word (e.g. `products`). This is the Convex table name used for `Doc<"tableName">`, `api.<folder>.<tableName>.list`, etc.
- **Route group** — the words after `in` (e.g. `in data` → `(data)`). If omitted, default to `(data)`.
- **CRUD operations** — an array like `[view, create, update, remove]`. If not mentioned, default to all four. This controls:
  - `view` → view mode in `FormSheet`, `onView` callback, `handleView`
  - `create` → "New" button in toolbar, `add` mode in `FormSheet`, `handleNew`, create mutation
  - `update` → `onEdit` callback, `update` mode in `FormSheet`, update mutation
  - `remove` → `onDelete` callback, `DeleteMessage`, remove mutation
- **Filters** — an array like `[name, status]`. If not mentioned, default to no filters. Each filter maps to a UI element:

### Filter type inference

| Filter field | UI element           | Behaviour                                                                                                                                      |
| ------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`       | `<Input>` search box | Stores value in `columnFilters` under id `"name"`, activates search when ≥ 3 characters, passes `search` arg to `api.*.list` and `api.*.count` |
| `status`     | `<Select>` dropdown  | Import the enum array from `@repo/backend/validators`, render as SelectItems, pass `status` arg to `api.*.list` and `api.*.count`              |
| `role`       | `<Select>` dropdown  | Same pattern as status — import enum, render dropdown                                                                                          |
| `type`       | `<Select>` dropdown  | Same pattern as status — import enum, render dropdown                                                                                          |
| `is_active`  | `<Select>` dropdown  | Options: "All" / "Active" / "Inactive", pass boolean filter                                                                                    |
| Other        | `<Select>` dropdown  | If the field has known enum values in `validators.ts`, use them. Otherwise use `<Input>`.                                                      |

## Pre-flight

Before generating code:

1. Read [packages/backend/convex/validators.ts](../../packages/backend/convex/validators.ts) to find the table shape and enum arrays.
2. Read the Convex functions file for the table (e.g. `packages/backend/convex/data/<table>.ts` or `packages/backend/convex/<table>.ts`) to find the API path and available functions (`list`, `count`, `create`, `update`, `remove`).
3. Read the existing samples module as a reference:
   - [apps/admin/app/(modules)/(data)/samples/page.tsx](<../../apps/admin/app/(modules)/(data)/samples/page.tsx>)
   - [apps/admin/app/(modules)/(data)/samples/columns.tsx](<../../apps/admin/app/(modules)/(data)/samples/columns.tsx>)
   - [apps/admin/app/(modules)/(data)/samples/form.tsx](<../../apps/admin/app/(modules)/(data)/samples/form.tsx>)
4. Read the shared module components:
   - [apps/admin/components/module/data-table.tsx](../../apps/admin/components/module/data-table.tsx)
   - [apps/admin/components/module/actions-cell.tsx](../../apps/admin/components/module/actions-cell.tsx)
   - [apps/admin/components/module/form-sheet.tsx](../../apps/admin/components/module/form-sheet.tsx)
   - [apps/admin/components/module/delete-message.tsx](../../apps/admin/components/module/delete-message.tsx)
   - [apps/admin/components/module/permission-guard.tsx](../../apps/admin/components/module/permission-guard.tsx)

## Output Structure

Create 3 files at `apps/admin/app/(modules)/(<routeGroup>)/<module-name>/`:

```
<module-name>/
  page.tsx        # Page component with DataTable, filters, and CRUD state
  columns.tsx     # TanStack column definitions + ActionsCell
  form.tsx        # Module-specific Form + Delete wrappers
```

---

## File 1 — `page.tsx`

A `"use client"` default export component that follows the samples page pattern exactly.

### Imports

```tsx
import { useState, useCallback, useRef, useMemo } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
// Import enum arrays from @repo/backend/validators for any dropdown filters
import { DataTable } from "@/components/module/data-table";
import { PermissionGuard } from "@/components/module/permission-guard";
// Import UI components only for the filters being used (Input, Select, Button)
import { getColumns } from "./columns";
// Import the module-specific Form and Delete
```

### State management

- `page`, `pageSize`, `columnFilters`, `showCount`, `cursorsRef` — always present for pagination.
- `sheetOpen`, `sheetMode`, `selectedRecord` — only if any of `[view, create, update]` are in CRUD.
- `deleteDialogOpen`, `recordToDelete` — only if `remove` is in CRUD.

### FormSheetMode type

Define based on which CRUD operations are enabled:

- All four → `type FormSheetMode = "view" | "add" | "update";`
- No create → `type FormSheetMode = "view" | "update";`
- Only view → `type FormSheetMode = "view";`
- Omit the type entirely if no view/create/update.

### Handlers

Only include handlers for the enabled CRUD operations:

- `handleNew` → only if `create` is enabled
- `handleView` → only if `view` is enabled
- `handleEdit` → only if `update` is enabled
- `handleDelete` → only if `remove` is enabled

### getColumns call

Pass only the enabled action callbacks to `getColumns`:

```tsx
const columns = useMemo(
  () =>
    getColumns({
      ...(viewEnabled && { onView: handleView }),
      ...(editEnabled && { onEdit: handleEdit }),
      ...(deleteEnabled && { onDelete: handleDelete }),
    }),
  [
    /* only the included handlers */
  ],
);
```

### Convex queries

```tsx
// Derive filter values from columnFilters state
const search = (columnFilters.find((f) => f.id === "name")?.value as string) || undefined;
const activeSearch = search && search.length >= 3 ? search : undefined;

// For each dropdown filter:
const status = columnFilters.find((f) => f.id === "status")?.value as Doc<"tableName">["status"] | undefined;

// Cursor-based pagination
const cursorKey = `${pageSize}-${page}`;
const cursor = page === 1 ? null : (cursorsRef.current.get(cursorKey) ?? null);

const result = useQuery(api.<folder>.<table>.list, {
  paginationOpts: { numItems: pageSize, cursor },
  ...(activeSearch ? { search: activeSearch } : {}),
  ...(status ? { status } : {}),
});

const totalCount = useQuery(
  api.<folder>.<table>.count,
  showCount ? { /* same filters minus paginationOpts */ } : "skip",
);
```

### Filter change handlers

For each filter, create a `useCallback` handler that:

1. Updates `columnFilters` state
2. Calls `resetPagination()`
3. Calls `setShowCount(false)`

### Toolbar JSX

Render in a `<div className="flex shrink-0 items-center gap-4 px-8 py-4">`:

- For `name` filter → `<Input placeholder="Search by name..." ... className="max-w-sm" />`
- For enum filters → `<Select>` with "All ..." default + enum values capitalised
- If `create` is enabled → wrap with `<PermissionGuard permission="<module>:create">` around `<div className="ml-auto"><Button onClick={handleNew}>New</Button></div>`

### DataTable + Dialogs

```tsx
<DataTable
  columns={columns}
  data={result?.page ?? []}
  page={page}
  pageSize={pageSize}
  pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
  totalPages={totalPages}
  totalCount={totalCount ?? null}
  isDone={result?.isDone ?? false}
  isLoading={result === undefined}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  onRequestCount={() => setShowCount(true)}
  columnFilters={columnFilters}
  hiddenOnMobile={
    [
      /* columns to hide on mobile */
    ]
  }
/>
```

- Render `<SingularForm>` only if any of `[view, create, update]` are enabled.
- Render `<SingularDelete>` only if `remove` is enabled.

---

## File 2 — `columns.tsx`

A `"use client"` file that exports `getColumns(actions)`.

### Imports

```tsx
import type { ColumnDef } from "@tanstack/react-table";
import type { Doc } from "@repo/backend/dataModel";
import { ActionsCell } from "@/components/module/actions-cell";
// Import Image from "next/image" and placeholder from "@repo/assets/images" if table has image field
```

### Type and interface

```tsx
type ModuleRow = Doc<"tableName"> & { image_url?: string | null }; // add image_url if table has image field

interface ActionCallbacks {
  onView?: (row: ModuleRow) => void; // optional if view not in CRUD
  onEdit?: (row: ModuleRow) => void; // optional if update not in CRUD
  onDelete?: (row: ModuleRow) => void; // optional if remove not in CRUD
}
```

### Column definitions

Generate a `ColumnDef<ModuleRow>[]` array based on the table fields from `validators.ts`. Apply these cell rendering rules:

| Field type                        | Cell rendering                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `image` / `image_url`             | `<Image>` with placeholder fallback, 40×40, `rounded-md object-cover`                                                                       |
| `name` (string)                   | Plain text (default)                                                                                                                        |
| `name` (object `{first, last}`)   | `${name.first} ${name.last}`                                                                                                                |
| `status` / `role` / `type` (enum) | Coloured badge: `<span className="rounded-full px-2 py-1 text-xs font-medium capitalize ...">` with a `Record<EnumValue, string>` style map |
| `is_active` / boolean             | Green/red badge: "Active" / "Inactive"                                                                                                      |
| `price` / `amount` / currency     | Right-aligned, formatted with `Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" })`                                          |
| `quantity` / number               | Right-aligned, plain number                                                                                                                 |
| `email`                           | Plain text                                                                                                                                  |
| `phone`                           | Plain text with `?? "—"` fallback                                                                                                           |
| Optional fields                   | Show `"—"` fallback for undefined                                                                                                           |

Always end with the actions column:

```tsx
{
  id: "actions",
  header: () => <div className="text-right">Actions</div>,
  cell: ({ row }) => (
    <ActionsCell
      row={row.original}
      module="<module-name>"
      onView={actions.onView}
      onEdit={actions.onEdit}
      onDelete={actions.onDelete}
    />
  ),
},
```

Only pass the callbacks that are enabled. If none are enabled, omit the actions column entirely.

---

## File 3 — `form.tsx` (form-sheet)

A `"use client"` file that exports `<SingularForm>` and optionally `<SingularDelete>`.

### Skip this file entirely if CRUD is empty (no view, create, update, or remove).

### `<SingularForm>` — only if any of `[view, create, update]` are enabled

Follow this exact structure:

1. **Zod schema** — Define a `z.object({...})` matching the table fields. Use `z.enum()` for enum fields with the imported const array. Exclude `slug`, `image`, `images`, and auto-generated fields.
2. **Title/Description maps** — `Record<FormSheetMode, string>` for only the enabled modes.
3. **Component** — Uses `react-hook-form` with `zodResolver`, `useMutation` for enabled mutations, `useEffect` to reset the form on open, and wraps form fields inside the shared `<FormSheet>` component.
4. **Form fields** — Build `<FormField>` elements for each editable field. Use the field type inference:

| Field type             | Form element                                                              |
| ---------------------- | ------------------------------------------------------------------------- |
| `string` (name, email) | `<Input>` with placeholder                                                |
| `string` (description) | `<Textarea>` with placeholder                                             |
| `number` (price)       | `<Input type="number" step="1.00">` with manual `onChange` → `parseFloat` |
| `number` (quantity)    | `<Input type="number" step="1">` with manual `onChange` → `parseFloat`    |
| `enum` (status, role)  | `<Select>` with imported enum values, capitalised labels                  |
| `boolean` (is_active)  | `<Select>` with "Active" / "Inactive" options                             |
| `v.id("table")`        | Usually hidden or auto-set — do not render as a form field                |

All fields should be `disabled={isViewMode}` when mode is `"view"`.

### `<SingularDelete>` — only if `remove` is enabled

```tsx
export function SingularDelete({ open, onOpenChange, record }: Props) {
  const removeRecord = useMutation(api.<folder>.<table>.remove);
  return (
    <DeleteMessage
      open={open}
      onOpenChange={onOpenChange}
      title="Delete <Singular>"
      description="Are you sure you want to delete"
      entityName={record?.name} // use best display field
      onConfirm={async () => {
        if (!record) return;
        await removeRecord({ id: record._id });
      }}
    />
  );
}
```

---

## Naming Conventions

| Concept                 | Pattern                                                  | Example (module: `products`, table: `products`) |
| ----------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Folder                  | `apps/admin/app/(modules)/(<routeGroup>)/<module-name>/` | `(modules)/(data)/products/`                    |
| Page component          | `export default function <ModulePascal>()`               | `Products`                                      |
| Row type                | `type <Singular> = Doc<"table"> & { image_url?: ... }`   | `Product`                                       |
| Form component          | `<Singular>Form`                                         | `ProductForm`                                   |
| Delete wrapper          | `<Singular>Delete`                                       | `ProductDelete`                                 |
| State: selected record  | `selected<Singular>`                                     | `selectedProduct`                               |
| State: record to delete | `<singular>ToDelete`                                     | `productToDelete`                               |
| Zod schema              | `<singular>FormSchema`                                   | `productFormSchema`                             |
| Form values type        | `<Singular>FormValues`                                   | `ProductFormValues`                             |

---

## Validation Checklist

Before finishing, verify:

- [ ] `page.tsx` — default export, `"use client"`, correct API path (`api.<folder>.<table>.list`/`.count`)
- [ ] `page.tsx` — only handlers/state/UI for enabled CRUD operations
- [ ] `page.tsx` — only filter UI for requested filters
- [ ] `page.tsx` — all filter handlers call `resetPagination()` and `setShowCount(false)`
- [ ] `page.tsx` — "New" button only rendered if `create` is in CRUD
- [ ] `columns.tsx` — ActionsCell only passes enabled callbacks
- [ ] `columns.tsx` — column cell renderers match field types from `validators.ts`
- [ ] `form.tsx` — Zod schema matches table fields (excluding slug, image fields)
- [ ] `form.tsx` — only enabled mutations imported and called
- [ ] `form.tsx` — `<SingularDelete>` only exported if `remove` is enabled
- [ ] All imports use `@/components/module/*` for shared components
- [ ] All imports use `@repo/backend` for API and types, `@repo/backend/validators` for enums
- [ ] `page.tsx` — "New" button wrapped with `<PermissionGuard permission="<module>:create">`
- [ ] `columns.tsx` — `ActionsCell` includes `module="<module-name>"` prop
- [ ] No `any` types — strict TypeScript
- [ ] Follows kebab-case file naming
