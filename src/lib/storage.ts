"use client";

import type { Student, GoalRecord, GoalType } from "./types";
import { createId } from "@paralleldrive/cuid2";
import { supabase } from "./supabase";

const LEGACY_NAMES = ["Kinder", "MARY-G", "The Magnificents", "Student 1", "Student 2", "Student 3", "Student 4", "Student 5", "Student 6"];
const DEFAULT_NAMES = ["Student1", "Student2", "Student3", "Student4", "Student5", "Student6"];

// ── Students ──────────────────────────────────────────────────────────────────

export async function getStudents(): Promise<Student[]> {
  try {
    const { data, error } = await supabase.from("students").select("*").order("created_at");
    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      ggStudentId: row.gg_id || undefined,
    }));
  } catch (err) {
    console.error("getStudents error:", err);
    return [];
  }
}

export async function addStudent(name: string): Promise<Student> {
  const student: Student = { id: createId(), name: name.trim(), createdAt: new Date().toISOString() };
  try {
    const { error } = await supabase.from("students").insert([{ id: student.id, name: student.name, created_at: student.createdAt }]);
    if (error) throw error;
  } catch (err) {
    console.error("addStudent error:", err);
  }
  return student;
}

export async function updateStudentName(id: string, name: string): Promise<void> {
  try {
    const { error } = await supabase.from("students").update({ name: name.trim() }).eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("updateStudentName error:", err);
  }
}

export async function updateStudentGGId(id: string, ggStudentId: string): Promise<void> {
  try {
    const { error } = await supabase.from("students").update({ gg_id: ggStudentId }).eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("updateStudentGGId error:", err);
  }
}

export async function deleteStudent(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("deleteStudent error:", err);
  }
}

// ── Goal Records ──────────────────────────────────────────────────────────────

export async function getGoalRecord(studentId: string, goalType: GoalType): Promise<GoalRecord | null> {
  try {
    const { data, error } = await supabase
      .from("goal_records")
      .select("record")
      .eq("student_id", studentId)
      .eq("goal_type", goalType)
      .single();
    if (error && error.code === "PGRST116") return null; // No rows
    if (error) throw error;
    return data ? (data.record as GoalRecord) : null;
  } catch (err) {
    console.error("getGoalRecord error:", err);
    return null;
  }
}

export async function saveGoalRecord(record: GoalRecord): Promise<void> {
  try {
    const recordWithTimestamp = { ...record, savedAt: new Date().toISOString() };
    const { error } = await supabase.from("goal_records").upsert(
      { student_id: record.studentId, goal_type: record.goalType, record: recordWithTimestamp },
      { onConflict: "student_id,goal_type" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("saveGoalRecord error:", err);
  }
}

export async function deleteGoalRecord(studentId: string, goalType: GoalType): Promise<void> {
  try {
    const { error } = await supabase
      .from("goal_records")
      .delete()
      .eq("student_id", studentId)
      .eq("goal_type", goalType);
    if (error) throw error;
  } catch (err) {
    console.error("deleteGoalRecord error:", err);
  }
}

// ── Milestone done-state (stored in answers) ──────────────────────────────────

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
  // This is called synchronously from components after they've already fetched the record
  // The actual save happens via saveGoalRecord() after updating answers
  // This just modifies the in-memory answers object
}

// ── Student declaration ───────────────────────────────────────────────────────

export async function getStudentDeclaration(studentId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("declarations")
      .select("text")
      .eq("student_id", studentId)
      .single();
    if (error && error.code === "PGRST116") return ""; // No rows
    if (error) throw error;
    return data?.text || "";
  } catch (err) {
    console.error("getStudentDeclaration error:", err);
    return "";
  }
}

export async function setStudentDeclaration(studentId: string, text: string): Promise<void> {
  try {
    const { error } = await supabase.from("declarations").upsert(
      { student_id: studentId, text: text.trim() },
      { onConflict: "student_id" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("setStudentDeclaration error:", err);
  }
}

// ── Coach / Council info ──────────────────────────────────────────────────────

export async function getCoachInfo(): Promise<{ coachName: string; councilName: string }> {
  try {
    const { data, error } = await supabase.from("coach_settings").select("key,value").in("key", ["coach_name", "council_name"]);
    if (error) throw error;
    const map = new Map(data?.map(row => [row.key, row.value]) || []);
    return {
      coachName: map.get("coach_name") || "",
      councilName: map.get("council_name") || "",
    };
  } catch (err) {
    console.error("getCoachInfo error:", err);
    return { coachName: "", councilName: "" };
  }
}

export async function setCoachInfo(coachName: string, councilName: string): Promise<void> {
  try {
    await supabase.from("coach_settings").upsert([
      { key: "coach_name", value: coachName.trim() },
      { key: "council_name", value: councilName.trim() },
    ], { onConflict: "key" });
  } catch (err) {
    console.error("setCoachInfo error:", err);
  }
}

// ── Seed default students if storage is empty ─────────────────────────────────

export async function seedDefaultStudents(): Promise<void> {
  try {
    const existing = await getStudents();

    // Auto-migrate: if ONLY legacy demo names exist, replace with defaults
    if (existing.length > 0 && existing.every(s => LEGACY_NAMES.includes(s.name))) {
      for (const s of existing) await deleteStudent(s.id);
      for (const name of DEFAULT_NAMES) await addStudent(name);
      return;
    }

    if (existing.length > 0) return;
    for (const name of DEFAULT_NAMES) await addStudent(name);
  } catch (err) {
    console.error("seedDefaultStudents error:", err);
  }
}
