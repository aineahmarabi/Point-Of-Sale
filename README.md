# Turborepo Starter — Admin + Web

A full-stack monorepo template with **two Next.js 15 apps** (customer-facing web app and an internal admin dashboard), a **Convex** real-time backend, **Clerk** authentication, and a shared **shadcn/ui** component library — all wired together with **Turborepo** and **pnpm workspaces**.

---

## Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                                |
| Apps     | Next.js 15 (App Router) — `web` on :3000, `admin` on :3001 |
| Database | Convex (real-time, serverless)                             |
| Auth     | Clerk + `convex-clerk` integration                         |
| UI       | shadcn/ui + Radix UI + Tailwind CSS v4                     |
| Language | TypeScript (strict mode)                                   |

---

## Monorepo Structure

```
├── apps/
│   ├── admin/          # Internal admin dashboard (:3001)
│   └── web/            # Public-facing web app (:3000)
│
├── packages/
│   ├── assets/         # Fonts, images, logos
│   ├── backend/
│   │   ├── auth/       # Clerk + Convex auth wrappers (@repo/auth)
│   │   └── convex/     # Database schema, functions, webhooks (@repo/backend)
│   ├── config/
│   │   ├── eslint/     # Shared ESLint configs
│   │   ├── tailwind/   # Shared Tailwind base styles + CSS tokens
│   │   └── typescript/ # Shared tsconfig presets
│   ├── lib/            # Shared utilities and hooks (@repo/lib)
│   └── ui/             # shadcn/ui component library (@repo/ui)
```

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@9 --activate`)
- A **Clerk** account — [clerk.com](https://clerk.com)
- A **Convex** account — [convex.dev](https://convex.dev)

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd ika-turborepo-admin-web
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in the values:

| Variable                                | Where to find it                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `CONVEX_DEPLOYMENT`                     | Convex dashboard → Settings                                                            |
| `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard → Settings                                                            |
| `CONVEX_SITE_URL`                       | Convex dashboard → Settings (the `.convex.site` url)                                   |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`     | Clerk dashboard → API Keys                                                             |
| `CLERK_SECRET_KEY`                      | Clerk dashboard → API Keys                                                             |
| `CLERK_ISSUER_URL`                      | Clerk dashboard → JWT Templates → Convex                                               |
| `CLERK_WEBHOOK_SECRET`                  | Clerk dashboard → Webhooks (create one pointing to your Convex site URL + `/api/user`) |

### 3. Start development

```bash
pnpm dev
```

This starts **all apps and Convex** in watch mode via Turborepo:

- **Web app** → [http://localhost:3000](http://localhost:3000)
- **Admin app** → [http://localhost:3001](http://localhost:3001)
- **Convex** dev server syncs schema and deploys functions automatically

### 4. Create your first account

> **Important:** You cannot create accounts from the admin app — it has no sign-up page by design.

1. Go to [http://localhost:3000/sign-up](http://localhost:3000/sign-up) (the **web app**)
2. Create an account with the email you want to use as Super Admin
3. Complete the sign-up flow

### 5. Run the seed

The seed creates two default roles and promotes your account to **Super Admin**:

```bash
npx convex run seed:seed '{"email":"your-email@example.com"}'
```

Use the **same email** you signed up with in step 4. This will:

- Create a **Super Admin** role with `["*"]` (wildcard — full access)
- Create a **Customer** role with `[]` (no permissions — default for new users)
- Assign your user the Super Admin role, add `"admin"` to your app list, and activate your account

### 6. Delete the seed file

After the seed runs successfully, **delete it** so the function can't be called again:

```bash
# Windows
del packages\backend\convex\seed.ts

# macOS / Linux
rm packages/backend/convex/seed.ts
```

Then redeploy Convex to remove the function from the deployment:

```bash
pnpm --filter @repo/backend dev
```

### 7. Sign in to the admin

Go to [http://localhost:3001/sign-in](http://localhost:3001/sign-in) and log in with your Super Admin email.

---

## Common Commands

```bash
pnpm dev                            # Run everything in dev mode
pnpm build                          # Build all packages and apps
pnpm lint                           # Lint all packages
pnpm format                         # Prettier format all files
pnpm check-types                    # TypeScript type-check all packages

# Per-package
pnpm --filter @repo/backend dev     # Convex dev only
pnpm --filter web dev               # Web app only
pnpm --filter admin dev             # Admin app only
```

---

## Key Architecture Concepts

### User Data Flow (Clerk → Webhook → Convex)

All user data follows a single pattern: **Clerk is the source of truth**.

1. User data is created/updated via the **Clerk API** (sign-up, profile update, admin invitation)
2. Clerk fires a **webhook** to Convex (`POST /api/user`)
3. The webhook handler writes the data to the Convex `users` table

Non-native Clerk fields (`phone`, `user_type`, `role`, `status`, `app`) are stored in Clerk's `public_metadata` and extracted by the webhook.

### Multi-App User Model

- Each user has an `app` array: `["web"]`, `["admin"]`, or `["admin", "web"]`
- A computed `is_admin` boolean field is set by the webhook (`true` if app includes `"admin"`)
- The admin app queries users with `isAdmin: true`, the web app with `isAdmin: false`

### Permissions

- Permissions are `"module:action"` format strings (e.g., `"admins:update"`, `"samples:view"`)
- The wildcard `"*"` grants **all** permissions
- The Super Admin role has `["*"]`, the Customer role has `[]`
- Sidebar links are filtered client-side via `hasPermission()`
- Server-side mutations use `assertPermission(ctx, "module:action")`

### Default Role & App

- **New users** are automatically assigned the `"Customer"` role and `"web"` app (defaults in the Clerk webhook)
- Admins can change a user's role and app from the admin dashboard

---

## Package Imports

Always use workspace package names — never relative paths across packages:

| Package               | Import                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Database / Convex API | `import { api } from "@repo/backend"`                                                            |
| Auth (providers)      | `import { AuthProvider } from "@repo/auth/providers"`                                            |
| Auth (hooks)          | `import { useData, useSignInFlow, useSignUp, useUpdateUser, useInvite } from "@repo/auth/hooks"` |
| Auth (server)         | `import { auth, currentUser } from "@repo/auth/server"`                                          |
| UI components         | `import { Button } from "@repo/ui/components/ui/button"`                                         |
| UI utilities          | `import { cn } from "@repo/ui/lib/utils"`                                                        |
| Shared utils          | `import { slugify } from "@repo/lib/utils"`                                                      |
| Fonts                 | `import { kumbhSans } from "@repo/assets/fonts"`                                                 |

---

## Adding a shadcn/ui Component

```bash
pnpm --filter @repo/ui dlx shadcn@latest add <component-name>
```

Components are added to `packages/ui/src/components/ui/` and available across all apps.

---

## App-Specific READMEs

- [Admin App README](apps/admin/README.md) — dashboard, roles, permissions, user management
- [Web App README](apps/web/README.md) — public site, customer accounts, sign-up flow
