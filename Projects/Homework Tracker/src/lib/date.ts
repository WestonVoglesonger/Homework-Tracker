import { format, isToday, isPast, addDays, isBefore, parseISO } from "date-fns";

export function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  return format(d, "MMM d, yyyy p");
}

export function dueCategory(iso?: string | null) {
  if (!iso) return "none" as const;
  const d = parseISO(iso);
  if (isPast(d) && !isToday(d)) return "overdue" as const;
  if (isToday(d)) return "today" as const;
  if (isBefore(d, addDays(new Date(), 7))) return "upcoming" as const;
  return "later" as const;
}


