"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import { Button } from "@repo/ui/components/ui/button";

import { money } from "@/lib/format";

export interface ReceiptLine {
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface ReceiptData {
  orderNumber: string;
  createdAt: number;
  cashierName: string;
  customerName?: string | null;
  items: ReceiptLine[];
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  paymentMethod: "cash" | "paybill" | "split";
  paymentReference: string;
  currency: string;
}

interface ReceiptProps {
  data: ReceiptData;
  onNewSale: () => void;
}

export function Receipt({ data, onNewSale }: ReceiptProps) {
  const settings = useQuery(api.settings.storeSettings.current);
  const created = new Date(data.createdAt);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white">
      <div className="mx-auto max-w-sm px-6 py-8">
        {/* receipt-printable: only this section is visible during window.print() */}
        <div
          id="pos-receipt"
          className="receipt-printable font-mono text-sm text-zinc-900"
        >
          {/* Header */}
          <div className="text-center">
            <p className="text-base font-bold">
              {settings?.store_name ?? "Store"}
            </p>
            {settings?.address && (
              <p className="text-xs">{settings.address}</p>
            )}
            {settings?.phone && <p className="text-xs">{settings.phone}</p>}
            {settings?.receipt_header && (
              <p className="mt-2 text-xs">{settings.receipt_header}</p>
            )}
          </div>

          <div className="my-3 border-t border-dashed" />

          {/* Meta */}
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Order</span>
              <span>{data.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span>{created.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cashier</span>
              <span>{data.cashierName}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span>Customer</span>
                <span>{data.customerName}</span>
              </div>
            )}
          </div>

          <div className="my-3 border-t border-dashed" />

          {/* Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left">
                <th className="pb-1 font-normal">Item</th>
                <th className="pb-1 text-center font-normal">Qty</th>
                <th className="pb-1 text-right font-normal">Price</th>
                <th className="pb-1 text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((line, i) => (
                <tr key={i}>
                  <td className="py-0.5 pr-1">{line.product_name}</td>
                  <td className="py-0.5 text-center tabular-nums">
                    {line.quantity}
                  </td>
                  <td className="py-0.5 text-right tabular-nums">
                    {line.unit_price.toFixed(2)}
                  </td>
                  <td className="py-0.5 text-right tabular-nums">
                    {line.line_total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="my-3 border-t border-dashed" />

          {/* Totals */}
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {money(data.subtotal, data.currency)}
              </span>
            </div>
            {data.discount_total > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="tabular-nums">
                  −{money(data.discount_total, data.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="tabular-nums">
                {money(data.tax_total, data.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">
                {money(data.grand_total, data.currency)}
              </span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed" />

          {/* Payment */}
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between">
              <span>Payment</span>
              <span>
                {data.paymentMethod === "cash"
                  ? "Cash"
                  : data.paymentMethod === "split"
                    ? "Split (Cash + M-Pesa)"
                    : "Paybill (M-Pesa)"}
              </span>
            </div>
            {data.paymentReference && (
              <div className="flex justify-between">
                <span>M-Pesa Ref</span>
                <span className="font-mono font-medium">
                  {data.paymentReference}
                </span>
              </div>
            )}
          </div>

          <div className="my-3 border-t border-dashed" />
          <p className="text-center text-xs">
            {settings?.receipt_footer ?? "Thank you for your purchase!"}
          </p>
        </div>

        {/* Actions (hidden when printing) */}
        <div className="mt-8 flex gap-3 print:hidden">
          <Button
            variant="outline"
            className="h-12 flex-1"
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button className="h-12 flex-1" onClick={onNewSale}>
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
}
