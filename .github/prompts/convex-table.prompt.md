---
description: "Scaffold a new Convex table: add shape to validators.ts, register it in schema.ts with indexes, and generate list/count/create/update/remove functions. Use when adding a new database table to packages/backend."
agent: "agent"
argument-hint: "table <name> [field field ...] [in <folder>]"
---

Scaffold a complete Convex table from the specification below.

**Input spec:** $input

## Parsing Rules

Extract from the spec:

- **Table name** — the word after `table` (e.g. `table categories` → `categories`)
- **Fields** — space-separated field names (e.g. `name description price`). If no fields are given, infer sensible defaults from the table name.
- **Folder** — the path after `in` (e.g. `in data` → `convex/data/`). If omitted, place the functions file directly in `convex/`.

### Field name → Convex validator inference

Infer the validator from the field name using these rules in order:

| Pattern                                                                                                | Validator                                                                                             | Optional?                                               |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `id`, `*Id`, `*_id` (e.g. `userId`, `categoryId`)                                                      | `v.id("<inferredTable>")` — infer table name by stripping `Id` suffix and pluralising                 | No                                                      |
| `price`, `amount`, `total`, `cost`, `balance`, `rate`, `weight`, `lat`, `lng`, `latitude`, `longitude` | `v.float64()`                                                                                         | No                                                      |
| `count`, `quantity`, `order`, `position`, `rank`, `age`, `year`, `month`, `day`                        | `v.int64()`                                                                                           | No                                                      |
| `is*`, `has*`, `can*`, `active`, `enabled`, `published`, `verified`, `deleted`                         | `v.boolean()`                                                                                         | No                                                      |
| `*At`, `*Date`, `createdAt`, `updatedAt`, `deletedAt`                                                  | `v.number()` (Unix ms timestamp)                                                                      | `*At` other than `createdAt` → `v.optional(v.number())` |
| `status`, `role`, `type`, `kind`, `tier`, `state`                                                      | `v.string()` (use a `v.union(v.literal(...))` if you can infer obvious values from the table context) | No                                                      |
| `url`, `imageUrl`, `avatarUrl`, `*Url`                                                                 | `v.string()`                                                                                          | Yes — `v.optional(v.string())`                          |
| `description`, `bio`, `notes`, `body`, `content`, `summary`, `excerpt`                                 | `v.string()`                                                                                          | Yes — `v.optional(v.string())`                          |
| `phone`, `address`, `website`, `*Link`                                                                 | `v.string()`                                                                                          | Yes — `v.optional(v.string())`                          |
| `*s` plural nouns for collections (e.g. `images`, `tags`, `photos`, `attachments`, `urls`, `files`)    | `v.array(v.string())`                                                                                 | No                                                      |
| Everything else                                                                                        | `v.string()`                                                                                          | No                                                      |

Never include `slug` in the field list — it is auto-added whenever `name` is present.

## Step 1 — Update `validators.ts`

File: [packages/backend/convex/validators.ts](../../packages/backend/convex/validators.ts)

- Read the file first to understand existing entries.
- If the table has a `status`, `role`, `type`, or similar enum field, add a `const` enum array in the `// ENUMS` section (e.g. `export const categoryStatus = ["active", "inactive"] as const;`). Use `v.union(...enumArray.map((e) => v.literal(e)))` in the table shape so the enum is reusable by frontend code via `import { categoryStatus } from "@repo/backend/validators"`.
- Add a new exported `const <tableName> = { ... }` object in the `// TABLES` section using `v.*` validators from `convex/values`.
- If the fields include a `name` field, also include a `slug: v.string()` — it will be auto-generated from `name` at insert/update time.
- Append the new table name to the `export default { ... }` object at the bottom.

Follow the exact style of the existing entries:

```ts
// ENUMS
export const categoryStatus = ["active", "inactive"] as const;

// TABLES
export const categories = {
  name: v.string(),
  slug: v.string(),
  description: v.optional(v.string()),
  status: v.union(...categoryStatus.map((e) => v.literal(e))),
};
```

## Step 2 — Update `schema.ts`

File: [packages/backend/convex/schema.ts](../../packages/backend/convex/schema.ts)

- Read the file first.
- Import the new shape from `./validators`.
- Register a new `defineTable(<tableName>)` entry inside `defineSchema({...})`.
- Add indexes:
  - If there is a `slug` field: `.index("by_slug", ["slug"])`.
  - If there is a `status` field: `.index("by_status", ["status"])`.
  - If there is a foreign-key `id` field (e.g. `categoryId`): `.index("by_<fieldName>", ["<fieldName>"])`.
  - If there is a `name` field: add a `.searchIndex("by_name", { searchField: "name", filterFields: [...other string/literal fields] })`.
  - Only add indexes that are useful given the actual fields.

## Step 3 — Create the functions file

Determine the output path:

- With folder specified (`in data`): `packages/backend/convex/data/<tableName>.ts`
- Without folder: `packages/backend/convex/<tableName>.ts`
- If the folder already exists, add the file inside it. If not, create it.

The file should export five functions (list, count, create, update, remove) following the patterns in [packages/backend/convex/data/samples.ts](../../packages/backend/convex/data/samples.ts).

All mutations use `assertPermission` from [packages/backend/convex/auth.helpers.ts](../../packages/backend/convex/auth.helpers.ts) for permission enforcement. The permission format is `"<tableName>:<action>"` (e.g. `"samples:create"`, `"samples:update"`, `"samples:remove"`).

### `list` — paginated public query

- Accept `paginationOpts`, plus optional `search` (string) and filter args matching any indexed/searchable fields.
- When `search` is provided, use `.withSearchIndex(...)`. When a filter like `status` is provided, use `.withIndex(...)`. Otherwise fall back to an unindexed `.query()`.
- If the table has an `image` storage field, resolve URLs via `ctx.storage.getUrl()` and merge them into the returned page.

```ts
import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "../_generated/server"; // adjust relative path
import { Id } from "../_generated/dataModel"; // only if table has image storage field
import { slugify } from "@repo/lib/utils"; // only if table has name/slug
import { <tableName> } from "../validators";
import { v, ConvexError } from "convex/values";
import { assertPermission } from "../auth.helpers"; // adjust relative path

const { slug: _slug, ...<tableName>Args } = <tableName>; // only if table has slug field
```

export const list = query({
args: {
paginationOpts: paginationOptsValidator,
search: v.optional(v.string()),
status: v.optional(<tableName>.status), // if status field exists
},
handler: async (ctx, args) => {
// branch on search → withSearchIndex, filter → withIndex, else plain query
// then .paginate(args.paginationOpts)
},
});

````

### `count` — public query

- Accept the same filter args as `list` (minus `paginationOpts`).
- Use the same index/search branching as `list`, but `.collect()` and return `.length`.
- This is the **only** place `.collect()` is acceptable.

```ts
export const count = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(<tableName>.status),
  },
  handler: async (ctx, args) => {
    // same branching as list, .collect(), return .length
  },
});
````

### `create` — mutation

- If a `slug` field exists, import `slugify` from `@repo/lib/utils` and generate `slug = slugify(name)` — do NOT accept `slug` as an arg.
- Destructure the slug out of the table shape at module level: `const { slug: _slug, ...<tableName>Args } = <tableName>;` and use `<tableName>Args` as the mutation args.
- **Always enforce permissions:** call `await assertPermission(ctx, "<tableName>:create")` as the first line of the handler.

### `update` — mutation

- Args: `{ id: v.id("<tableName>"), ...<tableName>Args }` (shape fields minus slug).
- Regenerate slug from name if applicable.
- Use `ctx.db.patch`.
- **Always enforce permissions:** call `await assertPermission(ctx, "<tableName>:update")`.

### `remove` — mutation

- Args: `{ id: v.id("<tableName>") }`
- Use `ctx.db.delete`.
- **Always enforce permissions:** call `await assertPermission(ctx, "<tableName>:remove")`.

### Import path depth

Adjust relative imports based on folder nesting:

- File in `convex/data/<tableName>.ts` → `../` prefix (e.g. `../_generated/server`, `../tables`)
- File in `convex/<tableName>.ts` → `./` prefix

## Validation Checklist

Before finishing, verify:

- [ ] `validators.ts` — enum arrays added (if applicable), new table shape export added, included in `export default`
- [ ] `schema.ts` — new import from `./validators` and `defineTable` entry added
- [ ] Functions file created at the correct path
- [ ] All five functions exported: `list`, `count`, `create`, `update`, `remove`
- [ ] Every function has argument validators (`v.*`)
- [ ] `slug` is never accepted as a direct arg if it's auto-generated
- [ ] No use of `.filter()` in queries — use `withIndex` only
- [ ] `.collect()` is only used in the `count` query — use `.paginate()` or `.take(n)` everywhere else
- [ ] `create`, `update`, and `remove` all call `await assertPermission(ctx, "<tableName>:<action>")` as the first line of the handler
- [ ] `assertPermission` is imported from `../auth.helpers` (adjust relative path based on folder depth)
- [ ] Never accept a `userId` or user identifier as a function argument — derive auth via `assertPermission` / `getAuthUser` server-side
