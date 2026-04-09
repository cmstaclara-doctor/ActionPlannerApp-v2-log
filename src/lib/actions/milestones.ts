"use server";

import { db } from "@/lib/db";
import { weeklyMilestones, goals, councils, users } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";

// Helper: verify user can edit this goal's milestones
async function canEditGoalMilestones(
  userId: string,
  userRole: string,
  goalId: string
): Promise<boolean> {
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);
  if (!goal) return false;

  // Owner can always edit their own milestones
  if (goal.userId === userId) return true;

  // Coach can edit milestones for students in their council
  if (userRole === "coach") {
    const [council] = await db
      .select()
      .from(councils)
      .where(eq(councils.coachId, userId))
      .limit(1);
    if (!council) return false;
    const [student] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, goal.userId), eq(users.councilId, council.id)))
      .limit(1);
    return !!student;
  }

  // Head coach can edit any milestone
  if (userRole === "head_coach") return true;

  return false;
}

export async function updateMilestone(
  goalId: string,
  weekNumber: number,
  updates: {
    milestoneDescription?: string;
    actions?: string;
    results?: string;
    cumulativePercentage?: number;
    supportNeeded?: string;
  }
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Ownership/permission check
  const allowed = await canEditGoalMilestones(user.userId, user.role, goalId);
  if (!allowed) throw new Error("Forbidden: you cannot edit this milestone");

  const existing = await db
    .select()
    .from(weeklyMilestones)
    .where(
      and(
        eq(weeklyMilestones.goalId, goalId),
        eq(weeklyMilestones.weekNumber, weekNumber)
      )
    )
    .limit(1);

  const now = new Date();

  // Auto-calculate cumulative percentage from actions/results
  if (updates.actions || updates.results) {
    const actionsData = updates.actions
      ? JSON.parse(updates.actions)
      : existing[0]?.actions
      ? JSON.parse(existing[0].actions)
      : [];
    const resultsData = updates.results
      ? JSON.parse(updates.results)
      : existing[0]?.results
      ? JSON.parse(existing[0].results)
      : [];

    const totalItems = actionsData.length + resultsData.length;
    const checkedItems =
      actionsData.filter((a: { done: boolean }) => a.done).length +
      resultsData.filter((r: { done: boolean }) => r.done).length;

    updates.cumulativePercentage =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  }

  // Determine if this should reset approval (student editing their own)
  const [goal] = await db
    .select()
    .from(goals)
    .where(eq(goals.id, goalId))
    .limit(1);
  const isOwnerEdit = goal && goal.userId === user.userId;

  if (existing.length > 0) {
    // No auto-reset of approval — student must explicitly submit for review
    await db
      .update(weeklyMilestones)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(weeklyMilestones.id, existing[0].id));
  } else {
    await db.insert(weeklyMilestones).values({
      id: createId(),
      goalId,
      weekNumber,
      milestoneDescription: updates.milestoneDescription || null,
      actions: updates.actions || null,
      results: updates.results || null,
      cumulativePercentage: updates.cumulativePercentage || 0,
      supportNeeded: updates.supportNeeded || null,
      approvalStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/l3");
  return { success: true };
}

export async function getMilestones(goalId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return db
    .select()
    .from(weeklyMilestones)
    .where(eq(weeklyMilestones.goalId, goalId));
}
