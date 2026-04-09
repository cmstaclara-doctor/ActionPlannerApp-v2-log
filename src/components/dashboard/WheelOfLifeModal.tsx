"use client";

import { useState } from "react";
import { generateWheelGoals } from "@/lib/actions/wheel-of-life";
import { scanForPII } from "@/lib/utils/pii-scan";

// ── 12 categories from the Life Assessment Wheel (MWF.v5) ──────────────────

// Enrollment goal draws from F (experiencing / aliveness) + L (essence / beingness / purpose)
// Personal  → A–F  |  Professional → G–L
const PERSONAL_AREAS = [
  { key: "physical_health",    letter: "A", label: "Physical Health",       emoji: "💪", scale: "1=Unhealthy · 5=OK · 10=Athletic",                    goalType: "personal",    enrollmentArea: false },
  { key: "mental_wellness",    letter: "B", label: "Mental Wellness",        emoji: "🧠", scale: "1=Struggling · 5=Managing · 10=Peaceful",              goalType: "personal",    enrollmentArea: false },
  { key: "relationships",      letter: "C", label: "Relationships",          emoji: "❤️",  scale: "1=Lonely · 5=Some Friends · 10=Rich Social Life",      goalType: "personal",    enrollmentArea: true  },
  { key: "romance",            letter: "D", label: "Romance",                emoji: "💕", scale: "1=Heartbroken · 5=Complicated · 10=Deeply Loved",      goalType: "personal",    enrollmentArea: false },
  { key: "family_home",        letter: "E", label: "Family & Home",          emoji: "🏡", scale: "1=Drama · 5=Getting Along · 10=Loving",                goalType: "personal",    enrollmentArea: false },
  { key: "fun_recreation",     letter: "F", label: "Fun & Recreation",       emoji: "🎉", scale: "1=No Fun · 5=Some Hobbies · 10=Life's Exciting",       goalType: "personal",    enrollmentArea: false },
] as const;

const PROFESSIONAL_AREAS = [
  { key: "career_satisfaction",  letter: "G", label: "Career Satisfaction",   emoji: "💼", scale: "1=Hate My Job · 5=It Pays Bills · 10=Dream Career",         goalType: "professional", enrollmentArea: false },
  { key: "work_environment",     letter: "H", label: "Work Environment",       emoji: "🏢", scale: "1=Toxic Workplace · 5=Tolerable · 10=Amazing Team & Boss",   goalType: "professional", enrollmentArea: false },
  { key: "skills_abilities",     letter: "I", label: "Skills & Abilities",     emoji: "🔧", scale: "1=Feel Incompetent · 5=Average Skills · 10=Expert Level",    goalType: "professional", enrollmentArea: false },
  { key: "income_finances",      letter: "J", label: "Income & Finances",      emoji: "💰", scale: "1=Broke / In Debt · 5=Making Ends Meet · 10=Financially Free", goalType: "professional", enrollmentArea: false },
  { key: "professional_growth",  letter: "K", label: "Professional Growth",    emoji: "🚀", scale: "1=Career Stuck · 5=Slow Progress · 10=Fast-Track Success",   goalType: "professional", enrollmentArea: false },
  { key: "purpose_spirituality", letter: "L", label: "Purpose & Spirituality", emoji: "✨", scale: "1=No Meaning · 5=Some Purpose · 10=Clear Life Mission",      goalType: "professional", enrollmentArea: true  },
] as const;

const WHEEL_AREAS = [...PERSONAL_AREAS, ...PROFESSIONAL_AREAS] as const;
type AreaKey = typeof WHEEL_AREAS[number]["key"];

// ── helpers ────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score < 4) return "text-red-500";
  if (score < 7) return "text-amber-400";
  return "text-emerald-500";
}

function scoreBg(score: number) {
  if (score < 4) return "bg-red-500/15 text-red-500";
  if (score < 7) return "bg-amber-400/15 text-amber-400";
  return "bg-emerald-500/15 text-emerald-600";
}

// ── Yin-yang radar chart ───────────────────────────────────────────────────
// Personal A–F  = LEFT half   = yellow/gold   (left brain)
// Professional G–L = RIGHT half = purple       (right brain)
// S-curve divides the two halves through the center

function RadarChart({ scores }: { scores: Record<AreaKey, number> }) {
  const cx = 150, cy = 150, R = 100;
  const total = 12;

  // Mirror x-axis (A-F → LEFT, G-L → RIGHT) + rotate CCW by half a step (15°)
  // so the dividing line falls in the gap between A↔L at top and F↔G at bottom
  function spoke(index: number, value: number) {
    const a = (index * 2 * Math.PI) / total - Math.PI / 2 + Math.PI / 12;
    const r = (value / 10) * R;
    return { x: cx - r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function rim(index: number, r = R) {
    const a = (index * 2 * Math.PI) / total - Math.PI / 2 + Math.PI / 12;
    return { x: cx - r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  // Fan paths — each half fans from center out to scored points
  // A–F = indices 0–5, G–L = indices 6–11
  const personalFan = `M ${cx} ${cy} ` +
    PERSONAL_AREAS.map((a, i) => { const p = spoke(i, scores[a.key]); return `L ${p.x} ${p.y}`; }).join(" ") + " Z";

  const professionalFan = `M ${cx} ${cy} ` +
    PROFESSIONAL_AREAS.map((a, i) => { const p = spoke(i + 6, scores[a.key]); return `L ${p.x} ${p.y}`; }).join(" ") + " Z";

  // Yin-yang S-curve: fixed on the exact vertical axis, control points at midline
  // so the curve enters VERTICALLY between A↔L at top and F↔G at bottom,
  // then bows into the S-shape through the middle
  const sCurve = `M ${cx} ${cy - R} C ${cx - 55} ${cy} ${cx + 55} ${cy} ${cx} ${cy + R}`;

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[260px] mx-auto">
      {/* Outer circle boundary */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeWidth="0.8" className="text-border" opacity={0.25} />

      {/* Concentric ring guides */}
      {[0.25, 0.5, 0.75].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={f * R} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" opacity={0.18} />
      ))}

      {/* Spokes */}
      {WHEEL_AREAS.map((_, i) => {
        const e = rim(i);
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="currentColor" strokeWidth="0.5" className="text-border" opacity={0.18} />;
      })}

      {/* Personal half — yellow fan */}
      <path d={personalFan} fill="#eab308" fillOpacity={0.22} stroke="#eab308" strokeWidth={1.5} strokeLinejoin="round" />

      {/* Professional half — purple fan */}
      <path d={professionalFan} fill="#a855f7" fillOpacity={0.22} stroke="#a855f7" strokeWidth={1.5} strokeLinejoin="round" />

      {/* Yin-yang S-curve divider */}
      <path d={sCurve} fill="none" stroke="white" strokeWidth="1.5" opacity={0.35} strokeLinecap="round" />

      {/* Yin-yang accent dots — tiny dot of opposite color in each half */}
      <circle cx={cx - 28} cy={cy} r={5} fill="#a855f7" fillOpacity={0.5} />   {/* purple dot in personal/left */}
      <circle cx={cx + 28} cy={cy} r={5} fill="#eab308" fillOpacity={0.5} />   {/* yellow dot in professional/right */}

      {/* Score dots at each spoke tip */}
      {WHEEL_AREAS.map((area, i) => {
        const p = spoke(i, scores[area.key]);
        const isPersonal = i < 6;
        return <circle key={area.key} cx={p.x} cy={p.y} r={3.5} fill={isPersonal ? "#eab308" : "#a855f7"} stroke="rgba(255,255,255,0.6)" strokeWidth={1} />;
      })}

      {/* Letter labels */}
      {WHEEL_AREAS.map((area, i) => {
        const lp = rim(i, R + 16);
        const isPersonal = i < 6;
        return (
          <text key={area.key} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="8" fontWeight="bold" fill={isPersonal ? "#ca8a04" : "#9333ea"}>
            {area.letter}
          </text>
        );
      })}
    </svg>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className={`flex items-center gap-2 pt-3 pb-1`}>
      <div className={`h-px flex-1 ${color === "yellow" ? "bg-yellow-400/30" : "bg-purple-500/30"}`} />
      <span className={`text-[11px] font-bold uppercase tracking-widest px-2 ${color === "yellow" ? "text-yellow-400" : "text-purple-400"}`}>
        {label}
      </span>
      <div className={`h-px flex-1 ${color === "yellow" ? "bg-yellow-400/30" : "bg-purple-500/30"}`} />
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────

interface WheelOfLifeModalProps {
  studentId: string;
  studentName: string;
  declaration: string | null;
  onComplete: (scores: Record<AreaKey, number>, goals: { enrollment: string; personal: string; professional: string }) => void;
  onClose: () => void;
}

const DEFAULT_SCORES = Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5])) as Record<AreaKey, number>;

const GOAL_CONFIG = {
  enrollment:   { label: "Enrollment Goal",   color: "text-blue-500",   border: "border-blue-500",   bg: "bg-blue-500/10",   badge: "bg-blue-500/20 text-blue-400"   },
  personal:     { label: "Personal Goal",      color: "text-yellow-400", border: "border-yellow-400", bg: "bg-yellow-400/10", badge: "bg-yellow-400/20 text-yellow-300"},
  professional: { label: "Professional Goal",  color: "text-purple-500", border: "border-purple-500", bg: "bg-purple-500/10", badge: "bg-purple-500/20 text-purple-400"},
} as const;

export function WheelOfLifeModal({ studentId, studentName, declaration, onComplete, onClose }: WheelOfLifeModalProps) {
  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [scores, setScores] = useState<Record<AreaKey, number>>(DEFAULT_SCORES);
  const [aiGoals, setAiGoals] = useState({ enrollment: "", personal: "", professional: "" });

  async function generateGoals() {
    if (declaration) {
      const scan = scanForPII(declaration);
      if (!scan.clean) {
        const ok = window.confirm(`⚠️ Privacy Check\n\nDeclaration may contain: ${scan.warnings.join(", ")}.\n\nIt will be automatically redacted before reaching the AI.\n\nContinue?`);
        if (!ok) return;
      }
    }
    setStep(2);
    try {
      const result = await generateWheelGoals(studentId, scores, declaration);
      setAiGoals(result);
    } catch { /* keep empty drafts */ }
    setStep(3);
  }

  function getLowestByType(goalType: string, n = 2) {
    // Enrollment goal is informed by F (experiencing) + L (essence/beingness)
    const pool = goalType === "enrollment"
      ? [...WHEEL_AREAS].filter((a) => a.enrollmentArea)
      : [...WHEEL_AREAS].filter((a) => a.goalType === goalType);
    return pool.sort((a, b) => scores[a.key] - scores[b.key]).slice(0, n);
  }

  function overallLowest(n = 3) {
    return [...WHEEL_AREAS].sort((a, b) => scores[a.key] - scores[b.key]).slice(0, n);
  }

  const setScore = (key: AreaKey, val: number) => setScores((p) => ({ ...p, [key]: val }));

  // ── Step 1: Rate ──────────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-2xl border border-border p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors" aria-label="Close">✕</button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground">Life Assessment Wheel</h2>
          <p className="text-sm text-muted-foreground mt-1">Rate each area of {studentName}&apos;s life from 1–10</p>
        </div>

        {/* Personal A–F */}
        <SectionHeader label="Personal  ·  A – F" color="yellow" />
        <div className="space-y-4 mt-2">
          {PERSONAL_AREAS.map((area) => {
            const score = scores[area.key];
            return (
              <div key={area.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-yellow-400/15 text-yellow-500">{area.letter}</span>
                    <span>{area.emoji} {area.label}</span>
                    {area.enrollmentArea && (
                      <span className="text-[10px] px-1.5 py-0 rounded-full bg-blue-500/15 text-blue-400 font-medium">Enrollment</span>
                    )}
                  </span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBg(score)}`}>{score}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{area.scale}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setScore(area.key, n)}
                      className={`w-7 h-7 text-xs font-bold rounded-full transition-colors ${score === n ? "bg-yellow-400 text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Professional G–L */}
        <SectionHeader label="Professional  ·  G – L" color="purple" />
        <div className="space-y-4 mt-2">
          {PROFESSIONAL_AREAS.map((area) => {
            const score = scores[area.key];
            return (
              <div key={area.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400">{area.letter}</span>
                    <span>{area.emoji} {area.label}</span>
                    {area.enrollmentArea && (
                      <span className="text-[10px] px-1.5 py-0 rounded-full bg-blue-500/15 text-blue-400 font-medium">Enrollment</span>
                    )}
                  </span>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBg(score)}`}>{score}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{area.scale}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setScore(area.key, n)}
                      className={`w-7 h-7 text-xs font-bold rounded-full transition-colors ${score === n ? "bg-purple-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Wheel preview */}
        <div className="mt-6 mb-4">
          <p className="text-xs text-muted-foreground text-center mb-1 font-medium uppercase tracking-wider">Your Wheel Preview</p>
          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="text-[10px] text-yellow-400 font-medium">● Personal A–F</span>
            <span className="text-[10px] text-purple-400 font-medium">● Professional G–L</span>
          </div>
          <RadarChart scores={scores} />
        </div>

        <button onClick={generateGoals} className="w-full min-h-[44px] bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm mt-2">
          Next: Generate My Goals →
        </button>
      </div>
    </div>
  );

  // ── Step 2: AI loading ────────────────────────────────────────────────────
  if (step === 2) return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center gap-5">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <div>
          <h2 className="text-lg font-bold text-foreground">AI is crafting your goals…</h2>
          <p className="text-sm text-muted-foreground mt-2">Analyzing all 12 Life Assessment areas + declaration to create personalized goal suggestions</p>
        </div>
      </div>
    </div>
  );

  // ── Step 3: Review ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-card rounded-2xl border border-border p-6 max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors" aria-label="Close">✕</button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-foreground">Your Personalized Goals</h2>
          <p className="text-sm text-muted-foreground mt-1">AI-suggested from your 12-area Life Assessment Wheel + declaration</p>
        </div>

        {/* Top 3 focus areas */}
        <div className="mb-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Focus areas (lowest scores)</p>
          <div className="flex flex-wrap gap-2">
            {overallLowest(4).map((area) => (
              <span key={area.key} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                <span className="font-bold text-foreground">{area.letter}.</span>
                {area.emoji} {area.label}
                <span className={`ml-1 font-bold ${scoreColor(scores[area.key])}`}>{scores[area.key]}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Goal cards */}
        <div className="space-y-4">
          {(["enrollment", "personal", "professional"] as const).map((type) => {
            const cfg = GOAL_CONFIG[type];
            const topAreas = getLowestByType(type, 2);
            return (
              <div key={type} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {topAreas.map((area) => (
                      <span key={area.key} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
                        {area.letter}. {area.label} <span className="opacity-70">{scores[area.key]}/10</span>
                      </span>
                    ))}
                  </div>
                </div>
                {type === "enrollment" && (
                  <div className="mb-2.5 space-y-1 rounded-lg bg-blue-500/5 border border-blue-500/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Enrollment Goal — Guiding Questions</p>
                    <p className="text-[11px] text-muted-foreground">• <span className="font-medium text-foreground/80">Beingness:</span> Who are you being in this goal? What way of being do you commit to?</p>
                    <p className="text-[11px] text-muted-foreground">• <span className="font-medium text-foreground/80">Essence qualities:</span> What 2–3 qualities (e.g., courageous, loving, committed) define how you show up?</p>
                    <p className="text-[11px] text-muted-foreground">• <span className="font-medium text-foreground/80">Relationships (C):</span> Who are you enrolling into this vision with you?</p>
                    <p className="text-[11px] text-muted-foreground">• <span className="font-medium text-foreground/80">Purpose (L):</span> What deeper mission does this goal serve?</p>
                  </div>
                )}
                <textarea
                  value={aiGoals[type]}
                  onChange={(e) => setAiGoals((p) => ({ ...p, [type]: e.target.value }))}
                  rows={3}
                  placeholder={type === "enrollment" ? "e.g. I am a courageous and loving leader, enrolling my family and community into a life of growth and purpose…" : `Enter ${cfg.label.toLowerCase()} here…`}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button onClick={() => onComplete(scores, aiGoals)} className="w-full min-h-[44px] bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors text-sm">
            Apply These Goals
          </button>
          <button
            onClick={() => { setScores(DEFAULT_SCORES); setAiGoals({ enrollment: "", personal: "", professional: "" }); setStep(1); }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 text-center py-1"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}
