"use server";

import { db } from "@/lib/db";
import { goals, declarations, users, councils, weeklyMilestones } from "@/lib/db/schema";
import { getAuthUser, isHeadCoach,
} from "@/lib/auth/jwt";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { llmChat } from "@/lib/llm";
import { nerRedact, PRIVACY_CLAUSE } from "@/lib/utils/sanitize-pii";
import { assessLocalSemantic } from "@/lib/utils/semantic-similarity";

export interface MilestoneAlignmentData {
  weekNumber: number;
  milestoneDescription: string | null;
  actions: string | null;
}

export interface GoalAlignment {
  goalId: string;
  goalType: "enrollment" | "personal" | "professional";
  goalStatement: string;
  values: string | null;
  milestones: MilestoneAlignmentData[];
}

export interface AlignmentData {
  declaration: string | null;
  goals: GoalAlignment[];
}

export async function getStudentAlignment(studentId: string): Promise<AlignmentData> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Get declaration
  const [decl] = await db
    .select()
    .from(declarations)
    .where(eq(declarations.userId, studentId))
    .limit(1);

  // Get goals
  const studentGoals = await db
    .select({
      goalId: goals.id,
      goalType: goals.goalType,
      goalStatement: goals.goalStatement,
      values: goals.valuesDeclaration,
    })
    .from(goals)
    .where(eq(goals.userId, studentId));

  // Get milestones for all goals (for action plan alignment)
  const goalIds = studentGoals.map((g) => g.goalId);
  const allMilestones =
    goalIds.length > 0
      ? await db
          .select({
            goalId: weeklyMilestones.goalId,
            weekNumber: weeklyMilestones.weekNumber,
            milestoneDescription: weeklyMilestones.milestoneDescription,
            actions: weeklyMilestones.actions,
          })
          .from(weeklyMilestones)
          .where(inArray(weeklyMilestones.goalId, goalIds))
      : [];

  return {
    declaration: decl?.text ?? null,
    goals: studentGoals.map((g) => ({
      goalId: g.goalId,
      goalType: g.goalType as "enrollment" | "personal" | "professional",
      goalStatement: g.goalStatement,
      values: g.values,
      milestones: allMilestones
        .filter((m) => m.goalId === g.goalId)
        .map((m) => ({
          weekNumber: m.weekNumber,
          milestoneDescription: m.milestoneDescription,
          actions: m.actions,
        })),
    })),
  };
}

// ─── Coach: Update a student's declaration ──────────────────────

export async function updateDeclarationForStudent(studentId: string, text: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "coach" && user.role !== "head_coach") throw new Error("Forbidden: only coaches can update student declarations");

  if (!text || text.trim().length === 0) {
    return { success: false, error: "Declaration text is required" };
  }

  // Coaches: verify student is in their council. Head coaches can update any student.
  if (user.role === "coach") {
    const [council] = await db
      .select()
      .from(councils)
      .where(eq(councils.coachId, user.userId))
      .limit(1);

    if (council) {
      const [student] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, studentId), eq(users.councilId, council.id)))
        .limit(1);
      if (!student) throw new Error("Forbidden: student not in your council");
    } else {
      throw new Error("Forbidden: no council found");
    }
  }

  const now = new Date();
  const existing = await db
    .select()
    .from(declarations)
    .where(eq(declarations.userId, studentId))
    .orderBy(desc(declarations.updatedAt))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(declarations)
      .set({ text: text.trim(), updatedAt: now })
      .where(eq(declarations.id, existing[0].id));
  } else {
    await db.insert(declarations).values({
      id: createId(),
      userId: studentId,
      text: text.trim(),
      approvalStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/l3");
  return { success: true };
}

// ─── AI: Deep Declaration × Goal Fit Assessment ─────────────────

export interface DeclarationFitResult {
  overallScore: number;
  ambitionScore: number;
  thematicScore: number;
  specificityScore: number;
  measurabilityScore: number;
  analysis: string;
  suggestedTweak: string;
}

export async function assessGoalDeclarationFit(
  goalStatement: string,
  declaration: string,
  valuesDeclaration: string | null,
  goalType: string,
  declarationMeaning: string | null = null
): Promise<DeclarationFitResult> {
  // Local semantic similarity — no API required, always works
  const result = assessLocalSemantic(goalStatement, declaration, valuesDeclaration);

  return {
    overallScore: result.overallScore,
    ambitionScore: result.ambitionScore,
    thematicScore: result.thematicScore,
    specificityScore: result.specificityScore,
    measurabilityScore: result.measurabilityScore,
    analysis: result.analysis,
    suggestedTweak: result.suggestedTweak,
  };
}
