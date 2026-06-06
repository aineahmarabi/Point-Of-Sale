"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import type { Doc } from "@repo/backend/dataModel";
import { useData } from "@repo/auth/hooks";
import { cn } from "@repo/ui/lib/utils";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

import { Modal } from "./modal";
import { Receipt, type ReceiptData } from "./receipt";
import { useCart } from "@/context/cart-context";
import { money, cashierName } from "@/lib/format";
import { notifyError } from "@/lib/errors";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  session: Doc<"sessions">;
  currency: string;
}

type Phase = "form" | "processing" | "success";
type Method = "cash" | "paybill" | "split";

function genInternalRef(): string {
  return `MPESA-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
}

export function PaymentModal({
  open,
  onClose,
  session,
  currency,
}: PaymentModalProps) {
  const { currentUser } = useData();
  const {
    items,
    subtotal,
    discount_total,
    tax_total,
    grand_total,
    customer,
    clearCart,
  } = useCart();

  const createOrder = useMutation(api.pos.orders.create);
  const createOrderItem = useMutation(api.pos.orderItems.create);
  const createPayment = useMutation(api.pos.payments.create);
  const adjustStock = useMutation(api.catalog.inventory.adjustStock);

  const [method, setMethod] = useState<Method>("paybill");
  const [mpesaRef, setMpesaRef] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [internalRef, setInternalRef] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (open) {
      setMethod("paybill");
      setMpesaRef("");
      setCashAmount(grand_total.toFixed(2));
      setInternalRef(genInternalRef());
      setPhase("form");
      setError(null);
      setReceipt(null);
      setShowReceipt(false);
      setOrderNumber("");
    }
    // Prefill should reflect the total at the moment the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const cashNum = cashAmount === "" ? 0 : Number(cashAmount);
  const change = cashNum - grand_total; // cash: amount received over total
  const splitMpesaAmount = Math.max(0, grand_total - cashNum); // split remainder
  const effectiveRef = mpesaRef.trim() || internalRef;

  // Per-method validity.
  const cashShort = method === "cash" && cashNum < grand_total;
  const splitOverpaid = method === "split" && cashNum > grand_total;
  const canConfirm =
    !!currentUser &&
    phase !== "processing" &&
    items.length > 0 &&
    !cashShort &&
    !splitOverpaid;

  async function handleConfirm() {
    if (!currentUser || !canConfirm) return;
    setPhase("processing");
    setError(null);
    try {
      const number = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const completedAt = Date.now();
      const usesMpesa = method === "paybill" || method === "split";
      const reference = usesMpesa ? effectiveRef : undefined;

      const orderId = await createOrder({
        order_number: number,
        session_id: session._id,
        cashier_id: currentUser._id,
        ...(customer ? { customer_id: customer._id } : {}),
        status: "completed",
        subtotal,
        discount_total,
        tax_total,
        grand_total,
        payment_method: method,
        ...(reference ? { payment_reference: reference } : {}),
        completed_at: completedAt,
      });

      for (const item of items) {
        await createOrderItem({
          order_id: orderId,
          product_id: item.product_id,
          ...(item.variant_id ? { variant_id: item.variant_id } : {}),
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          line_total: item.line_total,
          tax_amount: item.tax_amount,
        });
      }

      // Payment rows. The payments table has no "split" method, so a split
      // sale is recorded as one cash payment + one paybill payment.
      if (method === "cash") {
        await createPayment({
          order_id: orderId,
          method: "cash",
          amount: grand_total,
          status: "completed",
        });
      } else if (method === "paybill") {
        await createPayment({
          order_id: orderId,
          method: "paybill",
          amount: grand_total,
          reference: effectiveRef,
          status: "completed",
        });
      } else {
        // split
        if (cashNum > 0) {
          await createPayment({
            order_id: orderId,
            method: "cash",
            amount: cashNum,
            status: "completed",
          });
        }
        if (splitMpesaAmount > 0) {
          await createPayment({
            order_id: orderId,
            method: "paybill",
            amount: splitMpesaAmount,
            reference: effectiveRef,
            status: "completed",
          });
        }
      }

      for (const item of items) {
        await adjustStock({
          product_id: item.product_id,
          ...(item.variant_id ? { variant_id: item.variant_id } : {}),
          quantity: item.quantity,
        });
      }

      const data: ReceiptData = {
        orderNumber: number,
        createdAt: completedAt,
        cashierName: cashierName(currentUser),
        customerName: customer?.name ?? null,
        items: items.map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          line_total: i.line_total,
        })),
        subtotal,
        discount_total,
        tax_total,
        grand_total,
        paymentMethod: method,
        paymentReference: usesMpesa ? effectiveRef : "",
        currency,
      };

      setReceipt(data);
      setOrderNumber(number);
      clearCart();
      setPhase("success");
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? (err.data as string)
          : "Payment failed. Please try again.";
      setError(message);
      notifyError(err);
      setPhase("form");
    }
  }

  function handleNewSale() {
    setShowReceipt(false);
    setPhase("form");
    onClose();
  }

  if (showReceipt && receipt) {
    return <Receipt data={receipt} onNewSale={handleNewSale} />;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={phase !== "processing"}
      className="bg-slate-800 text-slate-100 sm:border sm:border-slate-700"
    >
      {phase === "success" ? (
        <div className="space-y-6 p-8 text-center">
          <div className="animate-checkmark mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-3xl text-green-400">
            ✓
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Sale Complete</h2>
            <p className="mt-1 text-sm text-slate-400">Order {orderNumber}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1 border-slate-600 bg-transparent text-slate-200 hover:bg-slate-700"
              onClick={() => setShowReceipt(true)}
            >
              Print Receipt
            </Button>
            <Button
              className="h-12 flex-1 bg-burgundy-500 font-bold text-white hover:bg-burgundy-600"
              onClick={handleNewSale}
            >
              New Sale
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 p-6">
          {/* Total */}
          <div className="rounded-xl bg-slate-900/60 py-5 text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-400">
              Total Due
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-white">
              {money(grand_total, currency)}
            </p>
          </div>

          {/* Payment method */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Payment Method
            </p>
            <div className="grid grid-cols-3 gap-2">
              <MethodCard
                active={method === "cash"}
                onClick={() => setMethod("cash")}
                title="Cash"
              />
              <MethodCard
                active={method === "paybill"}
                onClick={() => setMethod("paybill")}
                title="Paybill"
                subtitle="M-Pesa"
              />
              <MethodCard
                active={method === "split"}
                onClick={() => setMethod("split")}
                title="Split"
                subtitle="Cash + M-Pesa"
              />
            </div>
          </div>

          {/* CASH */}
          {method === "cash" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cash-received" className="text-slate-300">
                  Amount Received
                </Label>
                <Input
                  id="cash-received"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-12 border-slate-600 bg-slate-900 text-lg font-semibold text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                  autoFocus
                />
              </div>
              {change > 0 && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-300">
                    Change Due
                  </span>
                  <span className="text-2xl font-bold tabular-nums text-emerald-400">
                    {money(change, currency)}
                  </span>
                </div>
              )}
              {cashShort && (
                <p className="text-sm text-amber-400">
                  Amount received is less than the total due.
                </p>
              )}
            </div>
          )}

          {/* PAYBILL */}
          {method === "paybill" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mpesa-ref" className="text-slate-300">
                  M-Pesa Ref (optional)
                </Label>
                <Input
                  id="mpesa-ref"
                  value={mpesaRef}
                  maxLength={10}
                  onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. 9P2X"
                  className="h-12 border-slate-600 bg-slate-900 font-mono text-lg uppercase text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Internal Ref</Label>
                <Input
                  value={internalRef}
                  readOnly
                  className="h-12 border-slate-700 bg-slate-900/50 font-mono text-lg text-slate-400"
                />
              </div>
            </div>
          )}

          {/* SPLIT */}
          {method === "split" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="split-cash" className="text-slate-300">
                  Cash Amount
                </Label>
                <Input
                  id="split-cash"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="h-12 border-slate-600 bg-slate-900 text-lg font-semibold text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-3">
                <span className="text-sm font-medium text-slate-400">
                  M-Pesa Amount
                </span>
                <span className="text-lg font-bold tabular-nums text-white">
                  {money(splitMpesaAmount, currency)}
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="split-mpesa-ref" className="text-slate-300">
                  M-Pesa Ref (optional)
                </Label>
                <Input
                  id="split-mpesa-ref"
                  value={mpesaRef}
                  maxLength={10}
                  onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                  placeholder="e.g. 9P2X"
                  className="h-12 border-slate-600 bg-slate-900 font-mono text-lg uppercase text-white placeholder:text-slate-500 focus-visible:ring-burgundy-500"
                />
              </div>
              {splitOverpaid && (
                <p className="text-sm text-amber-400">
                  Cash amount cannot exceed the total due.
                </p>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="space-y-2">
            <Button
              className="h-14 w-full bg-burgundy-500 text-lg font-bold text-white hover:bg-burgundy-600 disabled:bg-slate-600 disabled:text-slate-400"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              {phase === "processing"
                ? "Processing…"
                : `Confirm · ${money(grand_total, currency)}`}
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full text-slate-400 hover:bg-slate-700 hover:text-white"
              onClick={onClose}
              disabled={phase === "processing"}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function MethodCard({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition",
        active
          ? "border-burgundy-500 bg-burgundy-500/10 text-white"
          : "border-slate-600 bg-slate-900/50 text-slate-300 hover:border-slate-500 hover:bg-slate-700",
      )}
    >
      <span className="text-sm font-bold">{title}</span>
      {subtitle && <span className="mt-0.5 text-xs text-slate-400">{subtitle}</span>}
    </button>
  );
}
