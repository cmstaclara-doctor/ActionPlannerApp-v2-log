"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

// ── 12 Life Assessment Wheel areas ────────────────────────────────────────────
const PERSONAL_AREAS = [
  { key: "physical_health",   letter: "A", label: "Physical Health",       emoji: "💪", scale1: "Unhealthy",    scale5: "OK",           scale10: "Athletic" },
  { key: "mental_wellness",   letter: "B", label: "Mental Wellness",        emoji: "🧠", scale1: "Struggling",   scale5: "Managing",     scale10: "Peaceful" },
  { key: "relationships",     letter: "C", label: "Relationships",          emoji: "❤️",  scale1: "Lonely",       scale5: "Some Friends", scale10: "Rich Social Life" },
  { key: "romance",           letter: "D", label: "Romance",                emoji: "💕", scale1: "Heartbroken",  scale5: "Complicated",  scale10: "Deeply Loved" },
  { key: "family_home",       letter: "E", label: "Family & Home",          emoji: "🏡", scale1: "Drama",        scale5: "Getting Along",scale10: "Loving" },
  { key: "fun_recreation",    letter: "F", label: "Fun & Recreation",       emoji: "🎉", scale1: "No Fun",       scale5: "Some Hobbies", scale10: "Life's Exciting" },
] as const;

const PROFESSIONAL_AREAS = [
  { key: "career_satisfaction",  letter: "G", label: "Career Satisfaction",   emoji: "💼", scale1: "Hate My Job",     scale5: "It Pays Bills",    scale10: "Dream Career" },
  { key: "work_environment",     letter: "H", label: "Work Environment",       emoji: "🏢", scale1: "Toxic Workplace", scale5: "Tolerable",        scale10: "Amazing Team & Boss" },
  { key: "skills_abilities",     letter: "I", label: "Skills & Abilities",     emoji: "🔧", scale1: "Feel Incompetent",scale5: "Average Skills",   scale10: "Expert Level" },
  { key: "income_finances",      letter: "J", label: "Income & Finances",      emoji: "💰", scale1: "Broke / In Debt", scale5: "Making Ends Meet", scale10: "Financially Free" },
  { key: "professional_growth",  letter: "K", label: "Professional Growth",    emoji: "🚀", scale1: "Career Stuck",    scale5: "Slow Progress",    scale10: "Fast-Track Success" },
  { key: "purpose_spirituality", letter: "L", label: "Purpose & Spirituality", emoji: "✨", scale1: "No Meaning",      scale5: "Some Purpose",     scale10: "Clear Life Mission" },
] as const;

const ALL_AREAS = [...PERSONAL_AREAS, ...PROFESSIONAL_AREAS] as const;
type AreaKey = typeof ALL_AREAS[number]["key"];
type LetterKey = typeof ALL_AREAS[number]["letter"];

// ── Drill-down questions per area (shown when score ≤ 5) ─────────────────────
const DRILL_DOWN: Record<LetterKey, { id: string; label: string; placeholder?: string; suggestions?: string[] }[]> = {
  A: [
    { id: "healthConcern", label: "What specific health concern is affecting you most?",
      suggestions: ["weight / body composition", "low energy / fatigue", "chronic pain or illness", "mental-physical connection", "sleep quality"],
      placeholder: "e.g., weight, energy, chronic condition" },
    { id: "doctorCleared", label: "Have you gotten a doctor's clearance to work on this?",
      suggestions: ["Yes, I have clearance", "No, but I'll get one before Week 1", "My goal is low-risk (walking, diet only)", "I'll proceed carefully"] },
  ],
  B: [
    { id: "negativePattern", label: "What negative thought pattern keeps coming back?",
      suggestions: ["I'm not good enough", "I always fail", "People don't value me", "I'm not in control", "I'm behind everyone else"],
      placeholder: "e.g., 'I'm not good enough'" },
    { id: "targetQuality", label: "What quality would you most like to embody instead?",
      suggestions: ["calm", "grounded", "confident", "joyful", "present", "loving", "courageous"] },
  ],
  C: [
    { id: "targetPerson", label: "Which relationship matters most to improve?",
      suggestions: ["best friend", "close group of friends", "community / barkada", "work colleagues", "mentor / coach"],
      placeholder: "e.g., best friend, barkada" },
    { id: "showUpAs", label: "What's one quality you want to show up as for that person?",
      suggestions: ["present", "generous", "consistent", "honest", "fun", "supportive"] },
  ],
  D: [
    { id: "readinessMode", label: "Are you currently in a relationship or preparing for one?",
      suggestions: ["Preparing — I want to be ready for someone special", "Currently in one and want to deepen it", "Recovering from a breakup"] },
    { id: "innerQuality", label: "What quality do you most want to build in yourself first?",
      suggestions: ["self-love", "security", "openness", "patience", "boundaries", "playfulness"] },
  ],
  E: [
    { id: "targetPerson", label: "Which family relationship needs the most attention?",
      suggestions: ["parent", "sibling", "partner", "child", "extended family"],
      placeholder: "e.g., my mom, my younger sibling" },
    { id: "keyAction", label: "What consistent action would make the biggest difference?",
      suggestions: ["regular quality time", "honest conversations", "acts of service", "physical presence", "asking how they're doing"] },
  ],
  F: [
    { id: "activityName", label: "What activity or hobby have you given up or always wanted to try?",
      suggestions: ["travel / adventure", "music (instrument)", "visual art / photography", "sports / fitness hobby", "language learning", "cooking / baking", "writing / journaling"],
      placeholder: "e.g., surfing, guitar, Tagalog poetry" },
    { id: "weeklyHours", label: "How much time per week could you realistically commit?",
      suggestions: ["1–2 hours", "3–4 hours", "5–6 hours", "7–10 hours", "10+ hours"] },
  ],
  G: [
    { id: "careerQuality", label: "What specific quality do you want to be known for at work?",
      suggestions: ["leadership", "reliability", "creativity", "strategic thinking", "calm under pressure", "technical excellence"],
      placeholder: "e.g., decisive leader, calm problem-solver" },
    { id: "currentBlock", label: "What's blocking you from being seen that way now?",
      suggestions: ["self-doubt", "not speaking up", "no visibility", "lack of opportunities", "imposter syndrome", "unclear on my own strengths"] },
  ],
  H: [
    { id: "priorityChange", label: "What one change to your workspace would most improve focus?",
      suggestions: ["proper desk / ergonomic setup", "noise reduction / quiet zone", "better lighting", "organized storage / systems", "dual monitor / better tech", "dedicated room / space"],
      placeholder: "e.g., standing desk, quiet corner" },
    { id: "budget", label: "What's your budget for workspace upgrades?",
      suggestions: ["₱2,000–5,000", "₱5,000–10,000", "₱10,000–20,000", "₱20,000–50,000", "₱50,000+"] },
  ],
  I: [
    { id: "targetSkill", label: "What skill, if mastered, would most 5× your income or impact?",
      suggestions: ["coding / software development", "video editing / content creation", "data analytics", "public speaking / facilitation", "copywriting / content writing", "design (UI/UX, graphic)", "digital marketing / SEO"],
      placeholder: "e.g., Python, video editing, public speaking" },
    { id: "weeklyHours", label: "How many hours per week can you dedicate to deliberate practice?",
      suggestions: ["3–5 hours", "5–8 hours", "8–12 hours", "12–20 hours", "20+ hours"] },
  ],
  J: [
    { id: "currentIncome", label: "What is your current monthly income (approx.)?",
      suggestions: ["₱10,000–15,000", "₱15,000–25,000", "₱25,000–40,000", "₱40,000–60,000", "₱60,000+", "None currently"],
      placeholder: "e.g., ₱30,000" },
    { id: "targetExtra", label: "What additional monthly income would meaningfully change your life?",
      suggestions: ["₱5,000–10,000", "₱10,000–20,000", "₱20,000–40,000", "₱40,000–80,000", "₱80,000+"] },
  ],
  K: [
    { id: "targetRole", label: "What role or level are you targeting in the next 12 months?",
      suggestions: ["team lead / senior individual contributor", "manager / department head", "C-suite / executive", "entrepreneur / founder", "international / regional role"],
      placeholder: "e.g., Senior Manager, CTO, Founder" },
    { id: "accelerator", label: "What specific quality or credential would most accelerate that?",
      suggestions: ["executive presence", "people management skills", "industry certification", "business acumen", "technical depth", "network / visibility"] },
  ],
  L: [
    { id: "lifePurpose", label: "Complete: My life will have mattered if I _____.",
      placeholder: "e.g., raised children who love themselves, built something that outlasted me",
      suggestions: [] },
    { id: "essenceQuality", label: "What essence quality best describes the person you are becoming?",
      suggestions: ["purposeful", "loving", "grounded", "courageous", "abundant", "joyful", "disciplined", "present", "generous", "wise"] },
  ],
};

// ── Score color helpers ───────────────────────────────────────────────────────
function scoreBg(score: number) {
  if (score <= 3) return "bg-red-500/15 text-red-400";
  if (score <= 5) return "bg-amber-400/15 text-amber-400";
  if (score <= 7) return "bg-yellow-300/15 text-yellow-300";
  return "bg-emerald-500/15 text-emerald-400";
}

// ── PillSelect — reusable pill chip component ─────────────────────────────────
function PillSelect({
  options,
  value,
  onChange,
  multi = false,
  allowOther = false,
  otherPlaceholder = "Type your answer…",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  allowOther?: boolean;
  otherPlaceholder?: string;
}) {
  const selected = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
  const customValues = selected.filter(s => !options.includes(s));
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  function toggle(opt: string) {
    if (multi) {
      const next = selected.includes(opt)
        ? selected.filter(s => s !== opt)
        : [...selected, opt];
      onChange(next.join(","));
    } else {
      onChange(selected[0] === opt ? "" : opt);
    }
  }

  function commitOther() {
    if (!otherText.trim()) return;
    const newItems = otherText.split(",").map(s => s.trim()).filter(Boolean);
    const merged = [...selected, ...newItems.filter(n => !selected.includes(n))];
    onChange(merged.join(","));
    setOtherText("");
  }

  function removeCustom(val: string) {
    onChange(selected.filter(s => s !== val).join(","));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
              selected.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
        {/* Custom value chips — visible, dismissible */}
        {customValues.map(val => (
          <span key={val} className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-sm font-medium border bg-primary/15 text-primary border-primary/40">
            {val}
            <button type="button" onClick={() => removeCustom(val)} className="ml-0.5 hover:text-destructive leading-none">&times;</button>
          </span>
        ))}
        {allowOther && (
          <button
            type="button"
            onClick={() => setShowOther(v => !v)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
              showOther ? "bg-muted border-primary/50 text-foreground" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            + My own
          </button>
        )}
      </div>
      {showOther && (
        <div className="flex gap-2">
          <input
            type="text"
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commitOther(); } }}
            placeholder={otherPlaceholder}
            className="flex-1 text-sm bg-transparent border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
          <button
            type="button"
            onClick={commitOther}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

// ── Yin-yang radar chart ──────────────────────────────────────────────────────
export function WolRadarChart({ scores }: { scores: Record<AreaKey, number> }) {
  const cx = 150, cy = 150, R = 100, total = 12;
  function spoke(index: number, value: number) {
    const a = (index * 2 * Math.PI) / total - Math.PI / 2 + Math.PI / 12;
    const r = (value / 10) * R;
    return { x: cx - r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  function rim(index: number, r = R) {
    const a = (index * 2 * Math.PI) / total - Math.PI / 2 + Math.PI / 12;
    return { x: cx - r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  const personalFan = `M ${cx} ${cy} ` + PERSONAL_AREAS.map((a, i) => { const p = spoke(i, scores[a.key]); return `L ${p.x} ${p.y}`; }).join(" ") + " Z";
  const professionalFan = `M ${cx} ${cy} ` + PROFESSIONAL_AREAS.map((a, i) => { const p = spoke(i + 6, scores[a.key]); return `L ${p.x} ${p.y}`; }).join(" ") + " Z";
  const sCurve = `M ${cx} ${cy - R} C ${cx - 55} ${cy} ${cx + 55} ${cy} ${cx} ${cy + R}`;
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[220px] mx-auto">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="currentColor" strokeWidth="0.8" className="text-border" opacity={0.25} />
      {[0.25, 0.5, 0.75].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={f * R} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" opacity={0.18} />
      ))}
      {ALL_AREAS.map((_, i) => { const e = rim(i); return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="currentColor" strokeWidth="0.5" className="text-border" opacity={0.18} />; })}
      <path d={personalFan} fill="#eab308" fillOpacity={0.22} stroke="#eab308" strokeWidth={1.5} strokeLinejoin="round" />
      <path d={professionalFan} fill="#a855f7" fillOpacity={0.22} stroke="#a855f7" strokeWidth={1.5} strokeLinejoin="round" />
      <path d={sCurve} fill="none" stroke="white" strokeWidth="1.5" opacity={0.35} strokeLinecap="round" />
      <circle cx={cx - 28} cy={cy} r={5} fill="#a855f7" fillOpacity={0.5} />
      <circle cx={cx + 28} cy={cy} r={5} fill="#eab308" fillOpacity={0.5} />
      {ALL_AREAS.map((area, i) => { const p = spoke(i, scores[area.key]); return <circle key={area.key} cx={p.x} cy={p.y} r={3.5} fill={i < 6 ? "#eab308" : "#a855f7"} stroke="rgba(255,255,255,0.6)" strokeWidth={1} />; })}
      {ALL_AREAS.map((area, i) => { const lp = rim(i, R + 16); return <text key={area.key} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="bold" fill={i < 6 ? "#ca8a04" : "#9333ea"}>{area.letter}</text>; })}
    </svg>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type WolScores = Record<AreaKey, number>;
export type WolDrillDown = Partial<Record<LetterKey, Record<string, string>>>;

interface Props {
  onComplete: (scores: WolScores, drillDown: WolDrillDown) => void;
}

const DEFAULT_SCORES = Object.fromEntries(ALL_AREAS.map(a => [a.key, 5])) as WolScores;

export function WheelOfLifeQuick({ onComplete }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [scores, setScores] = useState<WolScores>({ ...DEFAULT_SCORES });
  const [drillDown, setDrillDown] = useState<WolDrillDown>({});
  const [done, setDone] = useState(false);

  const setScore = (key: AreaKey, val: number) =>
    setScores(p => ({ ...p, [key]: val }));

  const setDrill = (letter: LetterKey, qId: string, val: string) =>
    setDrillDown(p => ({ ...p, [letter]: { ...(p[letter] || {}), [qId]: val } }));

  function handleSubmit() {
    setDone(true);
    setCollapsed(true);
    onComplete(scores, drillDown);
  }

  if (done && collapsed) {
    const lowestThree = [...ALL_AREAS].sort((a, b) => scores[a.key] - scores[b.key]).slice(0, 3);
    return (
      <div
        className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setCollapsed(false)}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Wheel of Life ✓</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Focus areas: {lowestThree.map(a => `${a.letter} – ${a.label}`).join(" · ")}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
        <WolRadarChart scores={scores} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Life Assessment Wheel</p>
          <p className="text-xs text-muted-foreground mt-0.5">Answer 2 quick questions per area, then rate it 1–10</p>
        </div>
        {done && (
          <button type="button" title="Collapse" onClick={() => setCollapsed(true)} className="text-xs text-muted-foreground hover:text-foreground">
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Personal A–F */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-3">Personal · A – F</p>
        <div className="space-y-4">
          {PERSONAL_AREAS.map(area => (
            <AreaRow
              key={area.key}
              area={area}
              score={scores[area.key]}
              onScore={v => setScore(area.key, v)}
              drillDown={drillDown}
              onDrill={setDrill}
            />
          ))}
        </div>
      </div>

      {/* Professional G–L */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-3">Professional · G – L</p>
        <div className="space-y-4">
          {PROFESSIONAL_AREAS.map(area => (
            <AreaRow
              key={area.key}
              area={area}
              score={scores[area.key]}
              onScore={v => setScore(area.key, v)}
              drillDown={drillDown}
              onDrill={setDrill}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        <Check className="h-4 w-4" />
        Save My Wheel Assessment
      </button>

      {/* Chart shown after completion */}
      {done && <WolRadarChart scores={scores} />}
    </div>
  );
}

// ── Area row: collapsible — header always visible, content expands on tap ────
// Psychological design: questions prime honest self-reflection before the number.
function AreaRow({
  area,
  score,
  onScore,
  drillDown,
  onDrill,
}: {
  area: { key: string; letter: string; label: string; emoji: string; scale1: string; scale5: string; scale10: string };
  score: number;
  onScore: (v: number) => void;
  drillDown: WolDrillDown;
  onDrill: (letter: LetterKey, qId: string, val: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const isPersonal = ["A","B","C","D","E","F"].includes(area.letter);
  const letter = area.letter as LetterKey;
  const questions = DRILL_DOWN[letter];

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 overflow-hidden">

      {/* Tappable header — always visible */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-3.5 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPersonal ? "bg-yellow-400/15 text-yellow-500" : "bg-purple-500/15 text-purple-400"}`}>
            {area.letter}
          </span>
          <span className="text-sm font-semibold text-foreground">{area.emoji} {area.label}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(score)}`}>{score}/10</span>
          {collapsed
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expandable content */}
      {!collapsed && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/40 pt-3">
          {/* Questions first — prime the reflection */}
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{q.label}</p>
                {q.suggestions && q.suggestions.length > 0 ? (
                  <PillSelect
                    options={q.suggestions}
                    value={drillDown[letter]?.[q.id] || ""}
                    onChange={v => onDrill(letter, q.id, v)}
                    multi={true}
                    allowOther={true}
                    otherPlaceholder={q.placeholder || "Type your answer…"}
                  />
                ) : (
                  <textarea
                    rows={2}
                    value={drillDown[letter]?.[q.id] || ""}
                    onChange={e => onDrill(letter, q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full text-sm bg-transparent border border-input rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Slider AFTER questions — now rate honestly */}
          <div className="pt-2 space-y-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Now rate this area:</p>
              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${scoreBg(score)}`}>{score} / 10</span>
            </div>
            <input
              type="range" min={1} max={10} value={score}
              onChange={e => onScore(Number(e.target.value))}
              className="w-full accent-primary h-2"
              title={`${area.label}: ${score}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground/80 leading-tight">
              <span className="text-left w-1/3">1 = {area.scale1}</span>
              <span className="text-center w-1/3">5 = {area.scale5}</span>
              <span className="text-right w-1/3">10 = {area.scale10}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
