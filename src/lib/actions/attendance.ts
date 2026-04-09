"use server";

import { db } from "@/lib/db";
import { attendance, batches } from "@/lib/db/schema";
import { getAuthUser, isHeadCoach,
} from "@/lib/auth/jwt";
import { eq, and } from "drizzle-orm";
import { computeCurrentWeekFromDate } from "@/lib/utils/week-targets";
import { createId } from "@paralleldrive/cuid2";
import { revalidatePath } from "next/cache";
import type { ProgramEvent } from "@/lib/actions/program";

export async function updateAttendance(
  userId: string,
  weekNumber: number,
  updates: {
    meetingStatus?: "present" | "late" | "absent" | "no_data";
    meetingMon?: string;
    meetingTue?: string;
    meetingWed?: string;
    meetingThu?: string;
    meetingFri?: string;
    meetingSat?: string;
    meetingSun?: string;
    callMon?: string;
    callTue?: string;
    callWed?: string;
    callThu?: string;
    callFri?: string;
    callSat?: string;
    callSun?: string;
    eventAttendance?: Record<string, string>;
  }
) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  if (user.role !== "coach" && user.role !== "head_coach") {
    throw new Error("Forbidden");
  }

  const existing = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.weekNumber, weekNumber)
      )
    )
    .limit(1);

  const now = new Date();

  // Merge eventAttendance with existing JSON rather than overwrite
  const { eventAttendance, ...otherUpdates } = updates;
  let mergedEventAttendance: string | undefined;
  if (eventAttendance !== undefined) {
    const existing0 = existing[0];
    const prev: Record<string, string> = existing0?.eventAttendance
      ? (() => { try { return JSON.parse(existing0.eventAttendance); } catch { return {}; } })()
      : {};
    mergedEventAttendance = JSON.stringify({ ...prev, ...eventAttendance });
  }

  const dbUpdates = {
    ...otherUpdates,
    ...(mergedEventAttendance !== undefined ? { eventAttendance: mergedEventAttendance } : {}),
  };

  if (existing.length > 0) {
    await db
      .update(attendance)
      .set({ ...dbUpdates, updatedAt: now })
      .where(eq(attendance.id, existing[0].id));
  } else {
    await db.insert(attendance).values({
      id: createId(),
      userId,
      weekNumber,
      ...dbUpdates,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/l3");
  return { success: true };
}

export async function getStudentAttendance(userId: string) {
  return db
    .select()
    .from(attendance)
    .where(eq(attendance.userId, userId));
}

export async function getBatchCurrentWeek(): Promise<number> {
  const [batch] = await db.select({ startDate: batches.startDate, totalWeeks: batches.totalWeeks }).from(batches).limit(1);
  if (!batch?.startDate) return 7;
  return computeCurrentWeekFromDate(batch.startDate, batch.totalWeeks ?? 12);
}

export async function getBatchWeekInfo(): Promise<{
  currentWeek: number;
  reportingWeek: number;
  batchStartDate: string;
  weeklyTargets: Record<string, { min: number; max: number }>;
  events: ProgramEvent[];
  totalWeeks: number;
}> {
  const [batch] = await db
    .select({
      currentWeek: batches.currentWeek,
      startDate: batches.startDate,
      weeklyTargets: batches.weeklyTargets,
      totalWeeks: batches.totalWeeks,
      events: batches.events,
      intensiveDates: batches.intensiveDates,
      breakfastDates: batches.breakfastDates,
    })
    .from(batches)
    .limit(1);
  const batchStart = batch?.startDate ?? "2026-02-02";
  const currentWeek = computeCurrentWeekFromDate(batchStart, batch?.totalWeeks ?? 12);

  let weeklyTargets: Record<string, { min: number; max: number }> = {};
  if (batch?.weeklyTargets) {
    const raw = JSON.parse(batch.weeklyTargets);
    for (const [k, v] of Object.entries(raw)) {
      if (v && typeof v === "object" && "min" in (v as object) && "max" in (v as object)) {
        weeklyTargets[k] = v as { min: number; max: number };
      } else {
        const n = Number(v) || 0;
        weeklyTargets[k] = { min: Math.max(0, n - 2), max: Math.min(100, n + 2) };
      }
    }
  }

  const events: ProgramEvent[] = batch?.events
    ? (() => { try { return (JSON.parse(batch.events) as ProgramEvent[]).map(e => ({ ...e, type: "event" as const })); } catch { return []; } })()
    : [];

  const intensiveDates: string[] = batch?.intensiveDates
    ? (() => { try { return JSON.parse(batch.intensiveDates); } catch { return []; } })()
    : [];
  const breakfastDates: string[] = batch?.breakfastDates
    ? (() => { try { return JSON.parse(batch.breakfastDates); } catch { return []; } })()
    : [];

  for (const date of intensiveDates) {
    events.push({ id: `intensive-${date}`, name: "Intensive", date, type: "intensive" });
  }
  for (const date of breakfastDates) {
    events.push({ id: `breakfast-${date}`, name: "Breakfast", date, type: "breakfast" });
  }

  return {
    currentWeek,
    reportingWeek: Math.max(1, currentWeek - 1),
    batchStartDate: batchStart,
    weeklyTargets,
    events,
    totalWeeks: batch?.totalWeeks ?? 8,
  };
}
