"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { Modal } from "./modal";

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Doc<"customers">) => void;
}

export function CustomerModal({ open, onClose, onSelect }: CustomerModalProps) {
  const [tab, setTab] = useState<"search" | "new">("search");
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCustomer = useMutation(api.crm.customers.create);
  const results = useQuery(
    api.crm.customers.list,
    open
      ? {
          paginationOpts: { numItems: 20, cursor: null },
          ...(search.trim().length >= 2 ? { search: search.trim() } : {}),
        }
      : "skip",
  );

  useEffect(() => {
    if (!open) {
      setTab("search");
      setSearch("");
      setName("");
      setPhone("");
      setEmail("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const id = await createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status: "active",
        total_spend: 0,
        visit_count: 0,
      });
      // Construct a usable customer doc for the cart (stats start at zero).
      onSelect({
        _id: id,
        _creationTime: Date.now(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status: "active",
        total_spend: 0,
        visit_count: 0,
      } as Doc<"customers">);
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? (err.data as string)
          : "Could not create customer.";
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Customer</h2>

        <div className="bg-muted inline-flex rounded-lg p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={`rounded-md px-3 py-1.5 ${tab === "search" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={`rounded-md px-3 py-1.5 ${tab === "new" ? "bg-white shadow-sm" : "text-muted-foreground"}`}
          >
            New Customer
          </button>
        </div>

        {tab === "search" ? (
          <div className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              className="h-11"
              autoFocus
            />
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {results === undefined ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : results.page.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No customers found.
                </p>
              ) : (
                results.page.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => onSelect(c)}
                    className="flex w-full flex-col rounded-lg border p-3 text-left hover:bg-zinc-50"
                  >
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {c.phone ?? c.email ?? "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Name</Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Phone</Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="h-11 w-full"
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Saving…" : "Create & Attach"}
            </Button>
          </form>
        )}

        <Button variant="ghost" className="h-11 w-full" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
