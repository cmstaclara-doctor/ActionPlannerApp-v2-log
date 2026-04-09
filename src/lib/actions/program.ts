// Minimal stub — types only needed by attendance.ts
export interface ProgramEvent {
  id: string;
  name: string;
  date: string;
  type?: "event" | "intensive" | "breakfast";
}
