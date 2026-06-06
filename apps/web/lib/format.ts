/** Format a currency amount with comma thousands-separator. */
export function formatCurrency(amount: number, currency = "KES"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a number with comma thousands-separator (no currency prefix). */
export function formatNumber(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return value.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** @deprecated Use formatCurrency instead. Kept for compatibility. */
export function money(amount: number, currency = "KES"): string {
  return formatCurrency(amount, currency);
}

/** Capitalise the first letter of each word, lower-casing the rest. */
export function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

type NamedUser = {
  name?: { first: string; last: string } | null;
  email?: string;
} | null;

/** Full name (title-cased), falling back to email, then "—". */
export function cashierName(user?: NamedUser): string {
  if (!user) return "—";
  const first = user.name?.first?.trim() ?? "";
  const last = user.name?.last?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return titleCase(full);
  return user.email ?? "—";
}

/** First name only (title-cased), falling back to email, then "—". */
export function cashierFirstName(user?: NamedUser): string {
  if (!user) return "—";
  const first = user.name?.first?.trim() ?? "";
  if (first) return titleCase(first);
  return user.email ?? "—";
}
