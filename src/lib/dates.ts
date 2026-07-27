import { addDays, format, parseISO } from "date-fns";

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function monthRange(monthStr?: string): { start: string; endExclusive: string } {
  const now = new Date();
  const [y, m] = (monthStr ?? format(now, "yyyy-MM")).split("-").map(Number);
  const start = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
  const nextY = m === 12 ? y + 1 : y;
  const nextM = m === 12 ? 1 : m + 1;
  const endExclusive = `${String(nextY).padStart(4, "0")}-${String(nextM).padStart(2, "0")}-01`;
  return { start, endExclusive };
}

export function previousMonth(monthStr?: string): string {
  const now = new Date();
  const [y, m] = (monthStr ?? format(now, "yyyy-MM")).split("-").map(Number);
  const py = m === 1 ? y - 1 : y;
  const pm = m === 1 ? 12 : m - 1;
  return `${String(py).padStart(4, "0")}-${String(pm).padStart(2, "0")}`;
}

export function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}

/**
 * Defends against a common LLM date-arithmetic mistake: passing the same
 * start_date and end_date for a "today"/single-day question. Our range
 * convention is start-inclusive, end-EXCLUSIVE, so start === end always
 * matches zero rows. If that happens, bump end_date to the next day so the
 * intended single day is actually included.
 */
export function normalizeExclusiveRange(startDate: string, endDate: string): { start: string; end: string } {
  if (endDate <= startDate) {
    return { start: startDate, end: format(addDays(parseISO(startDate), 1), "yyyy-MM-dd") };
  }
  return { start: startDate, end: endDate };
}
