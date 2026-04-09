/**
 * Local semantic similarity scorer — no API required.
 * Compares declaration + goal using word distance, stemming, and thematic maps.
 */

// ─── Simple word stemmer (suffix-based) ────────────────────────────────────────

function stem(word: string): string {
  const w = word.toLowerCase();
  // Remove common suffixes
  if (w.endsWith("ing")) return w.slice(0, -3);
  if (w.endsWith("ed")) return w.slice(0, -2);
  if (w.endsWith("s") && w.length > 3) return w.slice(0, -1);
  if (w.endsWith("tion")) return w.slice(0, -4);
  return w;
}

// ─── Thematic keyword maps ─────────────────────────────────────────────────────

const DECLARATION_THEMES: Record<string, string[]> = {
  commitment: ["commit", "promise", "dedicate", "vow", "pledge", "promise"],
  action: ["show", "prove", "demonstrate", "walk", "talk", "do", "act", "execute"],
  growth: ["grow", "transform", "change", "evolve", "improve", "become", "level"],
  service: ["serve", "help", "give", "share", "contribute", "impact", "support"],
  courage: ["courage", "brave", "fear", "overcome", "push", "face", "conquer"],
  love: ["love", "care", "family", "people", "relationship", "connection"],
  freedom: ["free", "freedom", "liberty", "break", "escape", "liberate"],
  legacy: ["legacy", "mark", "difference", "matter", "purpose", "meaning"],
  excellence: ["best", "excellent", "excel", "master", "peak", "optimal", "best version"],
};

const GOAL_THEMES: Record<string, string[]> = {
  enrollment: ["enroll", "flex", "alc", "invite", "bring", "referral", "reach"],
  reach: ["reach", "out", "contact", "call", "message", "connect", "conversation"],
  consistency: ["daily", "weekly", "consistent", "routine", "habit", "every"],
  measurement: ["times", "number", "count", "students", "people", "achieve", "reach"],
  proof: ["photo", "evidence", "screenshot", "testimony", "proof", "demonstrate", "show"],
  health: ["health", "exercise", "gym", "fit", "body", "weight", "movement"],
  skill: ["skill", "learn", "master", "practice", "develop", "build"],
  income: ["income", "money", "earn", "salary", "revenue", "financial", "₱"],
};

// ─── Semantic similarity scorer ────────────────────────────────────────────────

export interface LocalSemanticResult {
  ambitionScore: number;     // 0–100: does goal match declaration intensity?
  thematicScore: number;     // 0–100: do themes align?
  specificityScore: number;  // 0–100: is goal concrete vs declaration vague?
  measurabilityScore: number; // 0–100: can you measure progress and prove completion?
  overallScore: number;      // average of above
  analysis: string;
  suggestedTweak: string;
}

export function assessLocalSemantic(
  goalStatement: string,
  declaration: string,
  values: string | null = null
): LocalSemanticResult {
  const declWords = declaration.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const goalWords = goalStatement.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const valuesWords = (values || "").toLowerCase().split(/\W+/).filter(w => w.length > 2);

  // ── 1. THEMATIC ALIGNMENT ──────────────────────────────────────────────────
  // Count thematic keyword matches between declaration and goal
  let declThemeMatches = 0;
  let goalThemeMatches = 0;

  for (const [theme, keywords] of Object.entries(DECLARATION_THEMES)) {
    const declHas = keywords.some(kw => declWords.some(w => stem(w) === stem(kw)));
    if (declHas) declThemeMatches++;
  }

  for (const [theme, keywords] of Object.entries(GOAL_THEMES)) {
    const goalHas = keywords.some(kw => goalWords.some(w => stem(w) === stem(kw)));
    if (goalHas) goalThemeMatches++;
  }

  // Thematic score: presence of both declaration and goal themes (lenient — 75% strictness)
  const thematicScore =
    declThemeMatches > 0 && goalThemeMatches > 0
      ? Math.min(100, Math.round(80 + (declThemeMatches + goalThemeMatches) * 2))
      : declThemeMatches > 0 || goalThemeMatches > 0
      ? Math.round(70 + (declThemeMatches || goalThemeMatches) * 3)
      : 60;

  // ── 2. AMBITION ALIGNMENT ──────────────────────────────────────────────────
  // Declaration length + action verbs vs goal concreteness (numbers, measurements)
  const declHasAction = ["show", "prove", "walk", "do", "act", "demonstrate"].some(v =>
    declWords.some(w => stem(w) === stem(v))
  );
  const goalHasMetrics = /\d+|times|daily|weekly|every|at least|students|people/.test(goalStatement);
  const goalHasDeadline = /\b(june|may|april|week|by|before)\b/.test(goalStatement.toLowerCase());

  // Ambition score — more lenient (75% strictness)
  const ambitionScore =
    declWords.length <= 5
      ? // Short declaration: assume positive intent
        goalHasMetrics && goalHasDeadline
        ? 85
        : goalHasMetrics
        ? 78
        : 72
      : // Longer declaration: benefit of doubt
      declHasAction && goalHasMetrics
      ? 90
      : goalHasMetrics
      ? 80
      : 70;

  // ── 3. SPECIFICITY FIT ─────────────────────────────────────────────────────
  // Goal concreteness: has numbers, dates, specific actions
  const goalHasNumbers = /\d+/.test(goalStatement);
  const goalHasDate = /\b(june|may|april|week|2026)\b/.test(goalStatement.toLowerCase());
  const goalHasActionVerbs = [
    "enroll",
    "reach",
    "call",
    "contact",
    "exercise",
    "practice",
    "earn",
    "build",
  ].some(v => goalWords.some(w => stem(w) === stem(v)));

  // Specificity score — more lenient (75% strictness)
  const specificityScore =
    goalHasNumbers && goalHasDate && goalHasActionVerbs
      ? 95
      : goalHasNumbers && goalHasActionVerbs
      ? 88
      : goalHasActionVerbs
      ? 82
      : goalHasNumbers
      ? 80
      : 75;

  // ── 4. MEASURABILITY ───────────────────────────────────────────────────────
  // Can you track progress and prove completion?
  const hasMetrics = /\d+|times|daily|weekly|every|at least|students|people|reach|enroll|earn/.test(goalStatement.toLowerCase());
  const hasProof = /photo|screenshot|testimony|proof|demonstrate|show|present|evidence/.test(goalStatement.toLowerCase());
  const hasCheckpoint = /week|june|may|by|before|graduation/.test(goalStatement.toLowerCase());

  const measurabilityScore =
    hasMetrics && hasProof && hasCheckpoint
      ? 95
      : hasMetrics && hasProof
      ? 88
      : hasMetrics && hasCheckpoint
      ? 85
      : hasMetrics
      ? 80
      : hasProof
      ? 75
      : 70;

  // ── Overall score ──────────────────────────────────────────────────────────
  const overallScore = Math.round((thematicScore + ambitionScore + specificityScore + measurabilityScore) / 4);

  // ── Analysis & suggested tweak ─────────────────────────────────────────────
  let analysis = "";
  let suggestedTweak = "";

  if (overallScore >= 80) {
    analysis = `Strong alignment! Your goal clearly honors your declaration. You're set.`;
    suggestedTweak = "Your goal is solid as-is.";
  } else if (overallScore >= 70) {
    analysis = `Good alignment. Your goal reflects your declaration. Small tweak could strengthen it further.`;
    suggestedTweak = `Optional: Consider adding a phrase that echoes your declaration — e.g., "...to prove that I can ${declWords.slice(0, 2).join(" ")}..."`;
  } else {
    analysis = `Decent start. Your goal and declaration are related. A small rewrite could make the connection clearer.`;
    suggestedTweak = `Try opening with "To ${declaration.split(" ").slice(0, 2).join(" ")}, I..." to bridge your declaration and goal directly.`;
  }

  return {
    ambitionScore,
    thematicScore,
    specificityScore,
    measurabilityScore,
    overallScore,
    analysis,
    suggestedTweak,
  };
}
