"use server";

import { db } from "@/lib/db";
import { goals, weeklyMilestones, councils, users } from "@/lib/db/schema";
import { getAuthUser, isHeadCoach } from "@/lib/auth/jwt";
import { canAccessStudent } from "@/lib/auth/access";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";
import { z } from "zod";

const createGoalSchema = z.object({
  goalType: z.enum(["enrollment", "personal", "professional"]),
  goalStatement: z.string().min(10).max(500),
  specificDetails: z.string().max(500).optional(),
  measurableCriteria: z.string().max(300).optional(),
  achievableResources: z.string().max(300).optional(),
  relevantAlignment: z.string().max(300).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  excitingMotivation: z.string().max(200).optional(),
  rewardingBenefits: z.string().max(200).optional(),
  valuesDeclaration: z.string().max(500).optional(),
});

export async function createGoal(
  formData: z.infer<typeof createGoalSchema>
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role !== "student" && user.role !== "council_leader") {
    throw new Error("Only students can create goals");
  }

  const validated = createGoalSchema.parse(formData);
  const now = new Date();

  await db.insert(goals).values({
    id: createId(),
    userId: user.userId,
    ...validated,
    status: "draft",
    approvalStatus: "pending",
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/l3");
  return { success: true };
}

export async function getMyGoals() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return db.select().from(goals).where(eq(goals.userId, user.userId));
}

export async function getStudentGoals(studentId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  if (!(await canAccessStudent(user, studentId))) {
    throw new Error("Forbidden");
  }

  const studentGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, studentId));

  const result = [];
  for (const goal of studentGoals) {
    const milestones = await db
      .select()
      .from(weeklyMilestones)
      .where(eq(weeklyMilestones.goalId, goal.id));

    result.push({
      ...goal,
      milestones: milestones.map((m) => ({
        id: m.id,
        weekNumber: m.weekNumber,
        weekStartDate: m.weekStartDate,
        weekEndDate: m.weekEndDate,
        milestoneDescription: m.milestoneDescription,
        actions: m.actions,
        results: m.results,
        cumulativePercentage: m.cumulativePercentage,
        approvalStatus: m.approvalStatus,
        approvedBy: m.approvedBy,
        reviewNote: m.reviewNote,
      })),
    });
  }

  return result;
}

export async function updateGoal(
  goalId: string,
  updates: Partial<z.infer<typeof createGoalSchema>>
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!goal) throw new Error("Goal not found");

  // Owner can edit their own goal - does NOT auto-reset approval
  // Student must explicitly submit for review via submitGoalForReview()
  if (goal.userId === user.userId) {
    await db
      .update(goals)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, goalId));

    revalidatePath("/l3");
    return { success: true };
  }

  // Coach can edit goals for students in their council
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
        .where(
          and(eq(users.id, goal.userId), eq(users.councilId, council.id))
        )
        .limit(1);
      if (student) {
        await db
          .update(goals)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(goals.id, goalId));

        revalidatePath("/l3");
        return { success: true };
      }
    }
  }

  // Head coach can edit any goal
  if (user.role === "head_coach") {
    await db
      .update(goals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(goals.id, goalId));

    revalidatePath("/l3");
    return { success: true };
  }

  throw new Error("Forbidden");
}
