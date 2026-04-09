// Locked week targets for a 12-week program.
// W1 = Action Plan, W2-W10 = cumulative result % range, W11 = 100%, W12 = Enjoy

export function getWeekTarget(weekNumber: number): {
  label: string;
  min: number | null;
  max: number | null;
} {
  if (weekNumber === 1) return { label: "Action Plan", min: null, max: null };
  if (weekNumber >= 2 && weekNumber <= 10) {
    const min = (weekNumber - 1) * 10;
    const max = weekNumber * 10;
    return { label: `${min}–${max}%`, min, max };
  }
  if (weekNumber === 11) return { label: "100%", min: 100, max: 100 };
  return { label: "Enjoy", min: null, max: null }; // W12+
}

export type TargetStatus = "met" | "needs_attention" | "action_plan" | "enjoy";

export function getTargetStatus(resultsAvg: number, weekNumber: number): TargetStatus {
  const target = getWeekTarget(weekNumber);
  if (target.min === null) return weekNumber <= 1 ? "action_plan" : "enjoy";
  return resultsAvg >= target.min ? "met" : "needs_attention";
}

/**
 * Compute the actual current week number from today's date vs batch start.
 * Week 1 = the week the batch started. Always based on real calendar, not DB setting.
 */
export function computeCurrentWeekFromDate(batchStartDate: string, totalWeeks = 12): number {
  const [y, m, d] = batchStartDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  const today = new Date();
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.max(1, Math.min(totalWeeks, week));
}

// Compute Mon–Sun date strings (YYYY-MM-DD) for week N, given batch start date (Monday)
export function getWeekDatesFromBatch(
  batchStartDate: string,
  weekNumber: number
): { startDate: string; endDate: string } {
  const [y, m, d] = batchStartDate.split("-").map(Number);
  const base = new Date(y, m - 1, d);
  const start = new Date(base);
  start.setDate(base.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

// Format a YYYY-MM-DD string as "Mon, Mar 16, 2026"
export function formatWeekDate(dateStr: string): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${days[dt.getDay()]}, ${months[m - 1]} ${d}, ${y}`;
}
