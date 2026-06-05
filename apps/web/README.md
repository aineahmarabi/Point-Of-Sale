# Web App

The public-facing customer web application. Built with **Next.js 15** (App Router), **Convex**, **Clerk**, and **shadcn/ui**.

Runs on [http://localhost:3000](http://localhost:3000) during development.

---

## Quick Start

1. Start from the repo root:
   ```bash
   pnpm dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)
3. Sign up at [http://localhost:3000/sign-up](http://localhost:3000/sign-up) to create an account

> **First-time setup?** After signing up, you'll want to promote your account to Super Admin so you can access the admin dashboard. See the [seed instructions](#seed-your-first-admin) below.

---

## Seed — Your First Admin

The admin app has **no sign-up page**, so you must create your account here first:

1. **Sign up** at [http://localhost:3000/sign-up](http://localhost:3000/sign-up) with the email you want as Super Admin
2. **Run the seed** from the repo root:
   ```bash
   npx convex run seed:seed '{"email":"your-email@example.com"}'
   ```
   This creates two roles (**Super Admin** with full access, **Customer** with no permissions) and assigns Super Admin to your account.
3. **Delete the seed file** immediately after:
   ```bash
   # Windows
   del packages\backend\convex\seed.ts
   # macOS / Linux
   rm packages/backend/convex/seed.ts
   ```
   Then redeploy Convex so the function is removed:
   ```bash
   pnpm --filter @repo/backend dev
   ```
4. Go to [http://localhost:3001/sign-in](http://localhost:3001/sign-in) and log in to the admin dashboard

---

## Authentication

- **Sign-in and sign-up** are both available — customers self-register
- **Clerk middleware** (`proxy.ts`) protects `/account(.*)` routes. Public pages (home, samples, etc.) are accessible without authentication.
- Signed-in users on auth pages (`/sign-in`, `/sign-up`) are redirected to `/`

### Auth flow

| Action   | Route      | What happens                                                                                       |
| -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Sign up  | `/sign-up` | Creates Clerk account → webhook creates Convex user with default `"Customer"` role and `"web"` app |
| Sign in  | `/sign-in` | Email + password → optional OTP verification                                                       |
| Sign out | User menu  | Clears session, redirects to home                                                                  |

---

## Route Structure

```
app/
├── (auth)/
│   ├── sign-in/page.tsx        # Custom Clerk sign-in
│   └── sign-up/page.tsx        # Custom Clerk sign-up
├── (site)/
│   ├── layout.tsx              # Public layout: header + footer
│   ├── page.tsx                # Landing / home page
│   └── samples/                # Public samples browsing
├── account/
│   ├── layout.tsx              # Account layout: header + sidebar nav + DataProvider + permission guard
│   ├── page.tsx                # Account overview
│   ├── account-nav.tsx         # Account sidebar navigation (permission-filtered)
│   ├── profile/                # Profile editing (name, phone, user type)
│   └── samples/                # User's personal samples
├── design/page.tsx             # Design system preview
├── not-found.tsx               # 404 page
├── layout.tsx                  # Root layout (ThemeProvider + AuthProvider)
└── globals.css
```

### Route groups explained

| Group     | Purpose                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| `(auth)`  | Authentication pages — minimal layout, no header/footer                        |
| `(site)`  | Public pages — accessible without sign-in, wrapped in header + footer          |
| `account` | Protected user account pages — requires authentication, has sidebar navigation |

---

## Public vs. Protected Routes

| Route               | Auth required? | Notes                                 |
| ------------------- | -------------- | ------------------------------------- |
| `/`                 | No             | Landing page                          |
| `/samples`          | No             | Public sample browsing                |
| `/sign-in`          | No             | Redirects to `/` if already signed in |
| `/sign-up`          | No             | Redirects to `/` if already signed in |
| `/account`          | **Yes**        | Account overview                      |
| `/account/profile`  | **Yes**        | Edit profile via Clerk API            |
| `/account/samples`  | **Yes**        | Permission-gated (`samples:view`)     |
| `/account/settings` | **Yes**        | Account settings                      |

---

## Account Navigation & Permissions

Account sidebar navigation is defined in `lib/navigation.ts` under `userNavigation`. Links with a `permission` field are only shown if the user's role includes that permission:

```ts
{
  icon: Package01Icon,
  title: "Samples",
  url: "/account/samples",
  permission: "samples:view",   // ← hidden if user lacks this permission
}
```

The `account-nav.tsx` component filters links using `hasPermission()` from `useData()`. The `usePermissionGuard()` hook in the account layout also blocks direct URL access to permission-gated routes (returns 403 Forbidden).

---

## Profile Editing

The profile form (`account/profile/form.tsx`) updates user data through the **Clerk-first** pattern:

1. User edits their profile (name, phone, user type)
2. `useUpdateUser()` calls the Clerk API via a server action
3. Clerk fires a webhook → Convex user record is updated automatically

This means profile data is **never written directly to Convex** — Clerk is always the source of truth.

---

## Default User Setup

When a new user signs up:

| Field      | Default value                 | Can be changed by                  |
| ---------- | ----------------------------- | ---------------------------------- |
| Role       | `"Customer"` (no permissions) | Admin only                         |
| App        | `["web"]`                     | Admin only                         |
| Status     | `"pending"`                   | Admin only                         |
| `is_admin` | `false`                       | Computed by webhook from app array |

Admins can change these values from the admin dashboard (Customers table).

---

## Adding a New Account Module

1. Create a Convex function in `packages/backend/convex/data/your-module.ts` with a `listByUser` query
2. Add the table to `packages/backend/convex/validators.ts` and `schema.ts`
3. Create the page: `app/account/your-module/page.tsx`
4. Add a navigation entry in `lib/navigation.ts` under `userNavigation` with the appropriate permission
5. Use shadcn `<Table>` components (not TanStack DataTable) for the table layout

See `.github/prompts/account-module.prompt.md` for a detailed scaffolding guide.

---

## Key Files

| File                          | Purpose                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `proxy.ts`                    | Clerk middleware — protects `/account` routes, redirects signed-in users from auth pages |
| `app/account/layout.tsx`      | Account shell with DataProvider + permission guard                                       |
| `app/account/account-nav.tsx` | Sidebar nav with permission filtering                                                    |
| `lib/navigation.ts`           | Navigation config (public `navigation` + protected `userNavigation`)                     |
| `components/header.tsx`       | Site header (shown on public + account pages)                                            |
| `components/footer.tsx`       | Site footer                                                                              |
