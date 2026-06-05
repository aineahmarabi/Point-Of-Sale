# Turborepo Starter — Workspace Guidelines

## Stack

| Layer    | Technology                                         |
| -------- | -------------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                        |
| Apps     | Next.js 15 (App Router)                            |
| Database | Convex (`packages/backend`)                        |
| Auth     | Clerk + `convex-clerk` (`packages/backend`)        |
| UI       | shadcn/ui + Radix UI + Tailwind v4 (`packages/ui`) |
| Styling  | Tailwind v4 with `oklch` color tokens              |
| Language | TypeScript (strict)                                |

## Build & Dev Commands

```bash
pnpm dev          # Run all apps + Convex in watch mode (root)
pnpm build        # Build all packages and apps
pnpm lint         # Lint all packages
pnpm format       # Prettier format

# Per-package
pnpm --filter @repo/backend dev    # convex dev (schema sync + function deploy)
pnpm --filter web dev               # Next.js on :3000
pnpm --filter docs dev              # Next.js on :3001
```

## Monorepo Package Imports

Always use the workspace package names — never use relative paths across packages.

| Package                | Import                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| Database / Convex API  | `import { api } from "@repo/backend"`                                                            |
| Auth (client provider) | `import { AuthProvider } from "@repo/auth/providers"`                                            |
| Auth (server helpers)  | `import { auth, currentUser } from "@repo/auth/server"`                                          |
| Auth (hooks)           | `import { useData, useSignInFlow, useSignUp, useUpdateUser, useInvite } from "@repo/auth/hooks"` |
| UI components          | `import { Button } from "@repo/ui/components/ui/button"`                                         |
| UI utilities           | `import { cn } from "@repo/ui/lib/utils"`                                                        |
| Fonts                  | `import { kumbhSans, poltawskiSerif, geistMono } from "@repo/assets/fonts"`                      |
| Lib (utils)            | `import { slugify } from "@repo/lib/utils"`                                                      |
| Lib (hooks)            | `import { ... } from "@repo/lib/hooks"`                                                          |

## React Conventions

- **Functional components only** — no class components.
- **Custom hooks** for all reusable stateful logic — prefix with `use`.
- Use `"use client"` directive only when necessary (event handlers, hooks, browser APIs); prefer Server Components by default in Next.js App Router.
- Export one component per file; file name matches the component name in `kebab-case`.

## UI & Styling

- **Always use shadcn/ui components** for UI primitives (buttons, inputs, dialogs, cards, etc.). Check `packages/ui/src/components/ui/` first before building custom components.
- To add a new shadcn component to the workspace, run from the repo root:
  ```bash
  pnpm --filter @repo/ui dlx shadcn@latest add <component-name>
  ```
  Components are added to `packages/ui/src/components/ui/` and exported from `@repo/ui`.
- Use the `cn()` helper from `@repo/ui/lib/utils` to merge Tailwind classes.
- Color tokens use `oklch` — reference CSS variables (`--primary`, `--accent`, etc.) defined in `packages/config/tailwind/base.css`. Do not hardcode color values.
- Fonts are applied via CSS variables: `--font-kumbh-sans`, `--font-poltawski-serif`, `--font-geist-mono`. Apply them in layout via the `className` from `@repo/assets/fonts`.

## Convex (Database Layer)

All Convex code lives in `packages/backend/convex/`.

- Schema shapes are defined in `convex/validators.ts`; tables with indexes are registered in `convex/schema.ts`.
- Use `internalQuery` / `internalMutation` / `internalAction` for server-only functions; `query` / `mutation` / `action` for client-callable functions.
- Function references follow file-based routing: export `list` in `convex/data/samples.ts` → `api.data.samples.list`.

Use `/convex-table` to scaffold a new table end-to-end.

## Authentication

- Auth is provided by the `BackendProvider` from `@repo/auth/provider` — it wraps `ClerkProvider` + `ConvexProviderWithClerk`.
- It is already mounted in `apps/web/app/layout.tsx`. Do not add a second provider.
- For protected server routes use `auth()` / `currentUser()` imported from `@repo/auth/server`.
- On the Convex side, get the authenticated user via `ctx.auth.getUserIdentity()`. The `tokenIdentifier` field is the stable user ID.

## User Data Flow (Clerk-First)

All user data follows the **Clerk → webhook → Convex** pattern:

- **Never write user data directly to Convex**. All user updates must go through Clerk first, then the Clerk webhook syncs changes to Convex.
- Non-native Clerk fields (`phone`, `user_type`, `role`, `status`, `app`) are stored in Clerk's `public_metadata`.
- The webhook handler (`packages/backend/convex/user/clerk.ts`) extracts all fields and writes to Convex.
- Use `useUpdateUser()` from `@repo/auth/hooks` to update existing users via Clerk.
- Use `useInvite()` from `@repo/auth/hooks` to invite new customers via Clerk Invitations.
- Use `useSignUp()` from `@repo/auth/hooks` to create new admin users via Clerk sign-up.
- The `is_admin` boolean is computed by the webhook from the `app` array and indexed for efficient queries.
- Admin queries use `isAdmin: true`, customer queries use `isAdmin: false`.

## Permissions

- Permissions are `"module:action"` format strings (e.g. `"admins:update"`, `"samples:view"`).
- A wildcard `"*"` grants all permissions.
- In the admin app, the sidebar filters links by `hasPermission()` from `useData()`.
- In the web app, `account-nav.tsx` filters links by `hasPermission()` and `usePermissionGuard()` blocks routes.

## File & Folder Conventions

```
apps/
  web/app/          # Next.js App Router pages (route segments as folders)
  docs/app/         # Docs app

packages/
  backend/convex/  # All Convex functions, schema, crons
  ui/src/
    components/ui/  # shadcn/ui primitives
  auth/src/         # Clerk + Convex auth wrappers
  assets/src/       # Font definitions
  lib/src/          # Shared utility functions and hooks
```

- New Convex functions go in `packages/backend/convex/` under a descriptive subfolder (e.g., `convex/user/`, `convex/data/`).
- New shared UI components go in `packages/ui/src/components/`.
- Page-specific components that are not reusable can live alongside the page in `apps/<app>/app/<route>/`.

## TypeScript

- Strict mode is enabled. Never use `any` — use `unknown` or proper types.
- Use `Id<"tableName">` and `Doc<"tableName">` from `packages/backend/convex/_generated/dataModel` for Convex document types.
- Use `QueryCtx`, `MutationCtx`, `ActionCtx` from `./_generated/server` for Convex context types.
