// ─── APA Constants ────────────────────────────────────────────────────────────

import type { SubCategoryMeta, GoalType } from "./types";

export const LEAP99_EVENTS: Record<number, string> = {
  2: "FLEX 298 — May 9–10 (Abenson HQ Muñoz)",
  3: "FLEX 299 — May 16–17",
  6: "ALC 256 — Jun 5–7",
  7: "ALC 257 — Jun 12–14",
  8: "Graduation — Jun 21",
};

// Days (0=Mon…6=Sun) occupied by each LEAP 99 event
// FLEX weekends: Sat–Sun; ALC residentials: Fri–Sun; Graduation: Sun
export const LEAP99_EVENT_DAYS: Record<number, { days: number[]; short: string }> = {
  2: { days: [5, 6], short: "FLEX 298 (Sat–Sun)" },
  3: { days: [5, 6], short: "FLEX 299 (Sat–Sun)" },
  6: { days: [4, 5, 6], short: "ALC 256 (Fri–Sun)" },
  7: { days: [4, 5, 6], short: "ALC 257 (Fri–Sun)" },
  8: { days: [6],    short: "Graduation (Sun)" },
};

export const SUBCATEGORIES: SubCategoryMeta[] = [
  // Enrollment
  { id: "enrollment",       label: "Standard (1 FLEX + 1 ALC)",    description: "Enroll 1 FLEX student and 1 ALC student by Graduation",               goalType: "enrollment" },
  { id: "enrollment-high",  label: "High Volume (2–5 per type)",   description: "Enroll multiple FLEX and ALC students — for high-capacity coaches",    goalType: "enrollment" },
  // Personal
  { id: "health",                label: "Health & Wellness",             description: "Physical health, fitness, sleep, nutrition, or medical goal",          goalType: "personal" },
  { id: "beingness",             label: "Beingness & Self-Leadership",   description: "Mindset, identity, emotional regulation, or spiritual alignment",     goalType: "personal" },
  { id: "relationship-deepen",   label: "Deepen a Relationship",        description: "Strengthen an existing relationship — partner, family, friend",        goalType: "personal" },
  { id: "relationship-prepare",  label: "Prepare for a Relationship",   description: "Prepare yourself to attract or begin a new relationship",              goalType: "personal" },
  { id: "experience-goal",       label: "Experience / Adventure",       description: "A meaningful experience, trip, or bucket-list goal",                   goalType: "personal" },
  // Professional
  { id: "income-employed",      label: "Income (Employed)",             description: "Increase salary, earn a bonus, or close a deal in your current role",  goalType: "professional" },
  { id: "income-exploring",     label: "Income (Self-Employed / Side)", description: "Launch or grow a business, freelance, or side income stream",          goalType: "professional" },
  { id: "career-beingness",     label: "Career Identity & Visibility",  description: "Become known as a leader, expert, or high-performer in your field",    goalType: "professional" },
  { id: "skills",               label: "Skill Mastery",                 description: "Learn, pass, or complete a specific professional skill or credential",  goalType: "professional" },
  { id: "workspace-design",     label: "Workspace & Productivity",      description: "Design your work environment, systems, or routines for peak output",    goalType: "professional" },
];

export const GOAL_TYPE_META: Record<GoalType, { label: string; description: string; icon: string }> = {
  enrollment: {
    label: "Enrollment Goal",
    description: "Enroll FLEX and ALC students into LEAP through genuine outreach",
    icon: "👥",
  },
  personal: {
    label: "Personal Goal",
    description: "Grow in health, relationships, identity, or a meaningful experience",
    icon: "🌱",
  },
  professional: {
    label: "Professional Goal",
    description: "Advance your career, income, skills, or professional identity",
    icon: "💼",
  },
};
