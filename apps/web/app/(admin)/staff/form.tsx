"use client";

import { useEffect, useState } from "react";
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
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation.",
      );
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

export function StaffEditModal({
  open,
  onClose,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  staff?: Staff;
}) {
  const roles = useQuery(
    api.user.roles.listByApp,
    open ? { app: "admin" } : "skip",
  );
  const updateStaff = useMutation(api.user.users.updateStaff);
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState<(typeof userStatus)[number]>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && staff) {
      setRoleId(staff.role ?? "");
      setStatus(staff.status);
      setError(null);
      setSubmitting(false);
    }
  }, [open, staff]);

  async function handleSave() {
    if (!staff) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateStaff({
        id: staff._id,
        ...(roleId ? { role: roleId as Id<"roles"> } : {}),
        status,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ConvexError
          ? (err.data as string)
          : "Failed to update staff.",
      );
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
          <Select value={roleId} onValueChange={setRoleId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {(roles ?? []).map((r) => (
                <SelectItem key={r._id} value={r._id}>
                  {r.name}
                </SelectItem>
              ))}
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
