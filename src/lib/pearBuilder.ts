// ─── PEAR Statement Assembly ──────────────────────────────────────────────────

import { PEAR_SAMPLES } from "./data/pear-samples";
import { GOAL_TEMPLATES } from "./data/goal-templates";
import { getWeekDates } from "./utils/week-dates";
import type { GoalRecord, GoalType } from "./types";

/**
 * Format 3 essence qualities as "A, B, and C".
 * Input can be comma-separated string.
 */
function formatEssence(raw: string): string {
  const parts = raw.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return "dedicated, committed, and courageous";
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

/**
 * Resolve the peg (transformation/impact phrase) from:
 * 1. answers.peg (custom user-written peg)
 * 2. pegMap[answers.coachingContext] (from sample contextQ)
 * 3. sample.contextQ.pegMap[first option] (fallback)
 * 4. Generic fallback
 */
function resolvePeg(answers: Record<string, string>, templateId: string, sampleId?: string | null): string {
  if (answers.peg && answers.peg.trim()) return answers.peg.trim();

  if (sampleId && answers.coachingContext) {
    const samples = PEAR_SAMPLES[templateId] || [];
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      const mapped = sample.contextQ.pegMap[answers.coachingContext];
      if (mapped) return mapped;
    }
  }

  return "grow through this commitment and honor the person I am becoming";
}

/**
 * Assemble a PEAR statement from answers + template context.
 * Format: "To {peg}, as a {essence} person, {body}."
 */
export function assemblePEAR(
  answers: Record<string, string>,
  templateId: string,
  sampleId?: string | null
): string {
  const template = GOAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) return "";

  const smarter = template.smarter(answers);

  const peg = resolvePeg(answers, templateId, sampleId);
  const essence = formatEssence(answers.essence || "dedicated, committed, and courageous");

  // Use goalStatement as body if provided, otherwise fall back to specificDetails
  let body = (smarter.goalStatement || smarter.specificDetails || "");
  body = body.replace(/^Throughout 8 weeks,\s*/i, "");
  body = body.replace(/\s+/g, " ").trim();
  if (body && !body.endsWith(".")) body += ".";

  return `To ${peg}, as a ${essence} person, ${body}`;
}

/**
 * Build a complete GoalRecord from answers + template.
 */
export function buildGoalRecord(
  studentId: string,
  goalType: GoalType,
  templateId: string,
  subCategory: string,
  answers: Record<string, string>,
  sampleId?: string | null
): GoalRecord {
  const template = GOAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  const smarter = template.smarter(answers);
  const rawMilestones = template.milestones(answers);
  const pearStatement = assemblePEAR(answers, templateId, sampleId);

  // Enrich milestones with weekDates for GG import compatibility
  const milestones = rawMilestones.map(m => ({
    ...m,
    weekDates: getWeekDates(m.weekNumber),
  }));

  return {
    studentId,
    goalType,
    templateId,
    subCategory,
    answers: { ...answers, _sampleId: sampleId ?? "" },
    pearStatement,
    smarter,
    milestones,
    savedAt: new Date().toISOString(),
  };
}
