import { db } from "@/lib/db";
import { goals, weeklyMilestones, batches } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { computeCurrentWeekFromDate } from "@/lib/utils/week-targets";

/**
 * Get the current active week based on the calendar (batch start date).
 * Uses computeCurrentWeekFromDate so it always reflects the real date,
 * not the stale DB current_week column.
 */
export async function getCurrentWeek(): Promise<number> {
  const [batch] = await db.select({ startDate: batches.startDate, totalWeeks: batches.totalWeeks }).from(batches).limit(1);
  if (!batch?.startDate) return 7;
  return computeCurrentWeekFromDate(batch.startDate, batch.totalWeeks ?? 12);
}

/** Fetch the total number of weeks for the active batch. */
export async function getTotalWeeks(): Promise<number> {
  const [batch] = await db.select({ totalWeeks: batches.totalWeeks }).from(batches).limit(1);
  return batch?.totalWeeks ?? 12;
}

/**
 * Calculate goal progress:
 * PROGRESS = (completed weeks / totalWeeks) × 100
 *
 * A week is "complete" when ALL non-empty action items are done.
 * Results-based progress uses the same formula on the results field.
 * Only considers weeks up to currentWeek — so 100% is only reachable
 * when every week in the full program has been completed.
 *
 * @param totalWeeks  Total weeks in the batch (from program settings).
 *                    Defaults to 12 for backward compatibility.
 */
export async function getUserProgress(userId: string, currentWeek: number, totalWeeks = 12) {
  const userGoals = await db
    .select({ id: goals.id, goalType: goals.goalType })
    .from(goals)
    .where(eq(goals.userId, userId));

  const progress: Record<string, number> = {
    enrollment: 0,
    personal: 0,
    professional: 0,
  };

  const resultsProgress: Record<string, number> = {
    enrollment: 0,
    personal: 0,
    professional: 0,
  };

  const currentWeekProgress: Record<string, number> = {
    enrollment: 0,
    personal: 0,
    professional: 0,
  };

  for (const goal of userGoals) {
    const milestones = await db
      .select({
        weekNumber: weeklyMilestones.weekNumber,
        actions: weeklyMilestones.actions,
        results: weeklyMilestones.results,
        cumulativePercentage: weeklyMilestones.cumulativePercentage,
      })
      .from(weeklyMilestones)
      .where(and(eq(weeklyMilestones.goalId, goal.id), lte(weeklyMilestones.weekNumber, currentWeek)));

    let completedWeeks = 0;
    let completedResultsWeeks = 0;

    for (const m of milestones) {
      try {
        const acts: { text: string; done: boolean }[] = JSON.parse(m.actions || "[]");
        const nonEmpty = acts.filter((a) => a.text && a.text.trim() !== "");
        if (nonEmpty.length > 0 && nonEmpty.every((a) => a.done)) {
          completedWeeks++;
        }
      } catch {
        // skip malformed JSON
      }

      try {
        const res: { text: string; done: boolean }[] = JSON.parse(m.results || "[]");
        const nonEmpty = res.filter((r) => r.text && r.text.trim() !== "");
        if (nonEmpty.length > 0 && nonEmpty.every((r) => r.done)) {
          completedResultsWeeks++;
        }
      } catch {
        // skip malformed JSON
      }
    }

    // Auto from Excel: use latest week's cumulativePercentage if available.
    // Apply defensive cap: week N can contribute at most (N / totalWeeks) * 100 — prevents
    // old bad data (per-week action % stored as cumulative) from inflating the overall bar.
    const latestWithPct = [...milestones]
      .sort((a, b) => b.weekNumber - a.weekNumber)
      .find((m) => (m.cumulativePercentage || 0) > 0);

    progress[goal.goalType] = Math.round((completedWeeks / totalWeeks) * 100);
    if (latestWithPct) {
      const maxAllowed = Math.round((latestWithPct.weekNumber / totalWeeks) * 100);
      resultsProgress[goal.goalType] = Math.round(Math.min(latestWithPct.cumulativePercentage!, maxAllowed));
    } else {
      resultsProgress[goal.goalType] = Math.round((completedResultsWeeks / totalWeeks) * 100);
    }

    // Action Steps % = weeks completed / weeks elapsed × 100
    // Derived from cumulative % (Excel-based) so it reflects real student progress,
    // not in-app checkbox usage. If student is on track, this reads ~100%.
    if (latestWithPct && currentWeek > 0) {
      const derivedCompletedWeeks = Math.round(
        (Math.min(latestWithPct.cumulativePercentage!, Math.round((latestWithPct.weekNumber / totalWeeks) * 100))
          * totalWeeks) / 100
      );
      currentWeekProgress[goal.goalType] = Math.min(
        100,
        Math.round((derivedCompletedWeeks / currentWeek) * 100)
      );
    } else {
      // Fallback: in-app checkbox completion for latest milestone
      const currentMilestone = milestones.find(m => m.weekNumber === currentWeek - 1);
      let currentWeekPct = 0;
      if (currentMilestone) {
        try {
          const acts: { text: string; done: boolean }[] = JSON.parse(currentMilestone.actions || "[]");
          const nonEmpty = acts.filter(a => a.text && a.text.trim() !== "");
          const done = nonEmpty.filter(a => a.done).length;
          currentWeekPct = nonEmpty.length > 0 ? Math.round((done / nonEmpty.length) * 100) : 0;
        } catch { /* skip */ }
      }
      currentWeekProgress[goal.goalType] = currentWeekPct;
    }
  }

  return {
    enrollment: progress.enrollment,
    personal: progress.personal,
    professional: progress.professional,
    enrollmentResults: resultsProgress.enrollment,
    personalResults: resultsProgress.personal,
    professionalResults: resultsProgress.professional,
    enrollmentCurrentWeek: currentWeekProgress.enrollment,
    personalCurrentWeek: currentWeekProgress.personal,
    professionalCurrentWeek: currentWeekProgress.professional,
  };
}
