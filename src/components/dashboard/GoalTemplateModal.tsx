"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X, ChevronLeft, ChevronRight, Check, Sparkles, BookOpen,
  Users, Heart, Briefcase, AlertTriangle, ChevronDown,
} from "lucide-react";
import { keywordOverlap, smarterCompleteness, alignmentLevel } from "@/lib/utils/goal-utils";
import {
  GOAL_TEMPLATES,
  WHEEL_AREA_SUGGESTIONS,
  type GoalTemplate,
} from "@/lib/data/goal-templates";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "enrollment" | "personal" | "professional";

interface SubCategory {
  id: string;
  label: string;
  description: string;
  templateId: string;
  safetyNote?: string;
}

interface Props {
  goalType?: Category;
  wheelScores?: Record<string, number>;
  declarationText?: string | null;
  onApply: (template: GoalTemplate, answers: Record<string, string>) => void;
  onClose: () => void;
}

// ─── Sub-category definitions ─────────────────────────────────────────────────

const SUBCATEGORIES: Record<Category, SubCategory[]> = {
  enrollment: [
    {
      id: "enrollment",
      label: "Enroll 1 FLEX + 1 ALC Client",
      description: "Standard: 1 FLEX (May sessions) + 1 ALC (June sessions) through daily outreach.",
      templateId: "enrollment-flex-alc",
    },
    {
      id: "enrollment-high",
      label: "High-Volume Enrollment (2+)",
      description: "For coaches targeting 2+ FLEX and/or 2+ ALC clients through pipeline management.",
      templateId: "enrollment-high-volume",
    },
  ],
  personal: [
    {
      id: "health",
      label: "Health & Body",
      description: "Weight, fitness, medical — doctor-cleared, safe, sustainable 8-week plan.",
      templateId: "personal-health",
      safetyNote: "⚕️ Doctor consultation required",
    },
    {
      id: "beingness",
      label: "Mindset & Being-ness",
      description: "Embody a specific essence quality (discipline, calm, joy) through a daily practice.",
      templateId: "personal-beingness",
    },
    {
      id: "relationship-deepen",
      label: "Deepening a Relationship",
      description: "Show up consistently for a partner, parent, sibling, or friend — your actions only.",
      templateId: "personal-relationship-deepen",
    },
    {
      id: "relationship-prepare",
      label: "Becoming Partner-Ready",
      description: "Build the inner qualities you want to bring to a future relationship.",
      templateId: "personal-relationship-prepare",
    },
    {
      id: "experience-goal",
      label: "Experience, Hobby & Personal Skill",
      description: "A trip, a language, an instrument, a sport, a creative project. Not for work. Not for money. Just for you.",
      templateId: "personal-experience-goal",
    },
  ],
  professional: [
    {
      id: "income-employed",
      label: "Extra Income (Employed)",
      description: "Generate additional monthly income through freelance, side coaching, or selling.",
      templateId: "professional-income-employed",
    },
    {
      id: "income-exploring",
      label: "Finding Income (Exploring)",
      description: "Secure consistent income from scratch — freelance, gig, coaching, or employment.",
      templateId: "professional-income-exploring",
    },
    {
      id: "career-beingness",
      label: "Career Identity",
      description: "Embody the professional qualities of the role you want — your presence, not a promotion.",
      templateId: "professional-career-beingness",
    },
    {
      id: "skills",
      label: "Skill Building + Showcase",
      description: "Build a creative or professional skill over 8 weeks, capped by a real culminating event.",
      templateId: "professional-skills",
    },
    {
      id: "workspace-design",
      label: "Workspace by Design",
      description: "Build a workspace that reflects your ambition — employed, studying, freelancing, or running a business. Environment + systems + routine.",
      templateId: "professional-workspace-design",
    },
  ],
};

// ─── Wheel suggestion helper ──────────────────────────────────────────────────

function getWheelSuggestion(
  wheelScores: Record<string, number> | undefined,
  category: Category
): string | null {
  if (!wheelScores) return null;
  const relevant = Object.entries(wheelScores)
    .sort((a, b) => a[1] - b[1]) // lowest first
    .slice(0, 3)
    .map(([area]) => area);

  const suggestions = relevant.flatMap((area) => WHEEL_AREA_SUGGESTIONS[area] ?? []);
  const match = GOAL_TEMPLATES.find(
    (t) => t.goalType === category && suggestions.includes(t.id)
  );
  return match ? `Suggested based on your Wheel of Life` : null;
}

// ─── Category icon ────────────────────────────────────────────────────────────

function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  if (category === "enrollment") return <Users className={className} />;
  if (category === "personal") return <Heart className={className} />;
  return <Briefcase className={className} />;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GoalTemplateModal({ goalType, wheelScores, declarationText, onApply, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(goalType ? 2 : 1);
  const [category, setCategory] = useState<Category>(goalType ?? "enrollment");
  const [subCategoryId, setSubCategoryId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [setupGoalCheck, setSetupGoalCheck] = useState<"yes" | "no" | null>(null);
  const [expandedPreviewWeek, setExpandedPreviewWeek] = useState<number | null>(null);
  // Per-week action selection: weekNumber → boolean[] (true = include on apply)
  const [actionChecks, setActionChecks] = useState<Record<number, boolean[]>>({});
  // Pre-flight edits
  const [editedGoalStatement, setEditedGoalStatement] = useState<string>("");
  const [editedWeekDescs, setEditedWeekDescs] = useState<Record<number, string>>({});
  const [editedActionTexts, setEditedActionTexts] = useState<Record<string, string>>({});
  const [editedActionDays, setEditedActionDays] = useState<Record<string, number[]>>({});
  const [addedActions, setAddedActions] = useState<Record<number, Array<{text:string; days:number[]}>>>({});

  // Selected template
  const template = useMemo(() => {
    if (!subCategoryId) return null;
    const sub = SUBCATEGORIES[category].find((s) => s.id === subCategoryId);
    if (!sub) return null;
    return GOAL_TEMPLATES.find((t) => t.id === sub.templateId) ?? null;
  }, [category, subCategoryId]);

  // SMARTER preview (generated from answers)
  const smarterPreview = useMemo(() => {
    if (!template) return null;
    try { return template.smarter(answers); } catch { return null; }
  }, [template, answers]);

  // Assembled goal statement for preview
  const goalStatementPreview = useMemo(() => {
    if (!smarterPreview) return "";
    // Use template-provided full sentence if available
    if (smarterPreview.goalStatement?.trim()) return smarterPreview.goalStatement.trim();
    // Fallback: assemble from parts
    const s = smarterPreview.specificDetails?.trim();
    const m = smarterPreview.measurableCriteria?.trim();
    const t = smarterPreview.endDate?.trim();
    const e = smarterPreview.excitingMotivation?.trim();
    const rw = smarterPreview.rewardingBenefits?.trim();
    const parts: string[] = [];
    let core = "I will " + (s ? s.replace(/^I will\s+/i, "").replace(/\.$/, "") : "[specific goal]");
    if (m) core += `, achieving ${m.replace(/\.$/, "")}`;
    if (t) core += ` by ${t.replace(/\.$/, "")}`;
    parts.push(core + ".");
    if (e && rw) parts.push(`I am driven by ${e.replace(/\.$/, "")}, and my reward is ${rw.replace(/\.$/, "")}.`);
    else if (e) parts.push(`I am driven by ${e.replace(/\.$/, "")}.`);
    return parts.join(" ");
  }, [smarterPreview]);

  // Rich text for alignment comparison — all SMARTER fields concatenated
  const alignmentTextPreview = useMemo(() => {
    if (!smarterPreview) return "";
    return [
      smarterPreview.specificDetails,
      smarterPreview.measurableCriteria,
      smarterPreview.achievableResources,
      smarterPreview.relevantAlignment,
      smarterPreview.excitingMotivation,
      smarterPreview.rewardingBenefits,
    ].filter(Boolean).join(" ");
  }, [smarterPreview]);

  // Milestones preview (generated from answers)
  const milestonesPreview = useMemo(() => {
    if (!template) return [];
    try { return template.milestones(answers); } catch { return []; }
  }, [template, answers]);

  // Initialize all action checkboxes to true when milestones change
  useEffect(() => {
    const init: Record<number, boolean[]> = {};
    for (const wk of milestonesPreview) {
      init[wk.weekNumber] = wk.actions.map(() => true);
    }
    setActionChecks(init);
  }, [milestonesPreview]);

  // Re-init goal statement when questionnaire answers change
  useEffect(() => {
    setEditedGoalStatement(goalStatementPreview);
  }, [goalStatementPreview]);

  // Re-init week/action edits when milestones change
  useEffect(() => {
    const descs: Record<number, string> = {};
    const texts: Record<string, string> = {};
    const days: Record<string, number[]> = {};
    for (const wk of milestonesPreview) {
      descs[wk.weekNumber] = wk.description;
      wk.actions.forEach((a, idx) => {
        texts[`${wk.weekNumber}-${idx}`] = a.text;
        days[`${wk.weekNumber}-${idx}`] = a.days ?? [];
      });
    }
    setEditedWeekDescs(descs);
    setEditedActionTexts(texts);
    setEditedActionDays(days);
    setAddedActions({});
  }, [milestonesPreview]);

  const wheelSuggestion = getWheelSuggestion(wheelScores, category);

  function handleCategorySelect(cat: Category) {
    setCategory(cat);
    setSubCategoryId(null);
    setAnswers({});
    setSetupGoalCheck(null);
    setStep(2);
  }

  function handleSubCategorySelect(subId: string) {
    setSubCategoryId(subId);
    // Pre-fill default values
    const sub = SUBCATEGORIES[category].find((s) => s.id === subId);
    const tmpl = sub ? GOAL_TEMPLATES.find((t) => t.id === sub.templateId) : null;
    if (tmpl) {
      const defaults: Record<string, string> = {};
      for (const q of tmpl.questions) {
        if (q.defaultValue) defaults[q.id] = q.defaultValue;
      }
      setAnswers(defaults);
    }
    setStep(3);
  }

  function handleAnswerChange(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handlePreview() {
    setStep(4);
  }

  function handleApply() {
    if (!template) return;
    // Strip "other" sentinel from all multiselect answers before applying
    const cleanedAnswers: Record<string, string> = { ...answers };
    for (const q of template.questions) {
      if (q.type === "multiselect" && cleanedAnswers[q.id]) {
        cleanedAnswers[q.id] = cleanedAnswers[q.id]
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s !== "other")
          .join(", ");
      }
    }
    // Wrap template applying all pre-flight edits
    const filteredTemplate = {
      ...template,
      smarter: (a: Record<string, string>) => ({ ...template.smarter(a), goalStatement: editedGoalStatement || undefined }),
      milestones: (a: Record<string, string>) =>
        template.milestones(a).map((wk) => {
          const base = wk.actions
            .map((action, origIdx) => ({ action, origIdx }))
            .filter(({ action }) => action.text?.trim())
            .filter(({ origIdx }) => actionChecks[wk.weekNumber]?.[origIdx] !== false)
            .map(({ action, origIdx }) => ({
              ...action,
              text: editedActionTexts[`${wk.weekNumber}-${origIdx}`] ?? action.text,
              days: editedActionDays[`${wk.weekNumber}-${origIdx}`] ?? action.days ?? [],
            }));
          const extras = (addedActions[wk.weekNumber] ?? []).filter((a) => a.text.trim());
          return {
            ...wk,
            description: editedWeekDescs[wk.weekNumber] ?? wk.description,
            actions: [...base, ...extras],
          };
        }),
    };
    onApply(filteredTemplate, cleanedAnswers);
  }

  // ── Step 1: Category ──────────────────────────────────────────────────────

  function renderStep1() {
    const categories: { id: Category; label: string; desc: string; color: string; borderColor: string }[] = [
      {
        id: "enrollment",
        label: "Enrollment",
        desc: "Enroll FLEX and ALC clients through daily outreach",
        color: "text-blue-500",
        borderColor: "border-blue-500/40 hover:border-blue-500",
      },
      {
        id: "personal",
        label: "Personal",
        desc: "Health, mindset, relationships — who you become",
        color: "text-yellow-500",
        borderColor: "border-yellow-500/40 hover:border-yellow-500",
      },
      {
        id: "professional",
        label: "Professional",
        desc: "Income, career identity, skill building",
        color: "text-purple-500",
        borderColor: "border-purple-500/40 hover:border-purple-500",
      },
    ];

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold">What area is most alive for you in LEAP 99?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a category to find your goal template.
          </p>
        </div>
        {wheelSuggestion && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            {wheelSuggestion}
          </div>
        )}
        <div className="grid gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 bg-card text-left transition-all hover:shadow-md ${cat.borderColor}`}
            >
              <div className={`p-2.5 rounded-xl bg-muted shrink-0`}>
                <CategoryIcon category={cat.id} className={`h-5 w-5 ${cat.color}`} />
              </div>
              <div>
                <p className={`font-bold text-base ${cat.color}`}>{cat.label}</p>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Is this goal 100% within your power to achieve, even if others don&apos;t cooperate?{" "}
          <span className="text-primary font-medium">All templates are designed this way.</span>
        </p>
      </div>
    );
  }

  // ── Step 2: Sub-category ──────────────────────────────────────────────────

  function renderStep2() {
    const subs = SUBCATEGORIES[category];
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-bold">Choose your {category} focus</h3>
          <p className="text-sm text-muted-foreground mt-1">Each option comes with a full 8-week plan.</p>
        </div>
        <div className="grid gap-3">
          {subs.map((sub) => {
            const tmpl = GOAL_TEMPLATES.find((t) => t.id === sub.templateId);
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubCategorySelect(sub.id)}
                className="flex items-start gap-4 px-4 py-4 rounded-xl border-2 border-border bg-card text-left hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{sub.label}</p>
                    {sub.safetyNote && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium dark:bg-amber-900/50 dark:text-amber-400">
                        {sub.safetyNote}
                      </span>
                    )}
                    {tmpl?.wheelAreaHint && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {tmpl.wheelAreaHint}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{sub.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step 3: Questionnaire ─────────────────────────────────────────────────

  function renderStep3() {
    if (!template) return null;
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-bold">{template.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          {template.safetyNote && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {template.safetyNote}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {template.questions
            .filter((q) => {
              if (!q.dependsOn) return true;
              const depVal = answers[q.dependsOn.id] ?? "";
              if (q.dependsOn.notEmpty) return depVal.trim().length > 0;
              return depVal.includes(q.dependsOn.value ?? "");
            })
            .map((q) => (
            <div key={q.id} className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground block">
                {q.label}
                {q.unit && <span className="text-xs text-muted-foreground ml-1">({q.unit})</span>}
              </label>
              {q.hint && <p className="text-xs text-muted-foreground">{q.hint}</p>}

              {q.type === "select" && q.options ? (
                // Single-select — radio pill buttons (click one deselects others)
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = (answers[q.id] ?? q.defaultValue ?? "") === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerChange(q.id, opt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        {selected && <Check className="inline h-3 w-3 mr-1" />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : q.type === "multiselect" && q.options ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {/* Preset option pills */}
                    {q.options.map((opt) => {
                      const current = (answers[q.id] || "").split(",").map((s) => s.trim()).filter(Boolean);
                      const selected = current.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? current.filter((v) => v !== opt)
                              : [...current, opt];
                            handleAnswerChange(q.id, next.join(", "));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {selected && <Check className="inline h-3 w-3 mr-1" />}
                          {opt}
                        </button>
                      );
                    })}
                    {/* Custom value pills (added via "other") */}
                    {(answers[q.id] || "")
                      .split(",")
                      .map((s) => s.trim())
                      .filter((s) => s && s !== "other" && !q.options!.includes(s))
                      .map((customVal) => (
                        <button
                          key={customVal}
                          type="button"
                          onClick={() => {
                            const current = (answers[q.id] || "").split(",").map((s) => s.trim()).filter((s) => s && s !== customVal);
                            handleAnswerChange(q.id, current.join(", "));
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors bg-primary text-primary-foreground border-primary"
                        >
                          <Check className="inline h-3 w-3 mr-1" />
                          {customVal}
                          <X className="inline h-3 w-3 ml-1 opacity-70" />
                        </button>
                      ))}
                  </div>
                  {(answers[q.id] || "").split(",").map((s) => s.trim()).filter(Boolean).includes("other") && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type your answer and press Add..."
                        value={answers[q.id + "_other"] ?? ""}
                        onChange={(e) => handleAnswerChange(q.id + "_other", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (answers[q.id + "_other"] ?? "").trim();
                            if (!val) return;
                            const current = (answers[q.id] || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "other");
                            // Keep "other" so user can keep adding more custom values
                            handleAnswerChange(q.id, [...current, val, "other"].join(", "));
                            handleAnswerChange(q.id + "_other", "");
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-primary/40 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (answers[q.id + "_other"] ?? "").trim();
                          if (!val) return;
                          const current = (answers[q.id] || "").split(",").map((s) => s.trim()).filter((s) => s && s !== "other");
                          // Keep "other" so user can keep adding more custom values
                          handleAnswerChange(q.id, [...current, val, "other"].join(", "));
                          handleAnswerChange(q.id + "_other", "");
                        }}
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={q.type === "number" ? "number" : "text"}
                  value={answers[q.id] ?? q.defaultValue ?? ""}
                  placeholder={q.placeholder ?? ""}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          ))}
        </div>

        {/* Setup goal check */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-semibold">
            Is this goal 100% within your power to achieve, even if others don&apos;t cooperate?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSetupGoalCheck("yes")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                setupGoalCheck === "yes"
                  ? "bg-emerald-500 text-white border-emerald-500"
                  : "border-border hover:border-emerald-500/50 text-muted-foreground"
              }`}
            >
              ✓ Yes — it&apos;s all on me
            </button>
            <button
              type="button"
              onClick={() => setSetupGoalCheck("no")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                setupGoalCheck === "no"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "border-border hover:border-orange-500/50 text-muted-foreground"
              }`}
            >
              ✗ It depends on others
            </button>
          </div>
          {setupGoalCheck === "no" && (
            <p className="text-xs text-orange-600 dark:text-orange-400">
              ⚠️ Every goal in LEAP must be 100% within your control. Adjust your goal so that success depends only on your actions — not on another person&apos;s decision or response.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Step 4: SMARTER Preview ───────────────────────────────────────────────

  function renderStep4() {
    if (!template || !smarterPreview) return null;

    // SMARTER completeness badge
    const { score: smarterScore, checks: smarterChecks } = smarterCompleteness(smarterPreview);
    const declScore = declarationText ? keywordOverlap(goalStatementPreview, declarationText) : null;
    const declLevel = declScore !== null ? alignmentLevel(declScore) : null;

    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-bold">Here&apos;s what your goal will look like</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            This is exactly how it will appear in your Goals tab — fully editable after you apply.
          </p>
        </div>

        {/* ROW 1 — Goal card (mirrors GoalsTab goal card) */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 pt-3 pb-2 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Goal Statement</p>
          </div>
          <div className="p-4 space-y-3">
            {/* Goal statement text — editable pre-flight */}
            <textarea
              value={editedGoalStatement}
              onChange={(e) => setEditedGoalStatement(e.target.value)}
              rows={3}
              placeholder="Fill in the questionnaire to see your goal."
              className="w-full text-sm bg-transparent border border-input rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />

            {/* SMARTER + alignment pills (same as GoalsTab view mode) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted border border-border font-mono">
                {smarterChecks.map((c, i) => (
                  <span key={i} className={c.filled ? "text-green-600" : "text-red-400"} title={c.label}>
                    {c.letter}{c.filled ? "✓" : "✗"}
                  </span>
                ))}
                <span className="ml-1 text-muted-foreground">{smarterScore}/7</span>
              </span>
              {declScore !== null && declLevel && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${declLevel.bg} ${declLevel.color}`}>
                  Declaration alignment: {declScore}%
                </span>
              )}
            </div>

            {/* Values pills */}
            {answers.essence && (
              <div className="flex flex-wrap gap-1.5">
                {answers.essence.split(",").map((v) => v.trim()).filter(Boolean).map((v) => (
                  <span key={v} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">{v}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROW 2 + ROW 3 — Milestones (mirrors WeeklyTracker) */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{milestonesPreview.length}-Week Milestones</p>
          </div>
          <div className="divide-y divide-border">
            {milestonesPreview.map((wk, idx) => {
              const weekNum = idx + 1;
                const nonEmptyActions = wk.actions.filter((a) => a.text?.trim());
              const pct = wk.cumulativePercentage ?? 0;
              const isExpanded = expandedPreviewWeek === weekNum;

              // Row 2 alignment pill
              const row2Score = alignmentTextPreview && wk.description
                ? keywordOverlap(wk.description, alignmentTextPreview) : null;
              const row2Level = row2Score !== null ? alignmentLevel(row2Score) : null;

              // Row 3 alignment pill
              const actionsText = nonEmptyActions.map((a) => a.text).join(" ");
              const row3Score = actionsText && wk.description
                ? keywordOverlap(actionsText, wk.description) : null;
              const row3Level = row3Score !== null ? alignmentLevel(row3Score) : null;

              const ALL_DAYS = ["M","T","W","Th","F","Sa","Su"];

              return (
                <div key={weekNum}>
                  {/* Week row header */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setExpandedPreviewWeek(isExpanded ? null : weekNum)}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedPreviewWeek(isExpanded ? null : weekNum)}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold shrink-0">Wk {weekNum}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {wk.description || "No description"}
                      </span>
                      {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 rotate-180" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {row2Score !== null && row2Level && (
                        <span title="Goal-milestone alignment" className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${row2Level.bg} ${row2Level.color}`}>
                          {row2Score}%
                        </span>
                      )}
                      <span className="text-xs font-bold text-muted-foreground">{pct}%</span>
                    </div>
                  </div>

                  {/* Expanded: editable week description + action steps (Row 3) */}
                  {isExpanded && (
                    <div className="px-4 pb-3 space-y-2 bg-muted/10">
                      {/* Editable week description */}
                      <input
                        type="text"
                        value={editedWeekDescs[wk.weekNumber] ?? wk.description}
                        onChange={(e) => setEditedWeekDescs(prev => ({ ...prev, [wk.weekNumber]: e.target.value }))}
                        placeholder="Week description…"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs bg-background border border-border rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {/* Action steps with origIdx tracking */}
                      {(() => {
                        const indexedActions = wk.actions
                          .map((action, origIdx) => ({ action, origIdx }))
                          .filter(({ action }) => action.text?.trim());
                        return indexedActions.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            {indexedActions.map(({ action, origIdx }) => {
                              const dayKey = `${wk.weekNumber}-${origIdx}`;
                              const assignedDays = editedActionDays[dayKey] ?? action.days ?? [];
                              return (
                                <div key={origIdx} className="space-y-1">
                                  <div className="flex items-start gap-2">
                                    <input
                                      type="checkbox"
                                      checked={actionChecks[wk.weekNumber]?.[origIdx] !== false}
                                      onChange={() => setActionChecks(prev => {
                                        const arr = [...(prev[wk.weekNumber] ?? wk.actions.map(() => true))];
                                        arr[origIdx] = !arr[origIdx];
                                        return { ...prev, [wk.weekNumber]: arr };
                                      })}
                                      onClick={(e) => e.stopPropagation()}
                                      className="rounded border-border mt-0.5 shrink-0 cursor-pointer accent-blue-500"
                                    />
                                    <input
                                      type="text"
                                      value={editedActionTexts[dayKey] ?? action.text}
                                      onChange={(e) => setEditedActionTexts(prev => ({ ...prev, [dayKey]: e.target.value }))}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`flex-1 text-xs bg-background border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary ${actionChecks[wk.weekNumber]?.[origIdx] === false ? "opacity-40 line-through" : ""}`}
                                    />
                                  </div>
                                  <div className="flex gap-1 pl-5 flex-wrap">
                                    {ALL_DAYS.map((label, d) => {
                                      const active = assignedDays.includes(d);
                                      return (
                                        <button
                                          key={d}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditedActionDays(prev => ({
                                              ...prev,
                                              [dayKey]: active
                                                ? assignedDays.filter(x => x !== d)
                                                : [...assignedDays, d].sort((a, b) => a - b),
                                            }));
                                          }}
                                          className={`w-6 h-6 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${
                                            active
                                              ? "bg-primary text-primary-foreground"
                                              : "bg-muted/60 text-muted-foreground/60 hover:bg-primary/20 hover:text-primary"
                                          }`}
                                        >
                                          {label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic pt-1">No action steps for this week.</p>
                        );
                      })()}
                      {/* Added actions */}
                      {(addedActions[wk.weekNumber] ?? []).map((added, addIdx) => (
                        <div key={`added-${addIdx}`} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <input type="checkbox" checked disabled className="rounded border-border mt-0.5 shrink-0 opacity-30 accent-blue-500" />
                            <input
                              type="text"
                              value={added.text}
                              placeholder="New action step…"
                              onChange={(e) => setAddedActions(prev => {
                                const arr = [...(prev[wk.weekNumber] ?? [])];
                                arr[addIdx] = { ...arr[addIdx], text: e.target.value };
                                return { ...prev, [wk.weekNumber]: arr };
                              })}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-xs bg-background border border-primary/40 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="flex gap-1 pl-5 flex-wrap">
                            {ALL_DAYS.map((label, d) => {
                              const active = added.days.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAddedActions(prev => {
                                      const arr = [...(prev[wk.weekNumber] ?? [])];
                                      arr[addIdx] = {
                                        ...arr[addIdx],
                                        days: active
                                          ? arr[addIdx].days.filter(x => x !== d)
                                          : [...arr[addIdx].days, d].sort((a, b) => a - b),
                                      };
                                      return { ...prev, [wk.weekNumber]: arr };
                                    });
                                  }}
                                  className={`w-6 h-6 text-[9px] font-bold rounded flex items-center justify-center transition-colors ${
                                    active
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted/60 text-muted-foreground/60 hover:bg-primary/20 hover:text-primary"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {/* Add action step button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddedActions(prev => ({
                            ...prev,
                            [wk.weekNumber]: [...(prev[wk.weekNumber] ?? []), { text: "", days: [] }],
                          }));
                        }}
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-1"
                      >
                        + Add action step
                      </button>
                      {/* Row 3 alignment pill */}
                      {row3Score !== null && row3Level && (
                        <div className="pt-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${row3Level.bg} ${row3Level.color}`}>
                            Actions-milestone alignment: {row3Score}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
          <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Applying this template will pre-fill all milestones + action steps.{" "}
            <span className="text-foreground font-medium">Everything is editable</span> after you apply.
          </p>
        </div>
      </div>
    );
  }

  // ── Progress indicator ────────────────────────────────────────────────────

  const stepLabels = goalType
    ? ["Focus", "Questionnaire", "Review"]
    : ["Category", "Focus", "Questionnaire", "Review"];
  const currentStepIdx = goalType ? step - 2 : step - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`bg-background rounded-2xl border border-border shadow-2xl w-full max-h-[90vh] flex flex-col transition-all ${step === 4 ? "max-w-2xl" : "max-w-lg"}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold">Goal Template Wizard</h2>
          </div>
          <button type="button" onClick={onClose} title="Close" className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step progress */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    i < currentStepIdx
                      ? "bg-primary text-primary-foreground"
                      : i === currentStepIdx
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {i < currentStepIdx ? <Check className="h-3 w-3" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === currentStepIdx ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-px ${i < currentStepIdx ? "bg-primary/40" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between gap-3">
          {/* Back */}
          {step > (goalType ? 2 : 1) ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {/* Next / Apply */}
          {step === 1 && (
            <p className="text-xs text-muted-foreground">Select a category above</p>
          )}
          {step === 2 && (
            <p className="text-xs text-muted-foreground">Select a focus area above</p>
          )}
          {step === 3 && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={!template}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              Preview Goal
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Check className="h-4 w-4" />
              Apply This Goal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
