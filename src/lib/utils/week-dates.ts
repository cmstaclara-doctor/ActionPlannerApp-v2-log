// LEAP 99 — 8-week execution window
// Week 1: Apr 27–May 3, 2026 | Week 8 ends Jun 19, 2026 (3rd Intensive / Graduation)
const WEEK1_START = new Date(2026, 3, 27); // April 27, 2026 (Monday)
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Returns "Apr 27–May 3" style inclusive date range for a given 1-based week number. */
export function getWeekDates(weekNumber: number): string {
  const start = new Date(WEEK1_START);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  // W8 officially ends Jun 19 (Graduation day), not Jun 21
  end.setDate(end.getDate() + (weekNumber === 8 ? 5 : 6));
  const startStr = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  const endStr =
    start.getMonth() === end.getMonth()
      ? `${end.getDate()}`
      : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
  return `${startStr}–${endStr}`;
}
