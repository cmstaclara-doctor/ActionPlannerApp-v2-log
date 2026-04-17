"use client";
// ─── localStorage CRUD for APA ────────────────────────────────────────────────

import type { Student, GoalRecord, GoalType } from "./types";
import { createId } from "@paralleldrive/cuid2";

const STUDENTS_KEY = "apa_students";

function goalKey(studentId: string, goalType: GoalType): string {
  return `apa_goal_${studentId}_${goalType}`;
}

// ── Students ──────────────────────────────────────────────────────────────────

export function getStudents(): Student[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addStudent(name: string): Student {
  const student: Student = { id: createId(), name: name.trim(), createdAt: new Date().toISOString() };
  const all = getStudents();
  all.push(student);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
  return student;
}

export function updateStudentName(id: string, name: string): void {
  const all = getStudents().map(s => s.id === id ? { ...s, name: name.trim() } : s);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
}

export function updateStudentGGId(id: string, ggStudentId: string): void {
  const all = getStudents().map(s => s.id === id ? { ...s, ggStudentId } : s);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
}

export function deleteStudent(id: string): void {
  const all = getStudents().filter(s => s.id !== id);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all));
  // Also remove all goal records for this student
  for (const gt of ["enrollment", "personal", "professional"] as GoalType[]) {
    localStorage.removeItem(goalKey(id, gt));
  }
}

// ── Goal Records ──────────────────────────────────────────────────────────────

export function getGoalRecord(studentId: string, goalType: GoalType): GoalRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(goalKey(studentId, goalType));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveGoalRecord(record: GoalRecord): void {
  const key = goalKey(record.studentId, record.goalType);
  localStorage.setItem(key, JSON.stringify({ ...record, savedAt: new Date().toISOString() }));
}

export function deleteGoalRecord(studentId: string, goalType: GoalType): void {
  localStorage.removeItem(goalKey(studentId, goalType));
}

// ── Milestone done-state (stored in answers) ──────────────────────────────────
// Key format: ms_{week}_{actionIndex}_done = "true"

export function getMilestoneDone(answers: Record<string, string>, week: number, actionIndex: number): boolean {
  return answers[`ms_${week}_${actionIndex}_done`] === "true";
}

export function setMilestoneDone(
  studentId: string,
  goalType: GoalType,
  week: number,
  actionIndex: number,
  done: boolean
): void {
  const record = getGoalRecord(studentId, goalType);
  if (!record) return;
  const answers = { ...record.answers, [`ms_${week}_${actionIndex}_done`]: done ? "true" : "false" };
  saveGoalRecord({ ...record, answers });
}

// ── Student declaration ───────────────────────────────────────────────────────

export function getStudentDeclaration(studentId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(`apa_decl_${studentId}`) || "";
}

export function setStudentDeclaration(studentId: string, text: string): void {
  localStorage.setItem(`apa_decl_${studentId}`, text.trim());
}

// ── Coach / Council info ──────────────────────────────────────────────────────

export function getCoachInfo(): { coachName: string; councilName: string } {
  if (typeof window === "undefined") return { coachName: "", councilName: "" };
  return {
    coachName:   localStorage.getItem("apa_coach_name")   || "",
    councilName: localStorage.getItem("apa_council_name") || "",
  };
}

export function setCoachInfo(coachName: string, councilName: string): void {
  localStorage.setItem("apa_coach_name",   coachName.trim());
  localStorage.setItem("apa_council_name", councilName.trim());
}

// ── Seed default students if storage is empty ─────────────────────────────────

const LEGACY_NAMES = ["Kinder", "MARY-G", "The Magnificents", "Student 1", "Student 2", "Student 3", "Student 4", "Student 5", "Student 6"];
const DEFAULT_NAMES = ["Student1", "Student2", "Student3", "Student4", "Student5", "Student6"];

export function seedDefaultStudents(): void {
  const existing = getStudents();

  // Auto-migrate: if ONLY legacy demo names exist, replace with defaults
  if (existing.length > 0 && existing.every(s => LEGACY_NAMES.includes(s.name))) {
    for (const s of existing) deleteStudent(s.id);
    for (const name of DEFAULT_NAMES) addStudent(name);
    return;
  }

  if (existing.length > 0) return;
  for (const name of DEFAULT_NAMES) addStudent(name);
}
