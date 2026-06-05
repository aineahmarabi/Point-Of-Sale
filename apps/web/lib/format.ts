export function money(amount: number, currency = "KES"): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `${currency} ${value.toFixed(2)}`;
}

export function cashierName(user?: {
  name?: { first: string; last: string } | null;
  email?: string;
} | null): string {
  if (!user) return "—";
  return user.name ? `${user.name.first} ${user.name.last}` : (user.email ?? "—");
}
