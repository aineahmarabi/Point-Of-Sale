"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@repo/backend";
import { Button } from "@repo/ui/components/ui/button";
import { Modal } from "@/components/pos/modal";
import { notifySuccess, notifyError } from "@/lib/errors";

type ImportRow = {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  cost_price: number;
  selling_price: number;
  unit?: string;
  tax_rate?: number;
  status?: "active" | "draft" | "archived";
  is_service?: boolean;
};

type ResultRow = { name: string; status: "created" | "skipped"; reason?: string };

const REQUIRED_COLS = ["name", "selling_price"] as const;

const TEMPLATE_HEADERS = [
  "name", "description", "sku", "barcode",
  "cost_price", "selling_price", "unit",
  "tax_rate", "status", "is_service",
];

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ["Sample Product", "A great product", "SKU001", "", 100, 150, "piece", 16, "active", "FALSE"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "products-import-template.xlsx");
}

function parseRows(sheet: XLSX.WorkSheet): { rows: ImportRow[]; errors: string[] } {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  const rows: ImportRow[] = [];
  const errors: string[] = [];

  raw.forEach((r, i) => {
    const rowNum = i + 2;
    const name = String(r["name"] ?? "").trim();
    if (!name) { errors.push(`Row ${rowNum}: missing name`); return; }

    const selling_price = parseFloat(String(r["selling_price"] ?? "0"));
    if (isNaN(selling_price)) { errors.push(`Row ${rowNum}: invalid selling_price`); return; }

    const cost_price = parseFloat(String(r["cost_price"] ?? "0")) || 0;
    const tax_rate = r["tax_rate"] !== "" ? parseFloat(String(r["tax_rate"])) : undefined;
    const rawStatus = String(r["status"] ?? "").toLowerCase();
    const status = (["active", "draft", "archived"].includes(rawStatus)
      ? rawStatus
      : "active") as "active" | "draft" | "archived";
    const is_service =
      String(r["is_service"] ?? "").toLowerCase() === "true" ||
      String(r["is_service"] ?? "") === "1";

    rows.push({
      name,
      description: String(r["description"] ?? "").trim() || undefined,
      sku: String(r["sku"] ?? "").trim() || undefined,
      barcode: String(r["barcode"] ?? "").trim() || undefined,
      cost_price,
      selling_price,
      unit: String(r["unit"] ?? "").trim() || undefined,
      tax_rate: tax_rate != null && !isNaN(tax_rate) ? tax_rate : undefined,
      status,
      is_service,
    });
  });

  return { rows, errors };
}

export function ProductImportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const bulkCreate = useMutation(api.catalog.products.bulkCreate);

  function reset() {
    setPreview([]);
    setParseErrors([]);
    setResults(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const { rows, errors } = parseRows(ws);
      setPreview(rows);
      setParseErrors(errors);
      setResults(null);
    };
    reader.readAsBinaryString(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setImporting(true);
    try {
      const res = await bulkCreate({ products: preview });
      setResults(res);
      const created = res.filter((r) => r.status === "created").length;
      const skipped = res.filter((r) => r.status === "skipped").length;
      notifySuccess(`Import done: ${created} created, ${skipped} skipped.`);
    } catch (err) {
      const message =
        err instanceof ConvexError ? (err.data as string) : "Import failed.";
      notifyError(new Error(message));
    } finally {
      setImporting(false);
    }
  }

  const createdCount = results?.filter((r) => r.status === "created").length ?? 0;
  const skippedCount = results?.filter((r) => r.status === "skipped").length ?? 0;

  return (
    <Modal open={open} onClose={handleClose}>
      <div className="space-y-5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Import Products</h2>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            Download Template
          </Button>
        </div>

        <p className="text-muted-foreground text-sm">
          Upload an Excel (.xlsx) or CSV file. Required columns:{" "}
          <span className="font-medium">name</span>,{" "}
          <span className="font-medium">selling_price</span>. Optional:{" "}
          description, sku, barcode, cost_price, unit, tax_rate, status, is_service.
        </p>

        {!results && (
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-slate-50"
          />
        )}

        {parseErrors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="mb-1 font-medium">Parse errors:</p>
            <ul className="list-inside list-disc space-y-0.5">
              {parseErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {preview.length > 0 && !results && (
          <div>
            <p className="mb-2 text-sm font-medium">
              {preview.length} product{preview.length !== 1 ? "s" : ""} ready to import:
            </p>
            <div className="max-h-48 overflow-y-auto rounded border text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">SKU</th>
                    <th className="px-3 py-2 text-right font-medium">Cost</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 max-w-[160px] truncate">{row.name}</td>
                      <td className="px-3 py-1.5 text-slate-500">{row.sku ?? "—"}</td>
                      <td className="px-3 py-1.5 text-right">{row.cost_price}</td>
                      <td className="px-3 py-1.5 text-right">{row.selling_price}</td>
                      <td className="px-3 py-1.5 capitalize">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Import complete —{" "}
              <span className="text-green-700">{createdCount} created</span>
              {skippedCount > 0 && (
                <>, <span className="text-yellow-700">{skippedCount} skipped</span></>
              )}
            </p>
            {results.filter((r) => r.status === "skipped").length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded border text-xs">
                <table className="w-full">
                  <thead className="bg-yellow-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Skipped</th>
                      <th className="px-3 py-2 text-left font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.filter((r) => r.status === "skipped").map((r, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            {results ? "Close" : "Cancel"}
          </Button>
          {!results && (
            <Button
              className="flex-1"
              onClick={handleImport}
              disabled={importing || preview.length === 0 || parseErrors.length > 0}
            >
              {importing ? "Importing…" : `Import ${preview.length > 0 ? preview.length + " Products" : ""}`}
            </Button>
          )}
          {results && (
            <Button variant="outline" className="flex-1" onClick={reset}>
              Import Another File
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
