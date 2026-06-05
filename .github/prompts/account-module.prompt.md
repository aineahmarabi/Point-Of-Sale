---
description: "Scaffold a full account module: page with shadcn Table, form with CRUD, and filters. Use when adding a new module page to apps/web/app/account."
agent: "agent"
argument-hint: "<module-name> <convex-table> [view, create, update, remove] [filters: name, status, ...]"
---

Scaffold a complete account module for the web app from the specification below.

**Input spec:** $input

## Parsing Rules

Extract from the spec:

- **Module name** — the first word (e.g. `samples`). This becomes the folder name under `apps/web/app/account/` and the display name (capitalised).
- **Convex table** — the second word (e.g. `samples`). This is the Convex table name used for `Doc<"tableName">`, `api.<folder>.<tableName>.listByUser`, etc.
- **CRUD operations** — an array like `[view, create, update, remove]`. If not mentioned, default to all four. This controls:
  - `view` → view mode in `FormSheet`, `onView` callback, `handleView`
  - `create` → "New" button in toolbar, `add` mode in `FormSheet`, `handleNew`, create mutation
  - `update` → `onEdit` callback, `update` mode in `FormSheet`, update mutation
  - `remove` → `onDelete` callback, `DeleteMessage`, remove mutation
- **Filters** — an array like `[name, status]`. If not mentioned, default to no filters. Each filter maps to a UI element:

### Filter type inference

| Filter field | UI element           | Behaviour                                                                   |
| ------------ | -------------------- | --------------------------------------------------------------------------- |
| `name`       | `<Input>` search box | Stores value in local `search` state, activates when ≥ 3 chars              |
| `status`     | `<Select>` dropdown  | Import enum array from `@repo/backend/validators`, render as SelectItems    |
| `role`       | `<Select>` dropdown  | Same pattern as status — import enum, render dropdown                       |
| `type`       | `<Select>` dropdown  | Same pattern as status — import enum, render dropdown                       |
| `is_active`  | `<Select>` dropdown  | Options: "All" / "Active" / "Inactive", pass boolean filter                 |
| Other        | `<Select>` dropdown  | If the field has known enum values in `validators.ts`, use them. Else Input |

## Pre-flight

Before generating code:

1. Read [packages/backend/convex/validators.ts](../../packages/backend/convex/validators.ts) to find the table shape and enum arrays.
2. Read the Convex functions file for the table (e.g. `packages/backend/convex/data/<table>.ts`) to find the API path and available functions (`listByUser`, `create`, `update`, `remove`).
3. Read the existing account samples module as a reference:
   - [apps/web/app/account/samples/page.tsx](../../apps/web/app/account/samples/page.tsx)
   - [apps/web/app/account/samples/form.tsx](../../apps/web/app/account/samples/form.tsx)
4. Read the shared module components:
   - [apps/web/components/module/actions-cell.tsx](../../apps/web/components/module/actions-cell.tsx)
   - [apps/web/components/module/form-sheet.tsx](../../apps/web/components/module/form-sheet.tsx)
   - [apps/web/components/module/delete-message.tsx](../../apps/web/components/module/delete-message.tsx)
   - [apps/web/components/module/permission-guard.tsx](../../apps/web/components/module/permission-guard.tsx)

## Output Structure

Create 2 files at `apps/web/app/account/<module-name>/`:

```
<module-name>/
  page.tsx        # Page component with shadcn Table, filters, pagination, and CRUD state
  form.tsx        # Module-specific Form + Delete wrappers
```

---

## File 1 — `page.tsx`

A `"use client"` default export component that uses **shadcn `<Table>` components** (NOT TanStack DataTable). Follow the account samples page pattern exactly.

### Key Difference from Admin Module

The web app account pages use shadcn's `<Table>`, `<TableHeader>`, `<TableRow>`, `<TableHead>`, `<TableBody>`, `<TableCell>` components directly — **not** the `DataTable` wrapper from TanStack React Table.

### Imports

```tsx
import { useState, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
// Import enum arrays from @repo/backend/validators for any dropdown filters
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ActionsCell } from "@/components/module/actions-cell";
import { PermissionGuard } from "@/components/module/permission-guard";
// Import the module-specific Form and Delete
```

### State management

- `page`, `search`, `cursorsRef` — always present for pagination.
- `sheetOpen`, `sheetMode`, `selectedRecord` — only if any of `[view, create, update]` are in CRUD.
- `deleteDialogOpen`, `recordToDelete` — only if `remove` is in CRUD.

### Permission-gated actions

Use `useData()` to get `hasPermission`, then conditionally pass action handlers:

```tsx
const { hasPermission } = useData();
```

Pass handlers to `<ActionsCell>` only when the user has the corresponding permission:

```tsx
<ActionsCell
  row={record}
  onView={hasPermission("<module>:view") ? handleView : undefined}
  onEdit={hasPermission("<module>:update") ? handleEdit : undefined}
  onDelete={hasPermission("<module>:remove") ? handleDelete : undefined}
/>
```

### Convex queries

Use `listByUser` (scoped to current user) instead of `list`:

```tsx
const result = useQuery(api.<folder>.<table>.listByUser, {
  paginationOpts: { numItems: PAGE_SIZE, cursor },
  ...(activeSearch ? { search: activeSearch } : {}),
});
```

### Table JSX

Render a shadcn `<Table>` with explicit column headers and row cells:

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead className="hidden sm:table-cell">Status</TableHead>
        {/* ... more columns */}
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {isLoading ? (
        <TableRow>
          <TableCell colSpan={colCount} className="h-24 text-center">
            Loading...
          </TableCell>
        </TableRow>
      ) : records.length === 0 ? (
        <TableRow>
          <TableCell colSpan={colCount} className="h-24 text-center">
            No records found.
          </TableCell>
        </TableRow>
      ) : (
        records.map((record) => (
          <TableRow key={record._id}>
            <TableCell className="font-medium">{record.name}</TableCell>
            <TableCell className="hidden sm:table-cell">
              <span className="capitalize">{record.status}</span>
            </TableCell>
            {/* ... more cells */}
            <TableCell className="text-right">
              <ActionsCell
                row={record}
                onView={hasPermission("<module>:view") ? handleView : undefined}
                onEdit={
                  hasPermission("<module>:update") ? handleEdit : undefined
                }
                onDelete={
                  hasPermission("<module>:remove") ? handleDelete : undefined
                }
              />
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</div>
```

### Cell rendering rules

| Field type                        | Cell rendering                                |
| --------------------------------- | --------------------------------------------- |
| `name` (string)                   | Plain text with `font-medium`                 |
| `name` (object `{first, last}`)   | `${name.first} ${name.last}`                  |
| `status` / `role` / `type` (enum) | `<span className="capitalize">{value}</span>` |
| `is_active` / boolean             | `"Yes"` / `"No"`                              |
| `price` / `amount` / currency     | `$${value.toFixed(2)}`                        |
| `quantity` / number               | Plain number                                  |
| `email`                           | Plain text                                    |
| `phone`                           | `value ?? "—"`                                |
| Optional fields                   | `"—"` fallback for undefined                  |

### Pagination

Use simple Previous/Next buttons (no page size selector):

```tsx
<div className="flex items-center justify-between">
  <p className="text-muted-foreground text-sm">Page {page}</p>
  <div className="flex items-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPage((p) => Math.max(1, p - 1))}
      disabled={page === 1}
    >
      Previous
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setPage((p) => p + 1)}
      disabled={result?.isDone ?? true}
    >
      Next
    </Button>
  </div>
</div>
```

---

## File 2 — `form.tsx`

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

| Concept                 | Pattern                                           | Example (module: `samples`, table: `samples`) |
| ----------------------- | ------------------------------------------------- | --------------------------------------------- |
| Folder                  | `apps/web/app/account/<module-name>/`             | `account/samples/`                            |
| Page component          | `export default function Account<ModulePascal>()` | `AccountSamples`                              |
| Row type                | `Doc<"table">`                                    | `Doc<"samples">`                              |
| Form component          | `<Singular>Form`                                  | `SampleForm`                                  |
| Delete wrapper          | `<Singular>Delete`                                | `SampleDelete`                                |
| State: selected record  | `selected<Singular>`                              | `selectedSample`                              |
| State: record to delete | `<singular>ToDelete`                              | `sampleToDelete`                              |
| Zod schema              | `<singular>FormSchema`                            | `sampleFormSchema`                            |
| Form values type        | `<Singular>FormValues`                            | `SampleFormValues`                            |

---

## Validation Checklist

Before finishing, verify:

- [ ] `page.tsx` — default export, `"use client"`, correct API path (`api.<folder>.<table>.listByUser`)
- [ ] `page.tsx` — uses shadcn `<Table>` components, NOT TanStack DataTable
- [ ] `page.tsx` — only handlers/state/UI for enabled CRUD operations
- [ ] `page.tsx` — only filter UI for requested filters
- [ ] `page.tsx` — `ActionsCell` callbacks gated by `hasPermission()`
- [ ] `page.tsx` — "New" button only rendered if `create` is in CRUD, wrapped with `<PermissionGuard>`
- [ ] `page.tsx` — simple Previous/Next pagination, no page size selector
- [ ] `form.tsx` — Zod schema matches table fields (excluding slug, image fields)
- [ ] `form.tsx` — only enabled mutations imported and called
- [ ] `form.tsx` — `<SingularDelete>` only exported if `remove` is enabled
- [ ] All imports use `@/components/module/*` for shared components
- [ ] All imports use `@repo/backend` for API and types, `@repo/backend/validators` for enums
- [ ] Responsive: hide secondary columns with `hidden sm:table-cell` or `hidden md:table-cell`
- [ ] No `any` types — strict TypeScript
- [ ] Follows kebab-case file naming
