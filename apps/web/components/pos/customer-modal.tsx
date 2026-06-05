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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      setSelectedId(null);
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
        <h2 className="text-xl font-bold text-white">Add Customer</h2>

        {/* Pill tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              tab === "search"
                ? "bg-burgundy-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600",
            )}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setTab("new")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition",
              tab === "new"
                ? "bg-burgundy-500 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600",
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
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="h-11 border-slate-600 bg-slate-700 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-burgundy-500"
                autoFocus
              />
            </div>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {results === undefined ? (
                <p className="py-6 text-center text-sm text-slate-400">
                  Loading…
                </p>
              ) : results.page.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  No customers found
                </p>
              ) : (
                results.page.map((c) => {
                  const selected = selectedId === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        setSelectedId(c._id);
                        onSelect(c);
                      }}
                      className={cn(
                        "flex w-full flex-col gap-0.5 rounded-xl border bg-slate-700 p-3 text-left transition hover:bg-slate-600",
                        selected
                          ? "border-burgundy-500"
                          : "border-slate-600",
                      )}
                    >
                      <span className="text-sm font-bold text-white">
                        {c.name}
                      </span>
                      {c.email ? (
                        <span className="text-xs text-slate-400">
                          {c.email}
                        </span>
                      ) : null}
                      {c.phone ? (
                        <span className="text-xs text-slate-400">
                          {c.phone}
                        </span>
                      ) : null}
                      {!c.email && !c.phone ? (
                        <span className="text-xs text-slate-500">
                          No contact details
                        </span>
                      ) : null}
                    </button>
                  );
                })
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
                placeholder="Full name"
                className="h-11 border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-burgundy-500"
                autoFocus
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
                placeholder="name@example.com"
                className="h-11 border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-burgundy-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone" className="text-slate-300">
                Phone
              </Label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 700 000 000"
                className="h-11 border-slate-600 bg-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-burgundy-500"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              className="h-11 w-full bg-burgundy-500 font-bold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
              disabled={submitting || !name.trim()}
            >
              {submitting ? "Saving…" : "Save Customer"}
            </Button>
          </form>
        )}

        <Button
          variant="outline"
          className="h-11 w-full border-slate-600 bg-transparent text-white hover:bg-slate-700 hover:text-white"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
