"use client";

import { Component, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { useClerk } from "@clerk/nextjs";
import { api } from "@repo/backend";
import { DataProvider } from "@repo/auth/providers";
import { useData } from "@repo/auth/hooks";
import { Button } from "@repo/ui/components/ui/button";

import { CartProvider } from "@/context/cart-context";
import { TerminalHeader } from "@/components/pos/terminal-header";
import { isActiveStaff, isAdminRole } from "@/lib/auth";

function FullScreenLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-burgundy-400" />
        <p className="text-sm">{label}</p>
      </div>
    </div>
  );
}

function FullScreenError({
  title,
  detail,
  hint,
}: {
  title: string;
  detail?: string;
  hint?: string;
}) {
  const { signOut } = useClerk();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 text-center">
        <h1 className="text-xl font-bold">{title}</h1>
        {detail && (
          <p className="mt-3 break-words text-sm text-slate-400">{detail}</p>
        )}
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700 hover:text-white"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
          <Button
            className="h-11 flex-1 bg-burgundy-500 text-white hover:bg-burgundy-600"
            onClick={() => void signOut({ redirectUrl: "/sign-in" })}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Catches render-time errors (e.g. the currentUser query throwing when the
 *  signed-in user has no row in the `users` table) so the screen is never blank. */
class PosErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      const detail =
        error instanceof ConvexError
          ? String(error.data)
          : error.message || "An unexpected error occurred.";
      return (
        <FullScreenError
          title="Can't load the terminal"
          detail={detail}
          hint="If this is your first sign-in, your staff account may not be set up yet. Ask an administrator to grant you access, then reload."
        />
      );
    }
    return this.props.children;
  }
}

/** Resolves the current staff user before mounting the data provider, with
 *  explicit loading / unauthenticated states instead of a blank screen. */
function CurrentUserGate({ children }: { children: ReactNode }) {
  const currentUser = useQuery(api.user.users.currentUser);

  if (currentUser === undefined) {
    return <FullScreenLoader label="Loading your account…" />;
  }
  if (currentUser === null) {
    return (
      <FullScreenError
        title="Session expired"
        detail="Your session has expired. Please sign in again."
      />
    );
  }

  // Terminal access: any ACTIVE staff member with ANY role assigned.
  // Role-name agnostic — "Super Admin", "Admin", "Manager", "Cashier", etc. all pass.
  if (!isActiveStaff(currentUser)) {
    const detail =
      currentUser.status !== "active"
        ? `Your account status is "${currentUser.status}". Ask an administrator to activate it.`
        : "Your account has no role assigned yet. Ask an administrator to assign one.";
    return <FullScreenError title="Access not enabled" detail={detail} />;
  }

  return (
    <DataProvider>
      <PosGate>{children}</PosGate>
    </DataProvider>
  );
}

function PosGate({ children }: { children: ReactNode }) {
  const { currentUser } = useData();
  const session = useQuery(api.pos.sessions.getOpenByUser);
  const pathname = usePathname();
  const router = useRouter();
  const onOpenSessionRoute = pathname === "/open-session";

  useEffect(() => {
    if (session === undefined) return;
    if (session === null && !onOpenSessionRoute) {
      router.replace("/open-session");
    } else if (session && onOpenSessionRoute) {
      router.replace("/terminal");
    }
  }, [session, onOpenSessionRoute, router]);

  // Loading the open-session lookup.
  if (session === undefined) {
    return <FullScreenLoader label="Opening terminal…" />;
  }

  // No open shift → only the open-session screen may render.
  if (session === null) {
    return onOpenSessionRoute ? <>{children}</> : <FullScreenLoader />;
  }

  // Open shift exists. While the open-session route redirects away, show loader.
  if (onOpenSessionRoute) return <FullScreenLoader />;

  return (
    <CartProvider>
      <div className="flex h-screen flex-col bg-slate-900">
        {isAdminRole(currentUser?.role) && (
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-burgundy-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-burgundy-700"
          >
            <span className="uppercase tracking-wide">Admin View</span>
            <span className="opacity-70">—</span>
            <span className="underline underline-offset-2">
              Back to Dashboard →
            </span>
          </Link>
        )}
        <TerminalHeader session={session} />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </CartProvider>
  );
}

export default function PosLayout({ children }: { children: ReactNode }) {
  return (
    <PosErrorBoundary>
      <CurrentUserGate>{children}</CurrentUserGate>
    </PosErrorBoundary>
  );
}
