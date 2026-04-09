import { supabase } from "./supabase";

// Generate a coach ID (UUIDv4) — no login, so use random for anonymous coaches
export function generateCoachId(): string {
  return "coach_" + Math.random().toString(36).substring(2, 15);
}

// Get or create anonymous coach session (stored in localStorage)
export function getCoachId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("apa_coach_id");
  if (stored) return stored;
  const newId = generateCoachId();
  localStorage.setItem("apa_coach_id", newId);
  return newId;
}

// Fetch all students for coach
export async function fetchStudentsForCoach(coachId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("coach_id", coachId);

  if (error) {
    console.error("Error fetching students:", error);
    return [];
  }

  return data || [];
}

// Create new student
export async function createStudent(coachId: string, name: string) {
  const { data, error } = await supabase
    .from("students")
    .insert([{ coach_id: coachId, name }])
    .select();

  if (error) {
    console.error("Error creating student:", error);
    return null;
  }

  return data?.[0] || null;
}

// Update student name
export async function updateStudent(studentId: string, name: string) {
  const { error } = await supabase
    .from("students")
    .update({ name })
    .eq("id", studentId);

  if (error) {
    console.error("Error updating student:", error);
    return false;
  }

  return true;
}

// Save goal to DB
export async function saveGoalToDb(
  studentId: string,
  category: "enrollment" | "personal" | "professional",
  goal: {
    templateId: string;
    answers: Record<string, string>;
    pearStatement: string;
    declaration: string;
    declarationMeaning?: string;
  }
) {
  const { data: existing } = await supabase
    .from("goals")
    .select("id")
    .eq("student_id", studentId)
    .eq("templateId", goal.templateId)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from("goals")
      .update({
        answers: goal.answers,
        pearStatement: goal.pearStatement,
        declaration: goal.declaration,
        declarationMeaning: goal.declarationMeaning || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error("Error updating goal:", error);
      return false;
    }
    return true;
  } else {
    // Insert new
    const { error } = await supabase.from("goals").insert([
      {
        student_id: studentId,
        templateId: goal.templateId,
        answers: goal.answers,
        pearStatement: goal.pearStatement,
        declaration: goal.declaration,
        declarationMeaning: goal.declarationMeaning || "",
      },
    ]);

    if (error) {
      console.error("Error saving goal:", error);
      return false;
    }
    return true;
  }
}

// Load student goals from DB
export async function loadStudentGoals(studentId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("student_id", studentId);

  if (error) {
    console.error("Error loading goals:", error);
    return {};
  }

  const goals: Record<string, any> = {};
  for (const goal of data || []) {
    goals[goal.templateId] = {
      templateId: goal.templateId,
      answers: goal.answers,
      pearStatement: goal.pearStatement,
      declaration: goal.declaration,
      declarationMeaning: goal.declarationMeaning,
    };
  }

  return goals;
}
