"use server";

import { db } from "@/lib/db";
import { users, goals } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { llmChat } from "@/lib/llm";
import { nerRedact, PRIVACY_CLAUSE } from "@/lib/utils/sanitize-pii";

// 12-category Life Assessment Wheel (MWF.v5)
// Personal A–F  |  Professional G–L
// Enrollment goal ← F (experiencing/aliveness) + L (essence/beingness/purpose)
type AreaKey =
  | "physical_health" | "mental_wellness" | "relationships" | "romance"
  | "family_home" | "fun_recreation"
  | "career_satisfaction" | "work_environment" | "skills_abilities"
  | "income_finances" | "professional_growth" | "purpose_spirituality";

const AREA_LABELS: Record<AreaKey, string> = {
  physical_health:    "A. Physical Health",
  mental_wellness:    "B. Mental Wellness",
  relationships:      "C. Relationships",
  romance:            "D. Romance",
  family_home:        "E. Family & Home",
  fun_recreation:     "F. Fun & Recreation",
  career_satisfaction:  "G. Career Satisfaction",
  work_environment:     "H. Work Environment",
  skills_abilities:     "I. Skills & Abilities",
  income_finances:      "J. Income & Finances",
  professional_growth:  "K. Professional Growth",
  purpose_spirituality: "L. Purpose & Spirituality",
};

const PERSONAL_KEYS: AreaKey[]      = ["physical_health","mental_wellness","relationships","romance","family_home","fun_recreation"];
const PROFESSIONAL_KEYS: AreaKey[]  = ["career_satisfaction","work_environment","skills_abilities","income_finances","professional_growth","purpose_spirituality"];
const ENROLLMENT_KEYS: AreaKey[]    = ["relationships","purpose_spirituality"]; // C + L — relationships + essence/beingness/purpose

export async function generateWheelGoals(
  studentId: string,
  scores: Record<AreaKey, number>,
  declaration: string | null
): Promise<{ enrollment: string; personal: string; professional: string }> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({ wheelOfLife: JSON.stringify(scores), updatedAt: new Date() })
    .where(eq(users.id, studentId));

  function section(keys: AreaKey[]) {
    return keys
      .map((k) => `  ${AREA_LABELS[k]}: ${scores[k]}/10`)
      .join("\n");
  }

  const safeDeclaration = await nerRedact(declaration || "");

  const prompt = `${PRIVACY_CLAUSE}

You are a LEAP 99 life coaching AI. Based on the student's 12-area Life Assessment Wheel (MWF.v5) and their personal declaration, craft THREE concise, inspiring goal statements.

Student Declaration: "${safeDeclaration || "Not yet set"}"

PERSONAL WHEEL (A–F):
${section(PERSONAL_KEYS)}

PROFESSIONAL WHEEL (G–L):
${section(PROFESSIONAL_KEYS)}

Goal mapping:
- ENROLLMENT goal = drawn from C (Relationships — who they are with others, who they are enrolling into their vision) and L (Purpose & Spirituality — essence, beingness, what they stand for). This goal is about WHO THE STUDENT IS BEING — their beingness, essence qualities, and how they show up in relationship with others and in service of their deeper purpose.
- PERSONAL goal = drawn from the Personal Wheel (A–F). Focus on the LOWEST scoring areas.
- PROFESSIONAL goal = drawn from the Professional Wheel (G–L). Focus on the LOWEST scoring areas.

Rules:
- Each goal = 1–2 sentences, specific and action-oriented
- Enrollment goal must use identity language ("I am...", essence qualities, beingness) — NOT just financial
- Goals must connect to the declaration if provided
- Tone: empowering, identity-based, LEAP 99 coaching style
- Lowest scores = greatest need = highest priority

Respond ONLY in this exact JSON (no markdown):
{"enrollment":"...","personal":"...","professional":"..."}`;

  const text = await llmChat([{ role: "user", content: prompt }], { tier: "fast", maxTokens: 400 });
  try {
    const parsed = JSON.parse(text.trim());
    return {
      enrollment: parsed.enrollment || "",
      personal: parsed.personal || "",
      professional: parsed.professional || "",
    };
  } catch {
    return { enrollment: "", personal: "", professional: "" };
  }
}

export async function saveWheelGoals(
  studentId: string,
  scores: Record<AreaKey, number>,
  goalStatements: { enrollment: string; personal: string; professional: string }
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Save wheel scores
  await db
    .update(users)
    .set({ wheelOfLife: JSON.stringify(scores), updatedAt: new Date() })
    .where(eq(users.id, studentId));

  const now = new Date();
  const types = ["enrollment", "personal", "professional"] as const;

  for (const goalType of types) {
    const statement = goalStatements[goalType];
    if (!statement?.trim()) continue;

    // Upsert: update goalStatement if goal exists, insert if not
    const [existing] = await db
      .select({ id: goals.id })
      .from(goals)
      .where(and(eq(goals.userId, studentId), eq(goals.goalType, goalType)))
      .limit(1);

    if (existing) {
      await db
        .update(goals)
        .set({ goalStatement: statement, updatedAt: now })
        .where(eq(goals.id, existing.id));
    } else {
      await db.insert(goals).values({
        id: createId(),
        userId: studentId,
        goalType,
        goalStatement: statement,
        status: "draft",
        approvalStatus: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return { success: true };
}

export async function improveSmarterField(
  fieldKey: string,
  fieldLabel: string,
  issue: string,
  currentValue: string,
  goalType: string,
  declaration: string | null,
  goalStatement: string | null
): Promise<{ improved: string; explanation: string }> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const goalTypeLabel =
    goalType === "enrollment" ? "Enrollment (career / financial / business)" :
    goalType === "personal"   ? "Personal (health / relationships / wellbeing)" :
                                "Professional (skills / leadership / learning)";

  const [safeDeclaration2, safeGoalStatement, safeCurrentValue] = await Promise.all([
    nerRedact(declaration || ""),
    nerRedact(goalStatement || ""),
    nerRedact(currentValue),
  ]);

  const prompt = `${PRIVACY_CLAUSE}

You are a LEAP 99 life coaching AI. A student's SMARTER goal field needs improvement.

Student's declaration: "${safeDeclaration2 || "Not yet set"}"
Goal type: ${goalTypeLabel}
Current goal statement: "${safeGoalStatement || "Not yet set"}"

Field being edited: ${fieldLabel}
Current value: "${safeCurrentValue}"
Issue found: ${issue}

Rewrite this single field to fix the issue. Keep the student's original intent and context. Make it specific, concrete, emotionally grounded, and aligned with their declaration.

Rules:
- Fix exactly what the issue flagged (add number, tracking method, emotional depth, baseline, deadline, etc.)
- Keep the student's topic — don't invent new goals
- Match LEAP 99 tone: empowering, personal, action-oriented
- Do NOT rewrite the full goal statement — only this one field

Respond ONLY in this exact JSON (no markdown, no extra text):
{"improved":"...","explanation":"One sentence: what changed and why"}`;

  const text = await llmChat([{ role: "user", content: prompt }], { tier: "fast", maxTokens: 300 });
  try {
    const parsed = JSON.parse(text.trim());
    return {
      improved: parsed.improved || "",
      explanation: parsed.explanation || "",
    };
  } catch {
    return { improved: "", explanation: "" };
  }
}
