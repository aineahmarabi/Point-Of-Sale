import { cn } from "@repo/ui/lib/utils";

type Tone = "green" | "slate" | "amber" | "red";

/** Map any status string to a consistent colour tone across all modules. */
const TONE_BY_STATUS: Record<string, Tone> = {
  // green — healthy / done
  active: "green",
  completed: "green",
  published: "green",
  received: "green",
  paid: "green",
  // amber — in progress / needs attention
  pending: "amber",
  draft: "amber",
  sent: "amber",
  partial: "amber",
  low: "amber",
  // slate — inactive / neutral
  inactive: "slate",
  voided: "slate",
  closed: "slate",
  open: "slate",
  // red — cancelled / failed
  archived: "red",
  cancelled: "red",
  refunded: "red",
  failed: "red",
};

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-100 text-green-800",
  slate: "bg-slate-100 text-slate-700",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_BY_STATUS[status.toLowerCase()] ?? "slate";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        TONE_CLASSES[tone],
      )}
    >
      {status}
    </span>
  );
}
