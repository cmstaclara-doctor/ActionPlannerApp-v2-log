// Minimal stub — only the type used by students.ts
export type WeekHistoryEntry = {
  week: number;
  enrollment: { results: number; actionPlan: number };
  personal: { results: number; actionPlan: number };
  professional: { results: number; actionPlan: number };
  total: { results: number; actionPlan: number };
};
