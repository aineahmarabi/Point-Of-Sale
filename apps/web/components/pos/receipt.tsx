"use client";

import { useQuery } from "convex/react";
import { api } from "@repo/backend";
import { Button } from "@repo/ui/components/ui/button";

import { formatCurrency, formatNumber } from "@/lib/format";

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
        <div id="receipt-print-area" className="font-mono text-sm text-zinc-900">
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
                    {formatNumber(line.unit_price)}
                  </td>
                  <td className="py-0.5 text-right tabular-nums">
                    {formatNumber(line.line_total)}
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
                {formatCurrency(data.subtotal, data.currency)}
              </span>
            </div>
            {data.discount_total > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span className="tabular-nums">
                  −{formatCurrency(data.discount_total, data.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="tabular-nums">
                {formatCurrency(data.tax_total, data.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">
                {formatCurrency(data.grand_total, data.currency)}
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

        <div className="no-print flex gap-3 mt-6 justify-center">
          <button
            className="border-2 border-slate-300 text-slate-700 bg-white font-semibold px-6 py-2 rounded-lg hover:bg-slate-50"
            onClick={() => window.print()}
          >
            Print
          </button>
          <Button className="h-10 px-6" onClick={onNewSale}>
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
}
