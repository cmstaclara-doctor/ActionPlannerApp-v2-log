// ── Rule-based alignment engine ───────────────────────────────────────────────

// ── 1. Declaration ↔ Peg keyword matching ────────────────────────────────────

const KEYWORD_MAP: Array<{
  keywords: string[];
  goalTypes: string[];
  suggestion: string;
}> = [
  { keywords: ["family","anak","kids","children","asawa","spouse","partner","mother","father","parents","pamilya","mahal"],
    goalTypes: ["personal","enrollment"],
    suggestion: "show the people I love most what I'm truly capable of" },
  { keywords: ["legacy","matter","purpose","meaning","diyos","god","faith","bakas","mark"],
    goalTypes: ["personal","professional","enrollment"],
    suggestion: "leave a mark that proves my life meant something" },
  { keywords: ["freedom","libre","free","financial","pera","money","income","trabaho","work","provide","provider"],
    goalTypes: ["professional","enrollment"],
    suggestion: "build a life where money follows my effort instead of my fear" },
  { keywords: ["grow","transform","change","better","bago","bagong","improvement","upgrade","level","best version"],
    goalTypes: ["personal","professional","enrollment"],
    suggestion: "become the best version of myself so I can give more to others" },
  { keywords: ["fear","takot","courage","brave","lakas","overcome","face","push through","hindi na"],
    goalTypes: ["enrollment","personal"],
    suggestion: "prove that I am no longer ruled by what scares me" },
  { keywords: ["serve","service","give","share","tulong","bayanihan","community","help","contribute","impact"],
    goalTypes: ["enrollment","professional","personal"],
    suggestion: "be of genuine service to the people around me who are ready" },
  { keywords: ["health","healthy","body","fit","exercise","katawan","sakit","pain","medical","doctor"],
    goalTypes: ["personal"],
    suggestion: "show up as my most vibrant self for the people who depend on me" },
  { keywords: ["peace","peace of mind","calm","katahimikan","anxiety","stress","overwhelm","rest","mental","isip"],
    goalTypes: ["personal"],
    suggestion: "experience the grounded, peaceful version of myself I know exists" },
  { keywords: ["prove","show","kaya","capable","accomplish","achieve","goal","dream","pangarap","aspire"],
    goalTypes: ["enrollment","professional","personal"],
    suggestion: "prove to myself that I am someone who commits and follows through" },
];

export function getRuleBasedSuggestion(
  declaration: string,
  goalType: string,
  currentPeg: string
): string | null {
  const lower = declaration.toLowerCase();
  let bestMatch: { suggestion: string; score: number } | null = null;
  for (const rule of KEYWORD_MAP) {
    if (!rule.goalTypes.includes(goalType)) continue;
    const matches = rule.keywords.filter(kw => lower.includes(kw));
    if (matches.length > 0 && (!bestMatch || matches.length > bestMatch.score)) {
      bestMatch = { suggestion: rule.suggestion, score: matches.length };
    }
  }
  if (!bestMatch) return null;
  if (currentPeg && currentPeg.toLowerCase().split(" ").filter(w => w.length > 4)
      .some(w => bestMatch!.suggestion.toLowerCase().includes(w))) {
    return null;
  }
  return bestMatch.suggestion;
}

/** 0–100 score: how many declaration keywords appear in the peg. */
export function getDeclarationAlignmentScore(declaration: string, peg: string): number {
  if (!declaration || !peg) return 0;
  const declWords = declaration.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  const pegWords = peg.toLowerCase().split(/\W+/).filter(w => w.length > 4);
  if (declWords.length === 0) return 0;
  const matches = pegWords.filter(w => declWords.includes(w)).length;
  return Math.min(100, Math.round((matches / Math.max(declWords.length, 1)) * 400));
}

// ── 2. SMARTER statement checker ─────────────────────────────────────────────

export interface SmarterCheck {
  S: boolean;  // Specific — has concrete action verb + target
  M: boolean;  // Measurable — has number / frequency / quantity
  A: boolean;  // Attainable — has commitment frequency (per week, daily, etc.)
  R: boolean;  // Rewarding — has emotional peg (starts "To ")
  T: boolean;  // Time-bound — has a date
  E: boolean;  // Essence — "as a [adj], [adj], and [adj] person"
  R2: boolean; // Results — has proof / outcome word
}

export function checkSMARTER(statement: string): SmarterCheck {
  const s = statement.toLowerCase().trim();
  return {
    // S — Specific: broad list of concrete action verbs
    S:  /\b(reach out|enroll|practice|dedicate|build|create|earn|exercise|commit|work|invite|spend|complete|write|attend|launch|close|conduct|follow up|present|document|submit|walk|follow|track|maintain|log|share|show up|embody|initiate|invest|execute|design|run|engage|develop|apply|lead|journal|meditate)\b/.test(s),
    // M — Measurable: numbers, units, or quantity words
    M:  /\b\d+|\btwice\b|\bthrice\b|\bat least\b|\bper week\b|\btimes a week\b|\bhours?\b|\bstudents?\b|\b₱|peso/.test(s),
    // A — Attainable: frequency commitment
    A:  /\bat least\b|\bper week\b|\btimes a week\b|\bdaily\b|\bweekly\b|\bevery\b|\bdays? a week\b|\bmorning\b|\b\d+x\b|\bper day\b/.test(s),
    // R — Risk: checked separately via checkTargetAmbition; always soft (never hard-blocks)
    R:  true,
    // T — Time-bound: has a date
    T:  /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b.*\b(20\d\d)\b|\bby\b.{0,30}\b20\d\d\b/.test(s),
    // E — Essence: "as a [adj], [adj], and [adj] person/professional"
    E:  /as an? \w[\w ]+, \w[\w ]+, and \w[\w ]+ (person|professional)/.test(s),
    // R2 — Results: proof/outcome word (no trailing \b so -ing forms match too)
    R2: /\b(present|show|document|enroll|earn|demonstrate|prove|complete|submit|achieve|reach|share|publish|showcase|report|reflect|portfolio|testimony|journal)/.test(s),
  };
}

export function smarterLabel(key: keyof SmarterCheck): string {
  const labels: Record<keyof SmarterCheck, string> = {
    S: "Specific",
    M: "Measurable",
    A: "Attainable",
    R: "Risk",
    T: "Time-bound",
    E: "Essence",
    R2: "Results",
  };
  return labels[key];
}

// ── 3. Target ambition check ─────────────────────────────────────────────────

export type AmbitionFlag = "too_easy" | "too_risky" | null;

export interface AmbitionCheck {
  flag: AmbitionFlag;
  from: number;
  to: number;
  unit: string;
  weeklyRate: number;   // absolute change per week
  pctChange: number;    // % change from baseline
}

/**
 * Extracts numeric from→to pairs and flags goals that are
 * either suspiciously unambitious or potentially unsafe.
 *
 * Rules (8-week window):
 *   Weight (kg/lbs):
 *     too_easy  → delta < 2 units  (< 0.25/week — barely noticeable)
 *     too_risky → rate  > 0.8/week  (> 6.4kg/8wk — medically aggressive)
 *   Money (₱ / PHP / k):
 *     too_easy  → pct change < 10%
 *     too_risky → pct change > 400%
 *   Generic number (no unit recognised):
 *     too_easy  → pct change < 5%
 *     too_risky → pct change > 500%
 */
export function checkTargetAmbition(statement: string): AmbitionCheck | null {
  const s = statement.toLowerCase();

  // ── Weight ────────────────────────────────────────────────────────────────
  const weightPattern = /(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?|lbs?|pounds?)[^.]*?(?:to|down to|up to)\s*(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|lbs?|pounds?)/i;
  const weightAlt  = /from\s+(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|lbs?|pounds?)[^.]*?to\s*(\d+(?:\.\d+)?)/i;
  // arrow notation: "weight 70→60" or "70kg→60kg"
  const weightArrow = /(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?|lbs?|pounds?)?\s*→\s*(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilos?|lbs?|pounds?)/i;

  let m = statement.match(weightPattern) ?? statement.match(weightAlt) ?? statement.match(weightArrow);
  if (m) {
    const from = parseFloat(m[1]);
    const to   = parseFloat(m[2] ?? m[3]);
    const unit = (m[3] ?? m[2]).toLowerCase().startsWith("lb") ? "lbs" : "kg";
    const delta = Math.abs(from - to);
    const weeklyRate = delta / 8;
    const pctChange  = from > 0 ? (delta / from) * 100 : 0;
    let flag: AmbitionFlag = null;
    if (delta < 2)         flag = "too_easy";
    else if (weeklyRate > 0.8) flag = "too_risky";
    if (flag) return { flag, from, to, unit, weeklyRate, pctChange };
  }

  // ── Money (₱ / PHP / peso) ────────────────────────────────────────────────
  const moneyPattern = /(?:₱|php|peso)\s*(\d[\d,]*(?:k|k\b)?)[^.]*?(?:to|up to)\s*(?:₱|php|peso)?\s*(\d[\d,]*(?:k|k\b)?)/i;
  const moneyAlt = /from\s+(?:₱|php|peso)?\s*(\d[\d,]*(?:k)?)[^.]*?to\s+(?:₱|php|peso)?\s*(\d[\d,]*(?:k)?)/i;

  const mm = statement.match(moneyPattern) ?? statement.match(moneyAlt);
  if (mm) {
    const parse = (v: string) => {
      const n = parseFloat(v.replace(/,/g, ""));
      return v.toLowerCase().endsWith("k") ? n * 1000 : n;
    };
    const from = parse(mm[1]);
    const to   = parse(mm[2]);
    const delta = Math.abs(from - to);
    const weeklyRate = delta / 8;
    const pctChange  = from > 0 ? (delta / from) * 100 : 0;
    let flag: AmbitionFlag = null;
    if (pctChange < 10)   flag = "too_easy";
    else if (pctChange > 400) flag = "too_risky";
    if (flag) return { flag, from, to, unit: "₱", weeklyRate, pctChange };
  }

  // ── Generic number pair ───────────────────────────────────────────────────
  const genericPattern = /from\s+(\d+(?:\.\d+)?)\s+to\s+(\d+(?:\.\d+)?)/i;
  const gm = statement.match(genericPattern);
  if (gm) {
    const from = parseFloat(gm[1]);
    const to   = parseFloat(gm[2]);
    const delta = Math.abs(from - to);
    const weeklyRate = delta / 8;
    const pctChange  = from > 0 ? (delta / from) * 100 : 0;
    let flag: AmbitionFlag = null;
    if (pctChange < 5)    flag = "too_easy";
    else if (pctChange > 500) flag = "too_risky";
    if (flag) return { flag, from, to, unit: "", weeklyRate, pctChange };
  }

  return null;
}

// ── 4. Frequency risk check ───────────────────────────────────────────────────

/**
 * Flags goals where the committed frequency is too low to produce real change.
 * e.g. "gym 1 hour per week" or "exercise once a week"
 */
export function checkFrequencyRisk(statement: string): { flag: true; detail: string } | null {
  const s = statement.toLowerCase();

  // "1 hour per week" or "1 hour a week" — exercise at 1hr/week = too little
  const hrMatch = s.match(/(\d+(?:\.\d+)?)\s*hours?\s*(?:per|a)\s*week/);
  if (hrMatch) {
    const hrs = parseFloat(hrMatch[1]);
    if (hrs <= 1) return { flag: true, detail: `${hrMatch[0].trim()} — 1 hour/week is unlikely to drive meaningful results` };
  }

  // "once a week" or "1 time a week" for physical activities
  const onceMatch = s.match(/\b(?:once|1\s*time)\s*(?:a|per)\s*week\b/);
  const physicalWords = /\b(gym|exercise|workout|train|run|walk|jog|swim|lift|cardio|yoga|pilates)\b/;
  if (onceMatch && physicalWords.test(s)) {
    return { flag: true, detail: `once a week for a physical goal — not enough to build habit or see results` };
  }

  return null;
}

// ── 5. Metric complexity check ────────────────────────────────────────────────

/**
 * Flags goals that try to track too many numeric targets at once.
 * A focused goal should have at most 2 measurable targets.
 */
export function checkMetricComplexity(statement: string): { flag: true; count: number } | null {
  // Count distinct from→to pairs (text and arrow notation)
  const arrowMatches  = statement.match(/\d+(?:\.\d+)?\s*→\s*\d+(?:\.\d+)?/g) ?? [];
  const fromToMatches = statement.match(/from\s+\d[\d,.]*\s+to\s+\d[\d,.]*/gi) ?? [];
  const total = arrowMatches.length + fromToMatches.length;
  if (total > 2) return { flag: true, count: total };
  return null;
}

// ── 6. Milestone feasibility ──────────────────────────────────────────────────

export type Feasibility = "solid" | "light" | "heavy";

/** How feasible is a week given action count and distinct scheduled days? */
export function getMilestoneFeasibility(actionCount: number, scheduledDays: number): Feasibility {
  if (actionCount === 0) return "light";
  const density = actionCount / Math.max(scheduledDays, 1);
  if (density > 3) return "heavy";
  if (actionCount < 2 || scheduledDays < 2) return "light";
  return "solid";
}

// ── 7. Milestone ↔ Goal coverage (M-Check) ───────────────────────────────────

export interface MilestoneGoalCheck {
  score: number;            // 0–100
  flag: "solid" | "back_loaded" | "stalled" | "incomplete";
  weeklyDeltas: number[];
  detail: string;
}

export function checkMilestoneGoalAlignment(
  weeks: Array<{ weekNumber: number; cumulativePercentage: number }>
): MilestoneGoalCheck {
  if (weeks.length === 0) {
    return { score: 0, flag: "incomplete", weeklyDeltas: [], detail: "No milestones defined" };
  }
  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const deltas = sorted.map((w, i) => {
    const prev = i === 0 ? 0 : sorted[i - 1].cumulativePercentage;
    return w.cumulativePercentage - prev;
  });
  const lastPct = sorted[sorted.length - 1].cumulativePercentage;

  if (lastPct < 100) {
    return {
      score: Math.round(lastPct * 0.6),
      flag: "incomplete",
      weeklyDeltas: deltas,
      detail: `Plan only reaches ${lastPct}% — milestones don't fully cover the goal`,
    };
  }

  // Back-loaded: >60% of progress in last 3 weeks (excluding W8 which is always 0-delta)
  const last3Delta = deltas.slice(-3).reduce((a, b) => a + b, 0);
  if (last3Delta > 60) {
    return {
      score: 72,
      flag: "back_loaded",
      weeklyDeltas: deltas,
      detail: `${last3Delta}% of goal progress is in the final 3 weeks — risky if life interrupts`,
    };
  }

  // Stalled: interior weeks (skip first and last two) with 0 progress
  const stalledWeeks = deltas
    .slice(1, sorted.length - 2)
    .map((d, i) => ({ week: sorted[i + 1].weekNumber, delta: d }))
    .filter(w => w.delta === 0);

  if (stalledWeeks.length > 1) {
    return {
      score: 78,
      flag: "stalled",
      weeklyDeltas: deltas,
      detail: `Weeks ${stalledWeeks.map(w => w.week).join(", ")} show no progress — gaps in the plan`,
    };
  }

  return {
    score: 100,
    flag: "solid",
    weeklyDeltas: deltas,
    detail: "Milestones distribute progress steadily — every week advances the goal",
  };
}

// ── 8. Action Step ↔ Milestone coverage (Action-Check) ────────────────────────

export interface ActionCoverageCheck {
  totalActions: number;
  activeActions: number;
  removedActions: number;
  feasibility: Feasibility;
  milestoneSafe: boolean;
  coverageScore: number;  // 0–100
}

export function checkActionMilestoneCoverage(
  totalActions: number,
  activeActions: number,
  scheduledDays: number
): ActionCoverageCheck {
  const removed = totalActions - activeActions;
  const feasibility = getMilestoneFeasibility(activeActions, scheduledDays);
  // Unsafe if: too light by schedule OR fewer than 2 active steps (1 action can't cover a real milestone)
  const milestoneSafe = feasibility !== "light" && activeActions >= 2;
  const coverageScore = totalActions > 0
    ? Math.round((activeActions / totalActions) * 100)
    : 100;
  return { totalActions, activeActions, removedActions: removed, feasibility, milestoneSafe, coverageScore };
}
