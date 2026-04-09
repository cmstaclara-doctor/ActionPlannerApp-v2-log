// Keyword overlap utilities for goal-milestone-action alignment checks
// Uses same stop-word list as FeedbackTab.tsx > AP_STOP_WORDS

const STOP_WORDS = new Set([
  "the","and","for","that","with","from","this","will","have","been","not","but",
  "its","are","was","were","has","had","can","all","each","they","their","about",
  "into","more","also","when","then","than","who","what","how","per","via","by","as",
  "at","to","in","on","of","a","an","be","or","is","it","my","we","i","you","your",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Keyword overlap score between two texts.
 * Uses recall-based scoring: intersection / min(setA, setB)
 * — "what fraction of the smaller text's keywords appear in the larger text?"
 * This is more meaningful than Jaccard for action↔milestone alignment,
 * where actions are expected to be a focused subset of the milestone's vocabulary.
 */
export function keywordOverlap(a: string, b: string): number {
  if (!a || !b) return 0;
  const setA = new Set(extractKeywords(a));
  const setB = new Set(extractKeywords(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const minSize = Math.min(setA.size, setB.size);
  return Math.round((intersection / minSize) * 100);
}

/**
 * Returns alignment color class and emoji based on score.
 * 🟢 >60  🟡 30–60  🔴 <30
 */
export function alignmentLevel(score: number): {
  color: string;
  bg: string;
  emoji: string;
} {
  if (score >= 60) return { color: "text-green-600", bg: "bg-green-500/10", emoji: "🟢" };
  if (score >= 30) return { color: "text-amber-600", bg: "bg-amber-500/10", emoji: "🟡" };
  return { color: "text-red-500", bg: "bg-red-500/10", emoji: "🔴" };
}

const SMARTER_FIELDS = [
  { key: "specificDetails",     letter: "S", label: "Specific"   },
  { key: "measurableCriteria",  letter: "M", label: "Measurable" },
  { key: "achievableResources", letter: "A", label: "Attainable" },
  { key: "relevantAlignment",   letter: "R", label: "Risk"       },
  { key: "endDate",             letter: "T", label: "Time-bound" },
  { key: "excitingMotivation",  letter: "E", label: "Exciting"   },
  { key: "rewardingBenefits",   letter: "R", label: "Rewarding"  },
] as const;

export type SmarterKey = typeof SMARTER_FIELDS[number]["key"];

export interface SmarterCheck {
  letter: string;
  label: string;
  filled: boolean;
}

export interface SmarterResult {
  score: number;       // 0–7
  checks: SmarterCheck[];
}

/**
 * Checks which of the 7 SMARTER fields are filled.
 * Returns score (0–7) and per-field check array.
 */
export function smarterCompleteness(goal: Partial<Record<SmarterKey, string | null | undefined>>): SmarterResult {
  const checks: SmarterCheck[] = SMARTER_FIELDS.map(({ key, letter, label }) => ({
    letter,
    label,
    filled: !!(goal[key]?.trim()),
  }));
  const score = checks.filter((c) => c.filled).length;
  return { score, checks };
}
