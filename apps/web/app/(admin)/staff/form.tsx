"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc, Id } from "@repo/backend/dataModel";
import { userStatus } from "@repo/backend/validators";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";

import { Modal } from "@/components/pos/modal";
import { notifyError, notifySuccess } from "@/lib/errors";

type Staff = Doc<"users"> & { role_name?: string | null };

export function StaffInviteModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // Fetched only to map the chosen access level → the real Convex role name on
  // submit (NOT for the dropdown display, which is hardcoded Admin / Cashier).
  const roles = useQuery(
    api.user.roles.listByApp,
    open ? { app: "admin" } : "skip",
  );
  const [email, setEmail] = useState("");
  const [choice, setChoice] = useState<"admin" | "cashier">("cashier");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setChoice("cashier");
      setError(null);
      setSubmitting(false);
      setDone(false);
    }
  }, [open]);

  /** Resolve the chosen access level to an actual role name that exists. */
  function resolveRoleName(): string | null {
    const list = roles ?? [];
    if (choice === "admin") {
      // Prefer a role with "*" (Super Admin), else any role named "…Admin…".
      const adminRole =
        list.find((r) => r.permissions?.includes("*")) ??
        list.find((r) => r.name.toLowerCase().includes("admin"));
      return adminRole?.name ?? null;
    }
    const cashierRole = list.find((r) => r.name.toLowerCase() === "cashier");
    return cashierRole?.name ?? "Cashier";
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const roleName = resolveRoleName();
    if (!roleName) {
      setError("No matching role found. Make sure roles are seeded in Convex.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role: roleName }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to send invitation.");
      notifySuccess(`Invitation sent to ${email.trim()}.`);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation.",
      );
      notifyError(err);
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-semibold">Invite Staff</h2>
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-burgundy-700">
              Invitation sent to {email}. They&apos;ll get an email to set up
              their account with the chosen role.
            </p>
            <Button className="h-11 w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={choice}
                onValueChange={(v) => setChoice(v as "admin" | "cashier")}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-11 flex-1"
                disabled={submitting || !email.trim() || roles === undefined}
              >
                {submitting ? "Sending…" : "Send Invite"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

/** Resolve "Admin"/"Cashier" choice to a real Convex role _id. */
function resolveRoleId(
  choice: "admin" | "cashier",
  roles: Doc<"roles">[],
): Id<"roles"> | null {
  if (choice === "admin") {
    const adminRole =
      roles.find((r) => r.permissions?.includes("*")) ??
      roles.find((r) => r.name.toLowerCase().includes("admin"));
    return adminRole?._id ?? null;
  }
  const cashierRole =
    roles.find((r) => r.name.toLowerCase() === "cashier") ??
    roles.find((r) => r.name.toLowerCase().includes("cashier"));
  return cashierRole?._id ?? null;
}

export function StaffEditModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff?: Staff;
}) {
  // Fetch ALL roles (every app) so we can resolve Admin/Cashier regardless of
  // which app a role is registered under.
  const rolesResult = useQuery(
    api.user.roles.list,
    open ? { paginationOpts: { numItems: 100, cursor: null } } : "skip",
  );
  const roles = useMemo(() => rolesResult?.page ?? [], [rolesResult]);
  const updateStaff = useMutation(api.user.users.updateStaff);
  const [choice, setChoice] = useState<"admin" | "cashier">("cashier");
  const [status, setStatus] = useState<(typeof userStatus)[number]>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && staff) {
      // Derive the current access level: a wildcard/admin role → "admin".
      const currentRole = roles.find((r) => r._id === staff.role);
      const isAdmin =
        currentRole?.permissions?.includes("*") ??
        currentRole?.name.toLowerCase().includes("admin") ??
        staff.is_admin;
      setChoice(isAdmin ? "admin" : "cashier");
      setStatus(staff.status);
      setError(null);
      setSubmitting(false);
    }
  }, [open, staff, roles]);

  async function handleSave() {
    if (!staff) return;
    const roleId = resolveRoleId(choice, roles);
    if (!roleId) {
      setError("No matching role found. Make sure roles are seeded in Convex.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateStaff({
        id: staff._id,
        role: roleId,
        status,
      });
      notifySuccess("Staff member updated.");
      onClose();
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? (err.data as string)
          : "Failed to update staff.",
      );
      notifyError(err);
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-5 p-6">
        <h2 className="text-xl font-semibold">Edit Staff</h2>
        {staff && (
          <p className="text-muted-foreground text-sm">
            {staff.name
              ? `${staff.name.first} ${staff.name.last}`
              : staff.email}
          </p>
        )}
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select
            value={choice}
            onValueChange={(v) => setChoice(v as "admin" | "cashier")}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as (typeof userStatus)[number])}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userStatus.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 flex-1"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="h-11 flex-1"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
