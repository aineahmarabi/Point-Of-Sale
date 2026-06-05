"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@repo/ui/lib/utils";
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
    <Modal
      open={open}
      onClose={onClose}
      className="bg-slate-800 text-slate-100 sm:border sm:border-slate-700"
    >
      <div className="space-y-4 p-6">
        <h2 className="text-xl font-bold text-white">Customer</h2>

        <div className="inline-flex w-full rounded-lg bg-slate-900 p-1 text-sm">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 font-medium transition",
              tab === "search"
                ? "bg-burgundy-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={cn(
              "flex-1 rounded-md px-3 py-2 font-medium transition",
              tab === "new"
                ? "bg-burgundy-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            New Customer
          </button>
        </div>

        {tab === "search" ? (
          <div className="space-y-3">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="h-11 border-slate-600 bg-slate-900 pl-10 text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                autoFocus
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {results === undefined ? (
                <p className="text-sm text-slate-400">Loading…</p>
              ) : results.page.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
                  <p className="text-sm font-medium text-slate-300">
                    No customers found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try a different name, or add a new customer.
                  </p>
                </div>
              ) : (
                results.page.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => onSelect(c)}
                    className="flex w-full flex-col rounded-xl border border-slate-700 bg-slate-900/50 p-3 text-left transition hover:bg-slate-700/50"
                  >
                    <span className="text-sm font-semibold text-white">
                      {c.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="cust-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-slate-300">
                  Phone
                </Label>
                <Input
                  id="cust-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-slate-600 bg-slate-900 text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              className="h-11 w-full bg-burgundy-500 font-bold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Saving…" : "Create & Attach"}
            </Button>
          </form>
        )}

        <Button
          variant="ghost"
          className="h-11 w-full text-slate-300 hover:bg-slate-700 hover:text-white"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
