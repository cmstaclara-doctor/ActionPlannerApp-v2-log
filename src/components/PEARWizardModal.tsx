"use client";

import { useState, useMemo, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Check, Edit3, ArrowRight, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { GOAL_TEMPLATES, WHEEL_AREA_SUGGESTIONS, type GoalTemplate, type TemplateQuestion } from "@/lib/data/goal-templates";
import { PEAR_SAMPLES, PEG_SUGGESTIONS, type SampleEntry } from "@/lib/data/pear-samples";
import { getWeekDates } from "@/lib/utils/week-dates";
import { checkSMARTER, getMilestoneFeasibility, checkTargetAmbition, checkFrequencyRisk, checkMetricComplexity, getDeclarationAlignmentScore, checkMilestoneGoalAlignment, checkActionMilestoneCoverage, type SmarterCheck } from "@/lib/utils/alignment-rules";
import { assessGoalDeclarationFit, type DeclarationFitResult } from "@/lib/actions/alignment";

// ── Types ─────────────────────────────────────────────────────────────────────

type GoalCategory = "enrollment" | "personal" | "professional";
type WizardStep = "template" | "samples" | "context" | "smarter" | "preview" | "signoff";

export interface AppliedGoal {
  template: GoalTemplate;
  answers: Record<string, string>;
  pearStatement: string;
}

interface Props {
  goalType: GoalCategory;
  declarationText?: string | null;
  declarationMeaning?: string | null;
  initialGoal?: AppliedGoal;
  initialSubCategoryId?: string;
  startAt?: "samples" | "preview";
  focusWeek?: number;
  onApply: (goal: AppliedGoal) => void;
  onClose: () => void;
}

// ── Sub-category definitions ──────────────────────────────────────────────────

export const SUBCATEGORIES: Record<GoalCategory, { id: string; label: string; description: string; templateId: string; safetyNote?: string }[]> = {
  enrollment: [
    { id: "enrollment",      label: "Enroll 1 FLEX + 1 ALC",         description: "Standard: 1 FLEX (May) + 1 ALC (June) through outreach at least 3x a week.", templateId: "enrollment-flex-alc" },
    { id: "enrollment-high", label: "Higher Enrollment Commitment",   description: "For those going beyond the minimum — 2+ FLEX, 2+ ALC, 4+ LEAP through consistent effort.", templateId: "enrollment-high-volume" },
  ],
  personal: [
    { id: "health",               label: "Health & Body",                  description: "Doctor-cleared, sustainable 8-week movement + nutrition plan.",                          templateId: "personal-health",                safetyNote: "⚕️ Doctor consultation required" },
    { id: "beingness",            label: "Mindset & Being-ness",           description: "Embody a specific quality (discipline, calm, joy) through a daily practice.",             templateId: "personal-beingness" },
    { id: "relationship-deepen",  label: "Deepening a Relationship",       description: "Show up consistently for a partner, parent, sibling, or friend.",                        templateId: "personal-relationship-deepen" },
    { id: "relationship-prepare", label: "Becoming Partner-Ready",         description: "Build the inner qualities you want to bring to a future relationship.",                   templateId: "personal-relationship-prepare" },
    { id: "experience-goal",      label: "Experience, Hobby & Personal Skill", description: "A trip, language, instrument, sport, or creative project. Not for work. Just for you.", templateId: "personal-experience-goal" },
  ],
  professional: [
    { id: "income-employed",   label: "Extra Income (Employed)",          description: "Generate additional monthly income alongside your current employment.",             templateId: "professional-income-employed" },
    { id: "income-exploring",  label: "Finding Income (Exploring)",       description: "Create income from zero — freelance, gig, coaching, or employment.",              templateId: "professional-income-exploring" },
    { id: "career-beingness",  label: "Career Identity",                  description: "Embody the professional presence of the role you want — not a promotion, a quality.", templateId: "professional-career-beingness" },
    { id: "skills",            label: "Skill Building + Showcase",        description: "Build a creative or professional skill, culminating in a real showcase.",           templateId: "professional-skills" },
    { id: "workspace-design",  label: "Workspace by Design",              description: "Build a workspace that matches your ambition — tools, systems, and routine.",       templateId: "professional-workspace-design" },
  ],
};

// ── PEAR builder ──────────────────────────────────────────────────────────────

function buildPEARStatement(template: GoalTemplate, answers: Record<string, string>): string {
  const smarter = template.smarter(answers);
  const peg = (answers.exciting?.trim() || PEG_SUGGESTIONS[template.id]?.[0] || "achieve this goal").replace(/^to\s+/i, "");
  const essArr = (answers.essence || "loving,committed,courageous").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);
  const essence = essArr.length >= 3
    ? `${essArr[0]}, ${essArr[1]}, and ${essArr[2]}`
    : essArr.join(", ") || "loving, committed, and courageous";

  // Extract the action/result body from goalStatement by finding ", I will " or ", I "
  // (avoids the regex comma-in-essence problem)
  const goalStmt = (smarter.goalStatement || "").replace(/\.\s*$/, "");
  const iWillIdx = goalStmt.indexOf(", I will ");
  const iIdx = iWillIdx >= 0 ? iWillIdx : goalStmt.indexOf(", I ");
  const body = (iIdx >= 0 ? goalStmt.slice(iIdx + 2) : goalStmt).trim();

  return `To ${peg}, as a ${essence} person, ${body}.`;
}

// ── Official 45 Essence Qualities (Miracle Warriors Foundation v10-01) ────────

const ESSENCE_DATA = [
  { label: "Character & Integrity",   qualities: ["Honest","Integrity","Authentic","Humble","Worthy"] },
  { label: "Emotional Intelligence",  qualities: ["Empathetic","Compassionate","Gentle","Patient","Wise"] },
  { label: "Personal Power",          qualities: ["Empowered","Courageous","Powerful","Confident","Successful"] },
  { label: "Relationships",           qualities: ["Loving","Caring","Trusting","Respectful","Accepting"] },
  { label: "Communication",           qualities: ["Expressive","Open","Inspiring","Brave","Persistent"] },
  { label: "Service & Generosity",    qualities: ["Giving","Abundant","Responsible","Committed","Cooperative"] },
  { label: "Professional Excellence", qualities: ["Reliable","Punctual","Hardworking","Focused","Innovative"] },
  { label: "Healing & Growth",        qualities: ["Forgiving","Vulnerable","Peaceful","Grateful","Resilient"] },
  { label: "Joy & Passion",           qualities: ["Joyful","Passionate","Positive","Creative","Vibrant"] },
];

function EssencePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean) : [];
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");

  function addCustom() {
    const val = customInput.trim().toLowerCase();
    if (!val || selected.includes(val) || selected.length >= 3) return;
    onChange([...selected, val].join(","));
    setCustomInput("");
  }

  function toggle(q: string) {
    const key = q.toLowerCase();
    if (selected.includes(key)) {
      onChange(selected.filter(s => s !== key).join(","));
    } else if (selected.length < 3) {
      onChange([...selected, key].join(","));
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected chips */}
      <div className="flex flex-wrap items-center gap-2 min-h-[2.5rem]">
        {selected.length === 0 && <span className="text-xs text-muted-foreground italic">None selected yet</span>}
        {selected.map(q => (
          <span key={q} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground capitalize">
            {q}
            <button type="button" title={`Remove ${q}`} onClick={() => onChange(selected.filter(s => s !== q).join(","))} className="ml-0.5 hover:opacity-70 leading-none">&times;</button>
          </span>
        ))}
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${selected.length === 3 ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
          {selected.length}/3 {selected.length === 3 ? "✓" : ""}
        </span>
      </div>

      {/* Toggle full list */}
      <button type="button" onClick={() => setOpen(v => !v)}
        className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
        {open ? "Hide qualities ↑" : "Browse all 45 essence qualities ↓"}
      </button>

      {/* Grouped quality grid */}
      {open && (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 rounded-xl border border-border bg-background/50 p-3">
          {ESSENCE_DATA.map(cat => (
            <div key={cat.label}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{cat.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {cat.qualities.map(q => {
                  const key = q.toLowerCase();
                  const active = selected.includes(key);
                  const disabled = !active && selected.length >= 3;
                  return (
                    <button key={q} type="button" disabled={disabled} onClick={() => toggle(q)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active   ? "bg-primary text-primary-foreground border-primary" :
                        disabled ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed" :
                                   "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}>
                      {q}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {/* Add your own quality */}
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1.5">Don't see yours? Add it:</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                placeholder="e.g. Resilient, Disciplined…"
                disabled={selected.length >= 3}
                className="flex-1 text-xs bg-background border border-input rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
              />
              <button type="button" onClick={addCustom}
                disabled={!customInput.trim() || selected.length >= 3}
                className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-opacity">
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pill select component ─────────────────────────────────────────────────────

function PillSelect({
  options,
  value,
  onChange,
  multi = false,
  allowOther = false,
  maxSelect,
  otherPlaceholder = "Type your own…",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
  allowOther?: boolean;
  maxSelect?: number;
  otherPlaceholder?: string;
}) {
  const selected = value ? value.split(",").map(s => s.trim()).filter(Boolean) : [];
  const customValues = selected.filter(s => !options.includes(s));
  const [showOther, setShowOther] = useState(false);
  const [otherText, setOtherText] = useState("");

  function toggle(opt: string) {
    if (multi) {
      const isOn = selected.includes(opt);
      if (!isOn && maxSelect && selected.length >= maxSelect) return; // at limit
      const next = isOn ? selected.filter(s => s !== opt) : [...selected, opt];
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
        {options.map(opt => {
          const active = selected.includes(opt);
          const disabled = !active && !!maxSelect && selected.length >= maxSelect;
          return (
            <button
              key={opt}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : disabled
                    ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
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

// ── Number quick-pick ─────────────────────────────────────────────────────────

function NumberPills({
  quickPicks,
  value,
  onChange,
  unit = "",
  placeholder = "Custom number",
}: {
  quickPicks: string[];
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
}) {
  const [custom, setCustom] = useState(!quickPicks.includes(value) && value !== "");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {quickPicks.map(qp => (
          <button
            key={qp}
            type="button"
            onClick={() => { setCustom(false); onChange(qp); }}
            className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
              value === qp && !custom
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {qp}{unit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustom(v => !v)}
          className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
            custom ? "bg-muted border-primary/50 text-foreground" : "bg-muted text-muted-foreground border-border hover:border-primary/50"
          }`}
        >
          Custom
        </button>
      </div>
      {custom && (
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-sm bg-transparent border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
      )}
    </div>
  );
}

// ── Per-day hours picker ──────────────────────────────────────────────────────

function PerDayHoursPicker({ days, defaultHours, mapValue, onChange }: {
  days: string[];
  defaultHours: string;
  mapValue: string;
  onChange: (avg: string, mapJson: string) => void;
}) {
  let stored: Record<string, string> = {};
  try { if (mapValue) stored = JSON.parse(mapValue); } catch { /* empty */ }
  const resolved: Record<string, string> = {};
  days.forEach(d => { resolved[d] = stored[d] || defaultHours || "1"; });

  function setDayHours(day: string, hours: string) {
    const next = { ...resolved, [day]: hours };
    const vals = Object.values(next).map(v => parseFloat(v)).filter(n => !isNaN(n) && n > 0);
    const avg = vals.length > 0 ? String((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)) : defaultHours;
    onChange(avg, JSON.stringify(next));
  }

  const PICKS = ["1", "2", "3", "4"];

  return (
    <div className="space-y-2">
      {days.map(day => (
        <div key={day} className="flex items-center gap-2">
          <span className="w-9 text-xs font-bold text-foreground shrink-0">{day}</span>
          <div className="flex flex-wrap gap-1.5">
            {PICKS.map(p => (
              <button key={p} type="button" onClick={() => setDayHours(day, p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  resolved[day] === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}>
                {p}h
              </button>
            ))}
            <input type="number" min="0.5" max="16" step="0.5"
              value={!PICKS.includes(resolved[day]) ? resolved[day] : ""}
              onChange={e => setDayHours(day, e.target.value)}
              placeholder="?"
              title={`${day} custom hours`}
              className="w-14 text-xs bg-transparent border border-input rounded-full px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">
        Avg {(() => {
          const vals = days.map(d => parseFloat(resolved[d])).filter(n => !isNaN(n));
          return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : defaultHours;
        })()}h/day · {days.length} active day{days.length !== 1 ? "s" : ""}
      </p>
      {(days.includes("Sat") || days.includes("Sun")) && (
        <p className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded-lg px-2.5 py-1.5 leading-relaxed">
          ⚠️ LEAP 99 has full-day events on weekends (9am–6pm) — plan your hours accordingly:<br />
          <span className="text-amber-300/80">May 9–10 FLEX 298 · May 16–17 FLEX 299 + 1st Workshop · May 23–24 2nd Intensive · Jun 5–7 ALC 256 · Jun 12–14 ALC 257 + 2nd Workshop · Jun 21 Graduation</span>
        </p>
      )}
    </div>
  );
}

// ── Schedule picker (replaces commitDays + hoursPerDay) ──────────────────────
// Stores as "Mon:1,Tue:2,Fri:1.5" — days with 0 hrs are omitted

function SchedulePicker({ value, defaultValue, onChange }: {
  value: string;
  defaultValue?: string;
  onChange: (v: string) => void;
}) {
  const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const CHIPS = [1, 2, 3, 4];

  // Parse current state
  const src = (value && value.trim()) || (defaultValue && defaultValue.trim()) || "Mon:1,Tue:1,Wed:1,Thu:1,Fri:1";
  const parsed: Record<string, number> = {};
  src.split(",").filter(Boolean).forEach(e => {
    const [d, h] = e.split(":");
    if (d) parsed[d.trim()] = parseFloat(h) || 0;
  });

  function setDay(day: string, hrs: number) {
    const next = { ...parsed };
    if (hrs <= 0) { delete next[day]; } else { next[day] = hrs; }
    const encoded = DAYS.filter(d => (next[d] ?? 0) > 0)
      .map(d => `${d}:${next[d]}`).join(",");
    onChange(encoded);
  }

  const totalHrs = DAYS.reduce((s, d) => s + (parsed[d] ?? 0), 0);
  const activeDays = DAYS.filter(d => (parsed[d] ?? 0) > 0).length;

  return (
    <div className="space-y-2">
      {DAYS.map(day => {
        const hrs = parsed[day] ?? 0;
        const isCustom = hrs > 0 && !CHIPS.includes(hrs);
        return (
          <div key={day} className="flex items-center gap-2">
            <span className={`w-8 text-xs font-bold shrink-0 ${hrs > 0 ? "text-foreground" : "text-muted-foreground/50"}`}>{day}</span>
            <div className="flex gap-1 flex-wrap items-center">
              <button type="button" onClick={() => setDay(day, 0)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  hrs === 0 ? "bg-muted/60 text-muted-foreground border-border" : "bg-transparent text-muted-foreground/50 border-border/40 hover:border-border hover:text-muted-foreground"
                }`}>
                —
              </button>
              {CHIPS.map(h => (
                <button key={h} type="button" onClick={() => setDay(day, h)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    hrs === h ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border/40 hover:border-border hover:text-foreground"
                  }`}>
                  {h}h
                </button>
              ))}
              {isCustom ? (
                <input type="number" min="0.5" max="12" step="0.5"
                  value={hrs}
                  onChange={e => setDay(day, parseFloat(e.target.value) || 0)}
                  className="w-16 text-xs bg-primary/10 border border-primary/40 rounded-full px-2 py-1 text-center text-primary focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <button type="button" onClick={() => setDay(day, 1.5)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border border-border/40 text-muted-foreground/60 hover:border-border hover:text-muted-foreground transition-all">
                  ½h
                </button>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground pt-1">
        {activeDays} day{activeDays !== 1 ? "s" : ""} · {totalHrs}h/week total
        {(parsed["Sat"] ?? 0) > 0 || (parsed["Sun"] ?? 0) > 0 ? " · ⚠ LEAP has full-day events on select weekends" : ""}
      </p>
    </div>
  );
}

// ── Render a single template question with pill inputs ────────────────────────

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: TemplateQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  if (q.type === "multiselect") {
    return (
      <PillSelect
        options={q.options?.filter(o => o !== "other") || []}
        value={value}
        onChange={onChange}
        multi={true}
        allowOther={true}
        maxSelect={q.id === "essence" ? 3 : undefined}
        otherPlaceholder={q.placeholder || "Type your own…"}
      />
    );
  }

  if (q.type === "select") {
    return (
      <PillSelect
        options={q.options?.filter(o => o !== "other") || []}
        value={value}
        onChange={onChange}
        multi={false}
        allowOther={true}
        otherPlaceholder={q.placeholder || "Type your own…"}
      />
    );
  }

  if (q.type === "number") {
    // Build quick picks based on context
    const quickPicks: Record<string, string[]> = {
      flexTarget:    ["1", "2", "3"],
      alcTarget:     ["1", "2", "3"],
      leapTarget:    ["4", "5", "6", "8"],
      hoursPerDay:   ["1", "2", "3", "4"],
      warmNetworkSize: ["20", "50", "100", "150"],
      currentCount:  ["0", "1", "2"],
      budget:        ["5000", "10000", "20000", "50000"],
      targetExtra:   ["5000", "10000", "20000", "30000", "50000"],
      targetIncome:  ["10000", "20000", "30000", "50000"],
      currentIncome: ["15000", "25000", "40000", "60000"],
      targetWeight:  ["50", "55", "60", "65", "70", "75", "80"],
    };
    const picks = quickPicks[q.id] || [];
    if (picks.length > 0) {
      const isPeso = q.id.toLowerCase().includes("target") || q.id.toLowerCase().includes("income") || q.id.toLowerCase().includes("budget");
      return (
        <NumberPills
          quickPicks={picks}
          value={value}
          onChange={onChange}
          unit={isPeso ? "" : ""}
          placeholder={q.placeholder || "Enter number"}
        />
      );
    }
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={q.placeholder || "Enter number"}
        className="w-full text-sm bg-transparent border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    );
  }

  // text type
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={q.placeholder || "Type your answer…"}
      className="w-full text-sm bg-transparent border border-input rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function PEARWizardModal({
  goalType,
  declarationText,
  declarationMeaning,
  initialGoal,
  initialSubCategoryId,
  startAt,
  focusWeek,
  onApply,
  onClose,
}: Props) {
  const [step, setStep] = useState<WizardStep>(startAt ?? "template");
  const [subCategoryId, setSubCategoryId] = useState<string | null>(() => {
    if (initialSubCategoryId) return initialSubCategoryId;
    if (!initialGoal) return null;
    for (const subs of Object.values(SUBCATEGORIES)) {
      const sub = subs.find(s => s.templateId === initialGoal.template.id);
      if (sub) return sub.id;
    }
    return null;
  });
  const [answers, setAnswers] = useState<Record<string, string>>(() => initialGoal?.answers ?? {});
  const [pearStatement, setPearStatement] = useState(() => initialGoal?.pearStatement ?? "");
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());
  const [editingWeek, setEditingWeek] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState<{ week: number; text: string } | null>(null);
  const [addingStepWeek, setAddingStepWeek] = useState<number | null>(null);
  const [newStepText, setNewStepText] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [editingActDays, setEditingActDays] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState(false);
  const [customizing, setCustomizing] = useState(true);
  const [prevStep, setPrevStep] = useState<WizardStep>("template");
  const [whyContext, setWhyContext] = useState<string | null>(null);
  const [riskOtherText, setRiskOtherText] = useState("");
  const [attainPlan, setAttainPlan] = useState<string | null>(null);
  const [attainOtherText, setAttainOtherText] = useState("");
  const [selectedSample, setSelectedSample] = useState<SampleEntry | null>(null);
  const [contextAnswers, setContextAnswers] = useState<string[]>(() =>
    initialGoal?.answers?.coachingContext
      ? initialGoal.answers.coachingContext.split("|").filter(Boolean)
      : []
  );
  const [coachApproved, setCoachApproved] = useState(false);
  const [aiAssessment, setAiAssessment] = useState<DeclarationFitResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const subcats = SUBCATEGORIES[goalType];

  const template = useMemo(() => {
    if (!subCategoryId) return null;
    const sub = subcats.find(s => s.id === subCategoryId);
    return sub ? GOAL_TEMPLATES.find(t => t.id === sub.templateId) ?? null : null;
  }, [subCategoryId, subcats]);

  const samples = template ? (PEAR_SAMPLES[template.id] ?? null) : null;

  // Pre-fill answers when template is selected
  useEffect(() => {
    if (!template) return;
    const defaults: Record<string, string> = {};
    for (const q of template.questions) {
      if (q.defaultValue) defaults[q.id] = q.defaultValue;
    }
    // Merge: defaults only fill fields the user hasn't set yet — never wipe existing values
    setAnswers(prev => ({ ...defaults, ...prev }));
  }, [template]);

  // Rebuild PEAR statement when answers change
  // Also mirror essence → qualities for templates that use `qualities` instead of `essence`
  useEffect(() => {
    if (!template) return;
    const usesQualities = template.questions.some(q => q.id === "qualities");
    const synced = usesQualities && answers.essence
      ? { ...answers, qualities: answers.essence }
      : answers;
    try { setPearStatement(buildPEARStatement(template, synced)); } catch { /* ignore */ }
  }, [template, answers]);

  // Peso caution check
  const pesoCautionWarning = useMemo(() => {
    if (!template?.pesoCaution) return null;
    const { field, min } = template.pesoCaution;
    const val = parseInt(answers[field] || "0");
    if (val > 0 && val < min) {
      return `₱${val.toLocaleString()}/month is a very modest target — is this intentional, or would you like to aim higher?`;
    }
    return null;
  }, [template, answers]);

  // Focus week (deep-link from "Needs Work" button) — jump to preview and expand that week
  useEffect(() => {
    if (focusWeek && step !== "preview") {
      setStep("preview");
      setExpandedWeeks(new Set([focusWeek]));
      // Scroll to the focused week after a tick
      setTimeout(() => {
        const el = document.getElementById(`week-${focusWeek}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [focusWeek, step]);

  function setAnswer(id: string, value: string) {
    setAnswers(p => ({ ...p, [id]: value }));
  }

  function goToPreview() {
    if (!template) return;
    setPrevStep("smarter");
    setPearStatement(buildPEARStatement(template, answers));
    setCustomizing(true);
    setStep("preview");
  }

  function handleApplySample(sample: SampleEntry) {
    setSelectedSample(sample);
    // Preserve existing context answers from loaded goal — don't reset
    setPrevStep("samples");
    setStep("context");
  }

  function handleApply() {
    if (!template) return;
    const completeAnswers = {
      ...answers,
      // Save coaching context answers so they persist
      coachingContext: contextAnswers.join("|"),
    };
    onApply({ template, answers: completeAnswers, pearStatement });
  }

  // ── LEAP 99 schedule anchors ──────────────────────────────────────────────────
  // Seminar days per week — actions on these days get a partial-approval badge
  const SEMINAR_DAYS: Record<number, { days: number[]; event: string }> = {
    2: { days: [5, 6],       event: "FLEX 298 (May 9–10)" },
    3: { days: [5, 6],       event: "FLEX 299 + 1st Workshop (May 16–17)" },
    4: { days: [5, 6],       event: "2nd Intensive (May 23–24)" },
    6: { days: [4, 5, 6],    event: "ALC 256 (Jun 5–7)" },
    7: { days: [4, 5, 6],    event: "ALC 257 + 2nd Workshop (Jun 12–14)" },
    8: { days: [6],          event: "Graduation (Jun 21)" },
  };

  // W1 is shared across all 3 goals: APA complete + goal-specific starter actions
  // No longer locked to a single description — each template's W1 description shows below the shared header
  const LOCKED_WEEKS: Record<number, string> = {};
  // Enrollment anchors: detailed LEAP schedule per week shown under milestone description
  const ENROLL_ANCHORS: Record<number, string> = {
    2: "FLEX 298 · Sat May 9 Abenson HQ Muñoz · 9am–6pm · Embrazo Sun May 10 ~5pm — be there for your enrollee",
    3: "FLEX 299 · Sat May 16 SMX Aura · 9am–6pm · Workshop 1–3pm · Embrazo + 1st LEAP Workshop Sun May 17 ~5pm — be there for your enrollee",
    4: "2nd Intensive · Sat–Sun May 23–24 · UP BGC · 9am–6pm both days · Workshop 1–3pm each day",
    6: "ALC 256 · Fri Jun 5 · Sat Jun 6 SMX Aura · 9am–6pm · Embrazo Sun Jun 7 ~5pm — be there for your enrollee",
    7: "ALC 257 · Fri Jun 12 · Sat Jun 13 SMX Aura · 9am–6pm · Workshop 1–3pm · Embrazo + 2nd LEAP Workshop Sun Jun 14 ~5pm — be there for your enrollee",
    8: "Graduation · Sun Jun 21 · arrive early · your moment to celebrate",
  };
  // LEAP schedule notes for personal & professional goals (brief — big picture context)
  const LEAP_NOTES: Record<number, string> = {
    2: "FLEX 298 · Sat–Sun May 9–10 · Abenson HQ Muñoz · 9am–6pm",
    3: "FLEX 299 + 1st Workshop · Sat–Sun May 16–17 · SMX Aura · 9am–6pm",
    4: "2nd Intensive · Sat–Sun May 23–24 · UP BGC · 9am–6pm",
    6: "ALC 256 · Fri–Sun Jun 5–7 · SMX Aura · 9am–6pm",
    7: "ALC 257 + 2nd Workshop · Fri–Sun Jun 12–14 · SMX Aura · 9am–6pm",
    8: "Graduation · Sun Jun 21",
  };

  // ── Shared milestone renderer (used in both template + preview steps) ─────────
  function renderMilestoneWeeks(milestoneTemplate: import("@/lib/data/goal-templates").GoalTemplate) {
    const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    let weeks: ReturnType<typeof milestoneTemplate.milestones> = [];
    const usesQ = milestoneTemplate.questions.some(q => q.id === "qualities");
    const resolvedAnswers = usesQ && answers.essence ? { ...answers, qualities: answers.essence } : answers;
    try { weeks = milestoneTemplate.milestones(resolvedAnswers); } catch { return null; }
    // M-Check: milestone distribution across all weeks
    const mCheck = checkMilestoneGoalAlignment(weeks.map(w => ({ weekNumber: w.weekNumber, cumulativePercentage: w.cumulativePercentage })));
    const mColor = mCheck.score >= 90 ? "text-emerald-400" : mCheck.score >= 70 ? "text-amber-400" : "text-rose-400";
    const mBarColor = mCheck.score >= 90 ? "bg-emerald-500" : mCheck.score >= 70 ? "bg-amber-400" : "bg-rose-500";

    return (
      <div className="space-y-1.5">
        {/* M-Check: Milestones ↔ Goal coverage */}
        <div className="rounded-lg border border-border bg-muted/10 px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">M-Check · Milestones ↔ Goal</p>
            <span className={`text-[10px] font-bold ${mColor}`}>{mCheck.score}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${mBarColor}`} style={{ width: `${mCheck.score}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">{mCheck.detail}</p>
        </div>

        {weeks.map((wk, wi) => {
          const prevPct = wi === 0 ? 0 : weeks[wi - 1].cumulativePercentage;
          const isExpanded = expandedWeeks.has(wk.weekNumber);
          const noteKey = `ms_${wk.weekNumber}_note`;
          const isAddingNote = editingWeek === wk.weekNumber;
          const savedNote = answers[noteKey] ?? "";
          const schedDays = new Set(wk.actions.flatMap(a => a.days ?? [])).size;
          // Action-Check: use active actions only (respects user unchecking steps)
          const activeCount = wk.actions.filter((_, i) => answers[`ms_${wk.weekNumber}_act_${i}_done`] !== "false").length;
          let customActiveCount = 0;
          try { const cs = JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]") as {text:string;days:number[]}[]; customActiveCount = cs.filter((_, ci) => answers[`ms_${wk.weekNumber}_custom_${ci}_done`] !== "false").length; } catch { /* ok */ }
          const coverage = checkActionMilestoneCoverage(wk.actions.length, activeCount + customActiveCount, schedDays);
          const feasibility = coverage.feasibility;
          const feasStyle = !coverage.milestoneSafe ? "text-rose-400" : feasibility === "solid" ? "text-emerald-400" : feasibility === "heavy" ? "text-rose-400" : "text-amber-400";
          const feasLabel = (coverage.removedActions > 0 && !coverage.milestoneSafe) ? `⚠ −${coverage.removedActions}` : feasibility === "solid" ? "✓" : feasibility === "heavy" ? "!" : "⚠";
          return (
            <div key={wk.weekNumber} id={`week-${wk.weekNumber}`} className="rounded-lg border border-border bg-background overflow-hidden">
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-foreground">Week {wk.weekNumber}</span>
                  <span className="text-xs text-muted-foreground/60">{getWeekDates(wk.weekNumber)}</span>
                  <span title={`Action coverage: ${coverage.activeActions}/${coverage.totalActions} active · ${feasibility} · ${schedDays} days`} className={`text-xs font-bold ${feasStyle}`}>{feasLabel}</span>
                  <span className="ml-auto text-xs font-semibold text-primary shrink-0">{prevPct}%–{wk.cumulativePercentage}%</span>
                </div>

                {/* Milestone description */}
                {(() => {
                  const lockedDesc = LOCKED_WEEKS[wk.weekNumber];
                  const { goal, event } = splitMilestoneDesc(lockedDesc ?? wk.description);
                  const enrollAnchor = goalType === "enrollment" ? ENROLL_ANCHORS[wk.weekNumber] : null;
                  const leapNote = goalType !== "enrollment" ? LEAP_NOTES[wk.weekNumber] : null;
                  return (
                    <div className="space-y-0.5">
                      {/* W1 shared LEAP program header — same for all 3 goals */}
                      {wk.weekNumber === 1 && (
                        <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wide mb-1">
                          🔒 Clarity of Personal Declaration &amp; Goals — APA complete by end of week
                        </p>
                      )}
                      <p className="text-xs text-foreground/90 font-medium leading-snug">
                        {goal}
                        {lockedDesc && <span className="ml-1.5 text-[9px] text-muted-foreground/40 font-normal">🔒</span>}
                      </p>
                      {event && <p className="text-[10px] text-muted-foreground/50">📅 {event}</p>}
                      {enrollAnchor && !event && <p className="text-[10px] text-muted-foreground/50">📅 {enrollAnchor}</p>}
                      {leapNote && !event && <p className="text-[10px] text-muted-foreground/50">📅 {leapNote}</p>}
                    </div>
                  );
                })()}

                {/* Student context note — optional add-on, never replaces template */}
                {isAddingNote ? (
                  <div className="mt-1.5 space-y-1">
                    <textarea autoFocus
                      value={editDesc?.week === wk.weekNumber ? editDesc.text : savedNote}
                      onChange={e => setEditDesc({ week: wk.weekNumber, text: e.target.value })}
                      rows={2}
                      placeholder="Add context for your situation this week… (optional)"
                      className="w-full text-xs bg-background border border-primary/50 rounded-lg px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                    <div className="flex gap-1.5">
                      <button type="button"
                        onClick={() => { if (editDesc?.week === wk.weekNumber) setAnswer(noteKey, editDesc.text.trim()); setEditingWeek(null); setEditDesc(null); }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">Save note</button>
                      <button type="button"
                        onClick={() => { setEditingWeek(null); setEditDesc(null); }}
                        className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                      {savedNote && (
                        <button type="button"
                          onClick={() => { setAnswer(noteKey, ""); setEditingWeek(null); setEditDesc(null); }}
                          className="text-xs px-2 py-1 rounded-lg text-rose-400 hover:text-rose-300 transition-colors">Remove note</button>
                      )}
                    </div>
                  </div>
                ) : savedNote ? (
                  <div className="mt-1 flex items-start gap-1.5 group cursor-pointer" onClick={() => { setEditingWeek(wk.weekNumber); setEditDesc({ week: wk.weekNumber, text: savedNote }); }}>
                    <span className="text-[9px] text-primary/60 mt-0.5 shrink-0">📝</span>
                    <p className="text-[10px] text-primary/70 italic leading-snug flex-1">{savedNote}</p>
                    <Pencil className="h-2.5 w-2.5 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 mt-0.5 transition-colors" />
                  </div>
                ) : (
                  <button type="button"
                    onClick={() => { setEditingWeek(wk.weekNumber); setEditDesc({ week: wk.weekNumber, text: "" }); }}
                    className="mt-1 text-[10px] text-muted-foreground/50 hover:text-primary/70 transition-colors">
                    + Add context note
                  </button>
                )}
                {!isAddingNote && (
                  <button type="button"
                    onClick={() => setExpandedWeeks(prev => { const next = new Set(prev); if (next.has(wk.weekNumber)) next.delete(wk.weekNumber); else next.add(wk.weekNumber); return next; })}
                    className="mt-2 flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors">
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? "Hide" : "Show"} action steps ({wk.actions.length}{(() => { try { return JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]").length > 0 ? ` +${JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]").length} custom` : ""; } catch { return ""; } })()})
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="border-t border-border/50 px-3 py-2.5 space-y-2 bg-muted/20">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pb-1">Uncheck steps you can't do given your time &amp; resources</p>
                  {wk.weekNumber === 1 && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                      <div className="flex items-start gap-2">
                        <div className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                        <p className="text-xs text-emerald-400 font-medium leading-snug">Finalize your goal statement, values, and 8-week action plan in this wizard — done before Week 1 begins</p>
                      </div>
                    </div>
                  )}
                  {wk.actions.map((act, i) => {
                    const doneKey = `ms_${wk.weekNumber}_act_${i}_done`;
                    const inPlan = answers[doneKey] !== "false";
                    // Seminar-day partial approval: does this action land on an event day?
                    const seminar = SEMINAR_DAYS[wk.weekNumber];
                    const actDaysResolved: number[] = answers[`ms_${wk.weekNumber}_act_${i}_days`]
                      ? answers[`ms_${wk.weekNumber}_act_${i}_days`].split(",").map(Number).filter((n: number) => !isNaN(n))
                      : (act.days ?? []);
                    const isSeminarDay = seminar && actDaysResolved.some(d => seminar.days.includes(d));
                    // Is this action itself about the seminar (e.g., "attend FLEX 298")?
                    const isSeminarAction = seminar && actDaysResolved.every(d => seminar.days.includes(d)) && actDaysResolved.length <= seminar.days.length;
                    return (
                      <div key={i} className={`rounded-lg border p-2.5 transition-colors ${inPlan ? (isSeminarDay && !isSeminarAction ? "border-amber-400/40 bg-amber-400/5" : "border-primary/30 bg-primary/5") : "border-border/40 bg-background opacity-50"}`}>
                        <div className="flex items-start gap-2">
                          <button type="button" title={inPlan ? "Remove from plan" : "Add back to plan"}
                            onClick={() => setAnswer(doneKey, inPlan ? "false" : "true")}
                            className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${inPlan ? "bg-primary border-primary" : "border-border hover:border-primary"}`}>
                            {inPlan && <Check className="h-2.5 w-2.5 text-white" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug ${inPlan ? "text-foreground font-medium" : "text-muted-foreground line-through"}`}>{act.text}</p>
                            {inPlan && isSeminarDay && !isSeminarAction && (
                              <p className="text-[10px] text-amber-400/80 mt-0.5">⚡ During {seminar.event} — do if compatible (connecting, being kind, conversations = go for it)</p>
                            )}
                          </div>
                          {act.days && act.days.length > 0 && (() => {
                            const daysKey = `ms_${wk.weekNumber}_act_${i}_days`;
                            const override = answers[daysKey];
                            const currentDays: number[] = override
                              ? override.split(",").map(Number).filter(n => !isNaN(n))
                              : act.days!;
                            const isOpen = editingActDays === daysKey;
                            return (
                              <div className="shrink-0 flex flex-col items-end gap-1">
                                {isOpen ? (
                                  <>
                                    <div className="flex flex-wrap gap-1 justify-end">
                                      {DAY_LABELS.map((label, di) => (
                                        <button key={di} type="button"
                                          onClick={() => {
                                            const next = currentDays.includes(di)
                                              ? currentDays.filter(d => d !== di)
                                              : [...currentDays, di].sort((a, b) => a - b);
                                            setAnswer(daysKey, next.join(","));
                                          }}
                                          className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold transition-all ${
                                            currentDays.includes(di)
                                              ? "bg-primary text-primary-foreground border-primary"
                                              : "bg-muted text-muted-foreground border-border hover:border-primary/50"
                                          }`}>
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                    <button type="button" onClick={() => setEditingActDays(null)}
                                      className="text-[9px] text-primary font-semibold hover:underline">
                                      Done
                                    </button>
                                  </>
                                ) : (
                                  <button type="button" onClick={() => setEditingActDays(daysKey)}
                                    className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors underline-offset-2 hover:underline">
                                    {currentDays.map(d => DAY_LABELS[d]).join("·")}
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                  {/* Custom steps */}
                  {(() => {
                    let customSteps: { text: string; days: number[] }[] = [];
                    try { customSteps = JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]"); } catch { /* ok */ }
                    return customSteps.map((cs, ci) => {
                      const doneKey = `ms_${wk.weekNumber}_custom_${ci}_done`;
                      const inPlan = answers[doneKey] !== "false";
                      return (
                        <div key={`c${ci}`} className={`rounded-lg border p-2.5 transition-colors ${inPlan ? "border-primary/30 bg-primary/5" : "border-border/40 bg-background opacity-50"}`}>
                          <div className="flex items-start gap-2">
                            <button type="button" onClick={() => setAnswer(doneKey, inPlan ? "false" : "true")}
                              className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${inPlan ? "bg-primary border-primary" : "border-border hover:border-primary"}`}>
                              {inPlan && <Check className="h-2.5 w-2.5 text-white" />}
                            </button>
                            <p className={`text-xs leading-snug flex-1 ${inPlan ? "text-foreground font-medium" : "text-muted-foreground line-through"}`}>{cs.text}</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  {/* Add your own step */}
                  {addingStepWeek === wk.weekNumber ? (
                    <div className="flex gap-1.5 pt-1">
                      <input type="text" autoFocus value={newStepText}
                        onChange={e => setNewStepText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { if (!newStepText.trim()) return; let cs: { text: string; days: number[] }[] = []; try { cs = JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]"); } catch { /* ok */ } setAnswer(`ms_${wk.weekNumber}_custom`, JSON.stringify([...cs, { text: newStepText.trim(), days: [] }])); setNewStepText(""); setAddingStepWeek(null); } if (e.key === "Escape") { setNewStepText(""); setAddingStepWeek(null); } }}
                        placeholder="Describe your action step…"
                        className="flex-1 text-xs bg-background border border-primary rounded-lg px-2 py-1.5 focus:outline-none" />
                      <button type="button" onClick={() => { if (!newStepText.trim()) return; let cs: { text: string; days: number[] }[] = []; try { cs = JSON.parse(answers[`ms_${wk.weekNumber}_custom`] || "[]"); } catch { /* ok */ } setAnswer(`ms_${wk.weekNumber}_custom`, JSON.stringify([...cs, { text: newStepText.trim(), days: [] }])); setNewStepText(""); setAddingStepWeek(null); }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold">Add</button>
                      <button type="button" onClick={() => { setNewStepText(""); setAddingStepWeek(null); }}
                        className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setAddingStepWeek(wk.weekNumber)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 pt-1 transition-colors">
                      + Add your own step
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Overlay wrapper ───────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl bg-card rounded-t-2xl sm:rounded-2xl border border-border flex flex-col max-h-[95vh] sm:max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {step !== "template" && (
              <button
                type="button"
                onClick={() => {
                  if (step === "signoff") { setStep("preview"); return; }
                  if (step === "preview" && reviewing) { setReviewing(false); return; }
                  if (step === "samples") { if (startAt === "samples") onClose(); else setStep("template"); }
                  else if (step === "context") setStep("samples");
                  else if (step === "smarter") setStep("samples");
                  else if (step === "preview") setStep(prevStep);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
            )}
            <div>
              <p className="text-sm font-bold text-foreground capitalize">{goalType} Goal</p>
              <p className="text-xs text-muted-foreground">
                {step === "template" ? "Choose your focus" :
                 step === "samples"   ? "Examples to inspire you" :
                 step === "context"   ? "A coaching question" :
                 step === "smarter"   ? "Quick setup" :
                 step === "signoff"   ? "Step 4 — Coach Sign-Off" :
                 "Your goal statement"}
              </p>
            </div>
          </div>
          <button type="button" title="Close" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress dots */}
        {step === "preview" && (
          <div className="flex items-center justify-center gap-1.5 py-2 shrink-0">
            <div className={`h-1.5 rounded-full transition-all ${!reviewing ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
            <div className={`h-1.5 rounded-full transition-all ${reviewing ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step: template selection ── */}
          {step === "template" && (
            <div className="p-5 space-y-3">

              {/* Current goal statement + editable milestones */}
              {initialGoal && template && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Current Goal Statement</p>
                      <p className="text-sm italic text-foreground leading-relaxed">&ldquo;{initialGoal.pearStatement}&rdquo;</p>
                      {(() => {
                        // Try answers.essence first; fall back to parsing "as a X, Y, and Z person" from statement
                        let essArr = (initialGoal.answers.essence || "").split(",").map(s => s.trim()).filter(Boolean);
                        if (essArr.length === 0) {
                          const m = initialGoal.pearStatement.match(/as an? ([^,]+),\s*([^,]+),\s*and\s+([^ ]+)\s+person/i);
                          if (m) essArr = [m[1].trim(), m[2].trim(), m[3].trim()];
                        }
                        return essArr.length > 0 ? (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Values</span>
                            {essArr.map(q => (
                              <span key={q} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary capitalize">{q}</span>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <button type="button" onClick={() => { setPrevStep("template"); setStep("preview"); }}
                      className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors whitespace-nowrap">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">All templates are available below.</p>
              {subcats.map(sub => {
                const isCurrent = initialGoal?.template.id === sub.templateId;
                return (
                  <div
                    key={sub.id}
                    className={`rounded-xl border p-3.5 transition-all ${isCurrent ? "border-primary/60 bg-primary/5" : "border-border bg-background"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{sub.label}</p>
                          {isCurrent && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                              ✓ Current
                            </span>
                          )}
                          {sub.safetyNote && (
                            <span className="text-xs text-amber-400">{sub.safetyNote}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sub.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCurrent) { setAnswers({}); setPearStatement(""); setCustomizing(false); }
                          setSubCategoryId(sub.id);
                          setPrevStep("template");
                          setStep("samples");
                        }}
                        className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Choose this →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step: samples ── */}
          {step === "samples" && template && samples && (
            <div className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Pick a starting point — you'll customize it to make it yours.
                <br />
                <strong className="text-foreground">Or start from scratch</strong> if you already know what you want.
              </p>
              {samples.map((sample, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sample.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sample.description}</p>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed italic border-l-2 border-primary/30 pl-3">&ldquo;{sample.statement}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => handleApplySample(sample)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Edit3 className="h-3 w-3" /> Start with this →
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => { setPrevStep("samples"); setStep("smarter"); }}
                className="w-full py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                Build my own goal →
              </button>
            </div>
          )}

          {/* ── Step: context (coaching moment) ── */}
          {step === "context" && selectedSample && (
            <div className="p-5 space-y-6">
              {/* The confrontational coaching question */}
              <div className="space-y-2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Before you continue</p>
                <p className="text-base font-semibold text-foreground leading-relaxed">{selectedSample.contextQ.question}</p>
              </div>
              {/* Option cards — full-width, first-person, honest — multi-select */}
              <div className="space-y-2">
                {/* First option: the selected sample itself */}
                {(() => {
                  const sampleLabel = `Use: "${selectedSample.label}"`;
                  const active = contextAnswers.includes(sampleLabel);
                  return (
                    <button
                      key={sampleLabel}
                      type="button"
                      onClick={() => setContextAnswers(prev =>
                        prev.includes(sampleLabel) ? prev.filter(o => o !== sampleLabel) : [...prev, sampleLabel]
                      )}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium leading-snug transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-2.5`}>
                        <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${active ? "bg-primary border-primary" : "border-border"}`}>
                          {active && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        {sampleLabel}
                      </span>
                    </button>
                  );
                })()}
                {/* Other coaching context options */}
                {selectedSample.contextQ.options.map((opt) => {
                  const active = contextAnswers.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setContextAnswers(prev =>
                        prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
                      )}
                      className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium leading-snug transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span className={`inline-flex items-center gap-2.5`}>
                        <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${active ? "bg-primary border-primary" : "border-border"}`}>
                          {active && <Check className="h-2.5 w-2.5 text-white" />}
                        </span>
                        {opt}
                      </span>
                    </button>
                  );
                })}
                {contextAnswers.includes("Other") && (
                  <input
                    type="text"
                    placeholder="Describe your own situation…"
                    value={contextAnswers.find(a => {
                      const sampleLabel = `Use: "${selectedSample.label}"`;
                      return a !== "Other" && !selectedSample.contextQ.options.includes(a) && a !== sampleLabel;
                    }) || ""}
                    onChange={(e) => {
                      const customText = e.target.value;
                      const sampleLabel = `Use: "${selectedSample.label}"`;
                      setContextAnswers(prev => {
                        const filtered = prev.filter(a => a === "Other" || selectedSample.contextQ.options.includes(a) || a === sampleLabel);
                        return customText ? [...filtered, customText] : filtered;
                      });
                    }}
                    className="w-full text-sm bg-primary/5 border border-primary/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                )}
              </div>
              {/* Peg previews for all selected answers that have a mapping */}
              {contextAnswers.length > 0 && (() => {
                const sampleLabel = `Use: "${selectedSample.label}"`;
                const selectedPegs = contextAnswers.filter(a => {
                  // Check if it's the sample itself
                  if (a === sampleLabel) return true;
                  // Check if it's in the contextQ pegMap
                  return a !== "Other" && selectedSample.contextQ.pegMap[a];
                });
                return selectedPegs.length > 0 ? (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Your biggest why</p>
                    {selectedPegs.map(a => {
                      const sampleLbl = `Use: "${selectedSample.label}"`;
                      if (a === sampleLbl) {
                        // Extract peg from the sample statement (the part between "To " and ", as a")
                        const pegMatch = selectedSample.statement.match(/^To\s+(.+?),\s+as\s+a/i);
                        const peg = pegMatch ? pegMatch[1] : selectedSample.statement;
                        return (
                          <p key={a} className="text-sm italic text-foreground leading-relaxed">
                            &ldquo;To {peg}…&rdquo;
                          </p>
                        );
                      }
                      return (
                        <p key={a} className="text-sm italic text-foreground leading-relaxed">
                          &ldquo;To {selectedSample.contextQ.pegMap[a]}…&rdquo;
                        </p>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground">The first one will anchor your statement. You can always refine it in Customize.</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* ── Step: smarter Q&A ── */}
          {step === "smarter" && template && (
            <div className="p-5 space-y-6">
              <SmartFormFields
                template={template}
                answers={answers}
                pesoCautionWarning={pesoCautionWarning}
                onAnswer={setAnswer}
                initialGoal={initialGoal}
              />
            </div>
          )}


          {/* ── Step: preview ── */}
          {step === "preview" && template && (
            <div className="p-5 space-y-4">

              {/* Goal statement card — read-only; customization via answers below */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Your Goal Statement</p>
                  <span className="text-[10px] text-muted-foreground italic">auto-generated · edit answers below to change</span>
                </div>
                <p className="text-sm leading-relaxed italic text-foreground px-1 select-text">
                  {pearStatement || "Complete the questions above to generate your goal statement…"}
                </p>
                {!customizing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Values</span>
                      {(answers.essence || "loving,committed,courageous").split(",").filter(Boolean).map(q => (
                        <span key={q} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary capitalize">{q.trim()}</span>
                      ))}
                      <button type="button" onClick={() => setEditingValues(v => !v)}
                        className="inline-flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 transition-colors ml-1">
                        <Pencil className="h-2.5 w-2.5" /> {editingValues ? "Done" : "Edit values"}
                      </button>
                    </div>
                    {editingValues && (
                      <div className="pt-2 border-t border-primary/20">
                        <EssencePicker
                          value={answers.essence || "loving,committed,courageous"}
                          onChange={v => { setAnswer("essence", v); setReviewing(false); }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* A-Check: Declaration ↔ Goal alignment + AI Deep Analysis */}
              {declarationText && pearStatement && (() => {
                const score = getDeclarationAlignmentScore(declarationText, pearStatement);
                const color = score >= 90 ? "text-emerald-400" : score >= 80 ? "text-amber-400" : "text-rose-400";
                const barColor = score >= 90 ? "bg-emerald-500" : score >= 80 ? "bg-amber-400" : "bg-rose-500";
                const label = score >= 90 ? "Favorable" : score >= 80 ? "OK" : "Needs Work";
                return (
                  <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">A-Check · Declaration ↔ Goal</p>
                      <span className={`text-[10px] font-bold ${color}`}>{label} · {score}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${score}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {score >= 90
                        ? "Favorable — your goal strongly honors your declaration."
                        : score >= 80
                        ? "OK — the connection is present. Run AI Deep Analysis to see if a refinement would make it explicit."
                        : "Needs Work — your goal doesn't yet clearly reflect your declaration. Revise the goal or run AI Deep Analysis for a specific rewrite."}
                    </p>

                    {/* AI Deep Analysis */}
                    {!aiAssessment && !aiLoading && (
                      <button type="button"
                        onClick={async () => {
                          setAiLoading(true); setAiError(null);
                          try {
                            const result = await assessGoalDeclarationFit(pearStatement, declarationText, answers.essence || null, goalType, declarationMeaning || null);
                            setAiAssessment(result);
                          } catch { setAiError("AI analysis failed — check API keys or try again."); }
                          finally { setAiLoading(false); }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/40 text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors">
                        ✦ Run AI Deep Analysis (free · Groq)
                      </button>
                    )}
                    {aiLoading && (
                      <div className="flex items-center justify-center gap-2 py-1">
                        <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        <p className="text-[10px] text-muted-foreground">Analyzing with Groq AI…</p>
                      </div>
                    )}
                    {aiError && <p className="text-[10px] text-rose-400">{aiError}</p>}
                    {aiAssessment && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-bold text-primary uppercase tracking-wide">AI Deep Analysis</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold ${aiAssessment.overallScore >= 75 ? "text-emerald-400" : aiAssessment.overallScore >= 50 ? "text-amber-400" : "text-rose-400"}`}>
                              Overall {aiAssessment.overallScore}%
                            </span>
                            <button type="button" onClick={() => setAiAssessment(null)} className="text-[9px] text-muted-foreground hover:text-foreground leading-none">✕</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { label: "Ambition", score: aiAssessment.ambitionScore },
                            { label: "Thematic", score: aiAssessment.thematicScore },
                            { label: "Specificity", score: aiAssessment.specificityScore },
                          ].map(d => (
                            <div key={d.label} className="space-y-0.5">
                              <p className="text-[9px] text-muted-foreground">{d.label}</p>
                              <p className={`text-sm font-bold ${d.score >= 75 ? "text-emerald-400" : d.score >= 50 ? "text-amber-400" : "text-rose-400"}`}>{d.score}%</p>
                            </div>
                          ))}
                        </div>
                        {aiAssessment.analysis && (
                          <p className="text-[10px] text-muted-foreground leading-relaxed border-t border-border/40 pt-1.5">{aiAssessment.analysis}</p>
                        )}
                        {aiAssessment.suggestedTweak && (
                          <div className="rounded-lg border border-primary/20 bg-background px-2.5 py-2">
                            <p className="text-[9px] font-semibold text-primary uppercase tracking-wide mb-0.5">Suggested refinement</p>
                            <p className="text-[10px] text-foreground/80 italic leading-snug">&ldquo;{aiAssessment.suggestedTweak}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Customize my statement */}
              <div className="rounded-xl border border-border bg-background">
                <button
                  type="button"
                  onClick={() => { setCustomizing(v => !v); setReviewing(false); setEditingValues(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5 text-rose-400" />
                    Customize my statement
                  </span>
                  {customizing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
                {customizing && (
                  <div className="px-4 pb-4 space-y-5 border-t border-border">
                    <div className="pt-4">
                      <SmartFormFields
                        template={template}
                        answers={answers}
                        pesoCautionWarning={pesoCautionWarning}
                        onAnswer={(id, v) => { setAnswer(id, v); setReviewing(false); }}
                        initialGoal={initialGoal}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SMARTER review — shown after Apply is clicked */}
              {reviewing && (() => {
                const sc = checkSMARTER(pearStatement);
                const ambition   = checkTargetAmbition(pearStatement);
                const freqRisk   = checkFrequencyRisk(pearStatement);
                const complexity = checkMetricComplexity(pearStatement);
                // Attainability risks — only the hard schedule conflict (back-to-back required)
                const attainRisks = (template?.answerRisks?.(answers) ?? []).filter(r =>
                  r.field === "sessionsPerWeek" && r.message.includes("back-to-back")
                );
                const aPass = sc.A && (attainRisks.length === 0 || !!attainPlan);
                const checks = [
                  { letter: "S·M", label: "Has a specific target",      pass: sc.S && sc.M, fix: "Add what exactly you'll achieve — a number, amount, or count" },
                  { letter: "A",   label: "Attainable in 8 weeks",       pass: aPass,        fix: !sc.A ? "Add how often or how frequently you'll do this" : "Acknowledge the schedule conflict below ↓" },
                  { letter: "T",   label: "Target date: June 19, 2026",  pass: sc.T,         fix: null },
                  { letter: "E",   label: "Shows who you're becoming",   pass: sc.E,         fix: "Add your values: \"as a [quality], [quality], and [quality] person\"" },
                  { letter: "R²",  label: "States what you'll prove",    pass: sc.R2,        fix: "Add what you'll present or show at graduation" },
                ];
                const allPass = checks.every(c => c.pass);
                return (
                  <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SMARTER Goal Check</p>
                      {allPass
                        ? <span className="text-xs text-emerald-400 font-semibold">✓ All clear</span>
                        : <span className="text-xs text-amber-400">{checks.filter(c => c.pass).length}/{checks.length} checks passed</span>}
                    </div>
                    <div className="space-y-2">
                      {checks.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className={`shrink-0 mt-0.5 text-sm ${c.pass ? "text-emerald-400" : "text-amber-400"}`}>{c.pass ? "✓" : "!"}</span>
                          <span className={`shrink-0 text-[10px] font-bold w-6 mt-0.5 ${c.pass ? "text-primary/60" : "text-amber-400/70"}`}>{c.letter}</span>
                          <div>
                            <p className={`text-xs font-medium ${c.pass ? "text-foreground" : "text-amber-300"}`}>{c.label}</p>
                            {!c.pass && c.fix && <p className="text-[10px] text-muted-foreground mt-0.5">{c.fix}</p>}
                            {!c.pass && !c.fix && (
                              <button type="button" onClick={() => {
                                if (!/june|jun/i.test(pearStatement)) {
                                  const updated = pearStatement.replace(/\.\s*$/, "") + " by June 19, 2026.";
                                  setPearStatement(updated);
                                }
                              }} className="text-[10px] text-primary hover:underline mt-0.5">
                                Auto-add "by June 19, 2026" →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* A — Attainability question: fires when schedule conflict detected */}
                      {attainRisks.length > 0 && (
                        <div className="flex items-start gap-2 pt-1 border-t border-border/40 mt-1">
                          <span className={`shrink-0 mt-0.5 text-sm ${attainPlan ? "text-emerald-400" : "text-amber-400"}`}>{attainPlan ? "✓" : "?"}</span>
                          <span className="shrink-0 text-[10px] font-bold w-6 mt-0.5 text-amber-400/70">A</span>
                          <div className="space-y-1.5 flex-1">
                            <p className="text-xs font-medium text-amber-300">Attainable — LEAP weekends will block your gym days</p>
                            <p className="text-[10px] text-muted-foreground">
                              4 LEAP weekends (Wks 3, 4, 6, 7) block Fri–Sun. At {parseInt(answers.sessionsPerWeek || "4")}x/week you&apos;ll need back-to-back weekday sessions those weeks. How will you protect your schedule?
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {[
                                { key: "monthu",  label: "Shift to Mon–Thu those weeks" },
                                { key: "early",   label: "Early morning on weekdays" },
                                { key: "fewer",   label: "Accept fewer sessions those weeks" },
                                { key: "blocked", label: "Already blocked in my calendar" },
                                { key: "other",   label: "Other" },
                              ].map(opt => (
                                <button key={opt.key} type="button"
                                  onClick={() => { setAttainPlan(opt.key); setAttainOtherText(""); }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${attainPlan === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            {attainPlan === "monthu"  && <p className="text-[10px] text-primary/80">Mon–Thu gives you 4 clean days before the weekend events. Solid.</p>}
                            {attainPlan === "early"   && <p className="text-[10px] text-primary/80">Early sessions = done before LEAP takes over. That&apos;s discipline.</p>}
                            {attainPlan === "fewer"   && <p className="text-[10px] text-primary/80">Honest. Build it in now — don&apos;t let those weeks feel like failure.</p>}
                            {attainPlan === "blocked" && <p className="text-[10px] text-emerald-400/80">Already prepared. That&apos;s commitment before it&apos;s needed.</p>}
                            {attainPlan === "other" && (
                              <input type="text" autoFocus value={attainOtherText} onChange={e => setAttainOtherText(e.target.value)}
                                placeholder="How will you protect your sessions?"
                                className="w-full text-xs bg-transparent border border-input rounded-xl px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                            )}
                            {attainPlan === "other" && attainOtherText && <p className="text-[10px] text-primary/80">Noted. That plan keeps you accountable.</p>}
                          </div>
                        </div>
                      )}

                      {/* R — Risk: always a soft challenge, never a hard block */}
                      <div className="flex items-start gap-2 pt-1 border-t border-border/40 mt-1">
                        <span className="shrink-0 mt-0.5 text-sm text-amber-400">?</span>
                        <span className="shrink-0 text-[10px] font-bold w-6 mt-0.5 text-amber-400/70">R</span>
                        <div className="space-y-1.5 flex-1">
                          {ambition?.flag === "too_easy" && (
                            <>
                              <p className="text-xs font-medium text-amber-300">
                                Risk — target looks very conservative ({ambition.from} → {ambition.to}{ambition.unit})
                              </p>
                              <p className="text-[10px] text-muted-foreground">A change of {Math.abs(ambition.to - ambition.from).toFixed(1)}{ambition.unit} over 8 weeks — is this really pushing you?</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {[
                                  { key: "constraint", label: "There's a real constraint here" },
                                  { key: "momentum",   label: "Building momentum first" },
                                  { key: "higher",     label: "You're right — I can aim higher" },
                                  { key: "other",      label: "Other" },
                                ].map(opt => (
                                  <button key={opt.key} type="button"
                                    onClick={() => { setWhyContext(opt.key); setRiskOtherText(""); }}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${whyContext === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              {whyContext === "higher"     && <p className="text-[10px] text-primary/80">Open Customize above to adjust your target.</p>}
                              {whyContext === "constraint" && <p className="text-[10px] text-primary/80">Noted. Your goal reflects your real situation — that's honest and valid.</p>}
                              {whyContext === "momentum"   && <p className="text-[10px] text-primary/80">Smart. Starting conservative builds the habit first.</p>}
                              {whyContext === "other" && (
                                <input type="text" autoFocus value={riskOtherText} onChange={e => setRiskOtherText(e.target.value)}
                                  placeholder="Describe your situation…"
                                  className="w-full text-xs bg-transparent border border-input rounded-xl px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                              )}
                              {whyContext === "other" && riskOtherText && <p className="text-[10px] text-primary/80">Noted. Keep that context in mind as you finalize your goal.</p>}
                            </>
                          )}
                          {ambition?.flag === "too_risky" && (
                            <>
                              <p className="text-xs font-medium text-red-400">
                                Risk — target is aggressive ({ambition.from} → {ambition.to}{ambition.unit})
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {ambition.unit !== "₱"
                                  ? `~${ambition.weeklyRate.toFixed(1)}${ambition.unit}/week over 8 weeks. Have you consulted a professional?`
                                  : `${ambition.pctChange.toFixed(0)}% increase in 8 weeks. Is this grounded in a real plan?`}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {[
                                  { key: "cleared",  label: "Yes — doctor/advisor cleared" },
                                  { key: "will",     label: "I'll consult before starting" },
                                  { key: "adjust",   label: "I should adjust my target" },
                                  { key: "other",    label: "Other" },
                                ].map(opt => (
                                  <button key={opt.key} type="button"
                                    onClick={() => { setWhyContext(opt.key); setRiskOtherText(""); }}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${whyContext === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              {whyContext === "cleared" && <p className="text-[10px] text-emerald-400/80">Good. Keep that clearance on file as you track your milestones.</p>}
                              {whyContext === "will"    && <p className="text-[10px] text-primary/80">Consult first — then come back to finalize your target.</p>}
                              {whyContext === "adjust"  && <p className="text-[10px] text-primary/80">Open Customize above to set a safer, still-challenging target.</p>}
                              {whyContext === "other" && (
                                <input type="text" autoFocus value={riskOtherText} onChange={e => setRiskOtherText(e.target.value)}
                                  placeholder="Describe your situation…"
                                  className="w-full text-xs bg-transparent border border-input rounded-xl px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                              )}
                              {whyContext === "other" && riskOtherText && <p className="text-[10px] text-primary/80">Noted. Keep that context in mind as you finalize your goal.</p>}
                            </>
                          )}
                          {!ambition && !freqRisk && !complexity && (
                            <>
                              <p className="text-xs font-medium text-foreground">Risk — what's at stake?</p>
                              <p className="text-[10px] text-muted-foreground">What happens to you if this goal doesn't get done?</p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {[
                                  { key: "new",    label: "Never done this before" },
                                  { key: "more",   label: "Done it — want to go deeper" },
                                  { key: "limits", label: "Pushing past my limitations" },
                                  { key: "other",  label: "Other" },
                                ].map(opt => (
                                  <button key={opt.key} type="button"
                                    onClick={() => { setWhyContext(opt.key); setRiskOtherText(""); }}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all ${whyContext === opt.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"}`}>
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                              {whyContext === "other" && (
                                <input type="text" autoFocus value={riskOtherText} onChange={e => setRiskOtherText(e.target.value)}
                                  placeholder="What's really at stake for you?"
                                  className="w-full text-xs bg-transparent border border-input rounded-xl px-3 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-ring" />
                              )}
                              {whyContext === "other" && riskOtherText && <p className="text-[10px] text-primary/80">That's your real stake. Let it anchor your commitment.</p>}
                            </>
                          )}
                          {/* Frequency too low */}
                          {freqRisk && (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs font-medium text-amber-300">Risk — frequency too low</p>
                              <p className="text-[10px] text-muted-foreground">{freqRisk.detail}</p>
                              <p className="text-[10px] text-amber-400/80">Open Customize above to increase your weekly commitment.</p>
                            </div>
                          )}
                          {/* Too many metrics */}
                          {complexity && (
                            <div className="mt-1 space-y-1">
                              <p className="text-xs font-medium text-amber-300">Risk — too many targets ({complexity.count} metrics)</p>
                              <p className="text-[10px] text-muted-foreground">A focused goal tracks 1–2 metrics. More than that splits your energy and makes it hard to know if you're winning.</p>
                              <p className="text-[10px] text-amber-400/80">Consider picking your single most important metric and moving the rest to a separate goal.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alignment: does it connect to declaration? */}
                    {declarationText && (
                      <div className="pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs font-semibold text-foreground">Does this goal connect to your declaration?</p>
                        <div className="rounded-lg bg-muted/30 px-3 py-2">
                          <p className="text-xs italic text-muted-foreground">&ldquo;{declarationText}&rdquo;</p>
                        </div>
                        <div className="flex gap-2">
                          {(["Yes ✓", "Not yet"] as const).map(v => (
                            <button key={v} type="button"
                              onClick={() => setAnswer("alignResonance", v)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${answers.alignResonance === v ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:border-primary/50"}`}>
                              {v}
                            </button>
                          ))}
                        </div>
                        {answers.alignResonance === "Not yet" && (
                          <p className="text-[10px] text-amber-400">Edit your statement above to bring it closer to your declaration, then check again.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Step: Coach Sign-Off ── */}
          {step === "signoff" && template && (() => {
            const allRisks = template.answerRisks?.(answers) ?? [];
            const sc = checkSMARTER(pearStatement);
            const smarterFails = [
              !sc.S || !sc.M ? "No specific measurable target" : null,
              !sc.A ? "No frequency or consistency shown" : null,
              !sc.E ? "No essence qualities (who you're becoming)" : null,
              !sc.R2 ? "No proof / evidence declared" : null,
            ].filter(Boolean) as string[];
            const hasIssues = allRisks.length > 0 || smarterFails.length > 0;
            return (
              <div className="p-5 space-y-5">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-wide">Goal Statement</p>
                  <p className="text-sm italic text-foreground leading-relaxed">{pearStatement}</p>
                  {answers.essence && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Values</span>
                      {answers.essence.split(",").filter(Boolean).map((q: string) => (
                        <span key={q} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary capitalize">{q.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                {hasIssues ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-amber-400/30" />
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-400 shrink-0">⚠ Review with your coach before uploading</span>
                      <div className="h-px flex-1 bg-amber-400/30" />
                    </div>
                    <div className="space-y-2">
                      {smarterFails.map((f, i) => (
                        <div key={i} className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2">
                          <span className="font-semibold">Goal statement: </span>{f}
                        </div>
                      ))}
                      {allRisks.map((r, i) => (
                        <div key={i} className="text-xs text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-2 flex items-start justify-between gap-3">
                          <div>
                            {r.field && <span className="font-semibold capitalize">{r.field.replace(/([A-Z])/g, " $1").trim()}: </span>}
                            {r.message}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPrevStep("preview");
                              setStep("smarter");
                            }}
                            className="shrink-0 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 font-semibold text-[11px] transition-colors whitespace-nowrap">
                            Edit
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-border bg-muted/20 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <input
                        type="checkbox"
                        checked={coachApproved}
                        onChange={e => setCoachApproved(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border accent-emerald-500"
                      />
                      <span className="text-sm text-foreground leading-snug">
                        <span className="font-semibold">Coach has reviewed all flagged items above</span>
                        <span className="text-muted-foreground"> — I confirm this goal is ready to upload.</span>
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
                    <p className="text-sm font-semibold text-emerald-400">✓ No issues found</p>
                    <p className="text-xs text-muted-foreground">This goal is clear, measurable, and ready to upload to GoalGetter.</p>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Next step</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">Confirming saves this goal locally. Once all 3 goals are confirmed, your coach reviews everything together and signs off before downloading your Action Plan.</p>
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer CTA */}
        {step === "context" && selectedSample && (
          <div className="p-4 border-t border-border shrink-0 space-y-2">
            <button
              type="button"
              disabled={contextAnswers.length === 0}
              onClick={() => {
                // Use first selected answer's peg as the exciting pre-fill
                const firstMapped = contextAnswers.find(a => a !== "Other" && selectedSample.contextQ.pegMap[a]);
                if (firstMapped) setAnswer("exciting", selectedSample.contextQ.pegMap[firstMapped]);
                setPearStatement(selectedSample.statement);
                setCustomizing(true);
                setReviewing(false);
                setPrevStep("context");
                setStep("preview");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Continue — Customize my statement
            </button>
            {contextAnswers.length === 0 && (
              <p className="text-center text-[10px] text-muted-foreground">Pick all that apply — be honest</p>
            )}
          </div>
        )}
        {step === "smarter" && (() => {
          // Block if any visible required text field is empty
          const missingRequired = template ? template.questions.filter(q => {
            if (q.type !== "text") return false;
            if (q.defaultValue) return false;
            if ((q.label + (q.hint || "")).toLowerCase().includes("optional")) return false;
            if (q.dependsOn) {
              const depVal = answers[q.dependsOn.id] || "";
              if (q.dependsOn.value && !depVal.includes(q.dependsOn.value)) return false;
              if (q.dependsOn.notEmpty && !depVal.trim()) return false;
            }
            return !(answers[q.id] ?? "").toString().trim();
          }) : [];
          return (
            <div className="p-4 border-t border-border shrink-0 max-h-96 overflow-y-auto space-y-3">
              <div>
                <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide mb-3">SMARTER Goal Details (optional)</p>
                <div className="space-y-2.5">
                  {[
                    { id: "specificDetails", label: "Specific Details", hint: "What exactly are you committing to?" },
                    { id: "measurableCriteria", label: "Measurable Criteria", hint: "How will you measure success?" },
                    { id: "achievableResources", label: "Achievable Resources", hint: "What do you have or need?" },
                    { id: "relevantAlignment", label: "Relevant Alignment", hint: "How does this align with your values?" },
                    { id: "endDate", label: "End Date", hint: "Target completion date" },
                    { id: "excitingMotivation", label: "Exciting Motivation", hint: "Why does this excite you?" },
                    { id: "rewardingBenefits", label: "Rewarding Benefits", hint: "What's the payoff?" },
                  ].map(f => (
                    <div key={f.id}>
                      <label className="text-[10px] font-semibold text-foreground/70 block mb-1">{f.label}</label>
                      <input
                        type={f.id === "endDate" ? "date" : "text"}
                        value={answers[f.id] || ""}
                        onChange={e => setAnswer(f.id, e.target.value)}
                        placeholder={f.hint}
                        className="w-full text-xs bg-background border border-input rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {missingRequired.length > 0 && (
                <p className="text-[11px] text-amber-400 pt-2">
                  Fill in: {missingRequired.map(q => q.label.split("(")[0].trim()).join(", ")}
                </p>
              )}
              <button
                type="button"
                onClick={goToPreview}
                disabled={!template || missingRequired.length > 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
                Build My Goal Statement →
              </button>
            </div>
          );
        })()}
        {step === "preview" && (() => {
          // Risk gate: compute whether risk pill was answered
          const _amb = reviewing ? checkTargetAmbition(pearStatement) : null;
          const _frq = reviewing ? checkFrequencyRisk(pearStatement) : null;
          const _cpx = reviewing ? checkMetricComplexity(pearStatement) : null;
          // Pills are shown when: ambition flag exists OR generic (no flags at all)
          const riskHasPills = !!_amb || (!_frq && !_cpx);
          const riskAnswered = !reviewing || !riskHasPills ||
            (whyContext !== null && (whyContext !== "other" || riskOtherText.trim() !== ""));
          const declAnswered = !reviewing || !declarationText || !!answers.alignResonance;
          const canSave = pearStatement.trim() && riskAnswered && declAnswered;
          const missingHints = [
            !riskAnswered && "Risk",
            !declAnswered && "Declaration alignment",
          ].filter(Boolean);
          return (
          <div className="p-4 border-t border-border shrink-0 space-y-2">
            {reviewing ? (
              <>
                <button
                  type="button"
                  onClick={() => { setCoachApproved(false); setStep("signoff"); }}
                  disabled={!canSave}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                  Continue to Coach Sign-Off →
                </button>
                {!canSave && missingHints.length > 0 && (
                  <p className="text-center text-[10px] text-amber-400">Answer: {missingHints.join(" + ")} above to continue</p>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setCustomizing(false); setReviewing(true); }}
                disabled={!pearStatement.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                Apply This Goal Statement
              </button>
            )}
          </div>
          );
        })()}
        {step === "signoff" && template && (() => {
          const allRisks = template.answerRisks?.(answers) ?? [];
          const sc = checkSMARTER(pearStatement);
          const smarterFails = [
            !sc.S || !sc.M ? "goal statement" : null,
            !sc.A ? "goal statement" : null,
            !sc.E ? "goal statement" : null,
            !sc.R2 ? "goal statement" : null,
          ].filter(Boolean);
          const hasIssues = allRisks.length > 0 || smarterFails.length > 0;
          const canUpload = !hasIssues || coachApproved;
          return (
            <div className="p-4 border-t border-border shrink-0 space-y-2">
              {!canUpload && (
                <p className="text-center text-[10px] text-amber-400">Check the box above after reviewing with your coach</p>
              )}
              <button
                type="button"
                disabled={!canUpload}
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                Confirm Goal ✓
              </button>
            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ── Milestone description splitter ───────────────────────────────────────────
// Extracts LEAP event references (Workshop, Intensive, Graduation) as a side note.

function splitMilestoneDesc(desc: string): { goal: string; event: string | null } {
  const eventRe = /\b(\d(?:st|nd|rd|th)?\s+(?:Workshop|Intensive)|Workshop|Intensive|Graduation)\s+(?:May|Jun|Jul|Aug)\s*[\d–\-]*/i;
  const m = desc.match(eventRe);
  if (!m) return { goal: desc, event: null };
  const event = m[0].trim();
  const goal = desc.replace(m[0], "").replace(/^[\s;—]+|[\s;—]+$/g, "").trim();
  return { goal: goal || desc, event };
}

// ── Shared WHY / WHO / WHAT form fields (smarter step + customize accordion) ──

function SmartFormFields({ template, answers, pesoCautionWarning, onAnswer, initialGoal }: {
  template: GoalTemplate;
  answers: Record<string, string>;
  pesoCautionWarning: string | null;
  onAnswer: (id: string, value: string) => void;
  initialGoal?: AppliedGoal;
}) {
  const answerRisks = template.answerRisks?.(answers) ?? [];
  const globalRisks = answerRisks.filter(r => !r.field);
  return (
    <>
      {globalRisks.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {globalRisks.map((r, i) => (
            <p key={i} className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-3 py-2">⚠️ {r.message}</p>
          ))}
        </div>
      )}
      <Section title="WHY — Your Deep Why">
        <p className="text-sm text-foreground mb-3">What will achieving this make possible for you?</p>
        <PillSelect
          options={(() => {
            const savedWhy = initialGoal?.answers?.exciting;
            const templateWhy = PEG_SUGGESTIONS[template.id] || [];
            const filtered = templateWhy.filter(s => s !== savedWhy);
            return savedWhy ? [savedWhy, ...filtered] : filtered;
          })()}
          value={answers.exciting || ""}
          onChange={v => onAnswer("exciting", v)}
          multi={false}
          allowOther={true}
          otherPlaceholder="Write your own WHY…"
        />
      </Section>

      <Section title="WHO — Your 3 Essence Qualities">
        <p className="text-sm text-foreground mb-3">Pick exactly 3 qualities you will embody as a person.</p>
        <EssencePicker
          value={answers.essence || "loving,committed,courageous"}
          onChange={v => onAnswer("essence", v)}
        />
      </Section>

      <Section title="WHAT — The Specifics">
        {template.questions
          .filter(q => q.id !== "essence" && q.id !== "qualities")
          .filter(q => {
            if (!q.dependsOn) return true;
            const depVal = answers[q.dependsOn.id] || "";
            if (q.dependsOn.value) return depVal.includes(q.dependsOn.value);
            if (q.dependsOn.notEmpty) return depVal.trim().length > 0;
            return true;
          })
          .map(q => {
            const isEmpty = !(answers[q.id] ?? "").toString().trim();
            return (
              <div key={q.id} className={`space-y-1.5 mb-4 pl-2 border-l-2 transition-colors ${isEmpty ? "border-amber-400/60" : "border-transparent"}`}>
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  {q.label}
                  {isEmpty && <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">fill this</span>}
                </label>
                {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}
                {q.type === "schedule" ? (
                  <SchedulePicker
                    value={answers[q.id] || ""}
                    defaultValue={q.defaultValue}
                    onChange={v => onAnswer(q.id, v)}
                  />
                ) : q.id === "hoursPerDay" && answers.commitDays ? (
                  <PerDayHoursPicker
                    days={answers.commitDays.split(",").filter(Boolean)}
                    defaultHours={answers.hoursPerDay || "1"}
                    mapValue={answers.hoursPerDayMap || ""}
                    onChange={(avg, mapJson) => { onAnswer("hoursPerDay", avg); onAnswer("hoursPerDayMap", mapJson); }}
                  />
                ) : (
                  <QuestionField q={q} value={answers[q.id] || ""} onChange={v => onAnswer(q.id, v)} />
                )}
                {template.pesoCaution?.field === q.id && pesoCautionWarning && (
                  <p className="text-xs text-amber-400 mt-1">⚠️ {pesoCautionWarning}</p>
                )}
                {answerRisks.filter(r => r.field === q.id).map((r, i) => (
                  <p key={i} className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/30 rounded px-2 py-1.5 mt-1">⚠️ {r.message}</p>
                ))}
              </div>
            );
          })
        }
      </Section>
    </>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground shrink-0">{title}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      {children}
    </div>
  );
}
