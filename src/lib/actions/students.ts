"use server";

import { db } from "@/lib/db";
import { users, declarations, goals, weeklyMilestones, batches } from "@/lib/db/schema";
import { getAuthUser } from "@/lib/auth/jwt";
import { eq, and, lte, desc } from "drizzle-orm";
import { getCurrentWeek, getUserProgress } from "@/lib/progress";
import type { WeekHistoryEntry } from "./coach-overview";

export async function getStudentDetail(studentId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const currentWeek = await getCurrentWeek();

  const [student] = await db
    .select()
    .from(users)
    .where(eq(users.id, studentId))
    .limit(1);

  if (!student) throw new Error("Student not found");

  const prog = await getUserProgress(studentId, currentWeek);

  const [decl] = await db
    .select({ text: declarations.text })
    .from(declarations)
    .where(eq(declarations.userId, studentId))
    .orderBy(desc(declarations.updatedAt))
    .limit(1);

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    declaration: decl?.text ?? null,
    enrollmentProgress: prog.enrollment,
    personalProgress: prog.personal,
    professionalProgress: prog.professional,
    enrollmentResults: prog.enrollmentResults,
    personalResults: prog.personalResults,
    professionalResults: prog.professionalResults,
    enrollmentCurrentWeek: prog.enrollmentCurrentWeek,
    personalCurrentWeek: prog.personalCurrentWeek,
    professionalCurrentWeek: prog.professionalCurrentWeek,
  };
}

export async function getStudentWeeklyHistory(studentId: string): Promise<WeekHistoryEntry[]> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const currentWeek = await getCurrentWeek();
  const [batchRow] = await db.select({ totalWeeks: batches.totalWeeks }).from(batches).limit(1);
  const totalWeeks = batchRow?.totalWeeks ?? 12;

  const allRows = await db
    .select({
      goalType: goals.goalType,
      weekNumber: weeklyMilestones.weekNumber,
      cumulativePercentage: weeklyMilestones.cumulativePercentage,
    })
    .from(weeklyMilestones)
    .innerJoin(goals, eq(weeklyMilestones.goalId, goals.id))
    .where(and(eq(goals.userId, studentId), lte(weeklyMilestones.weekNumber, currentWeek)));

  const result: WeekHistoryEntry[] = [];

  for (let week = 1; week <= currentWeek; week++) {
    const cap = Math.round((week / totalWeeks) * 100);
    const get = (type: string) => {
      const rows = allRows
        .filter(r => r.goalType === type && r.weekNumber <= week && (r.cumulativePercentage || 0) > 0)
        .sort((a, b) => b.weekNumber - a.weekNumber);
      const latest = rows[0];
      if (!latest) return 0;
      const latestCap = Math.round((latest.weekNumber / totalWeeks) * 100);
      return Math.min(latest.cumulativePercentage || 0, latestCap);
    };
    const e = get("enrollment");
    const p = get("personal");
    const pro = get("professional");
    const actionPlan = (pct: number) => {
      const derived = Math.round((pct * totalWeeks) / 100);
      return Math.min(100, week > 0 ? Math.round((derived / week) * 100) : 0);
    };
    result.push({
      week,
      enrollment: { results: e, actionPlan: actionPlan(e) },
      personal: { results: p, actionPlan: actionPlan(p) },
      professional: { results: pro, actionPlan: actionPlan(pro) },
      total: {
        results: Math.round((e + p + pro) / 3),
        actionPlan: Math.round((actionPlan(e) + actionPlan(p) + actionPlan(pro)) / 3),
      },
    });
  }

  return result;
}
