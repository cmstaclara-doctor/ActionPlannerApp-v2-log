"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, ChevronUp, Users, Heart, Briefcase, Pencil, Download, RotateCcw } from "lucide-react";
import { PEARWizardModal, type AppliedGoal } from "@/components/PEARWizardModal";
import { GOAL_TEMPLATES, WHEEL_AREA_SUGGESTIONS, type TemplateWeek } from "@/lib/data/goal-templates";
import { getDeclarationAlignmentScore, checkMilestoneGoalAlignment, checkActionMilestoneCoverage } from "@/lib/utils/alignment-rules";
import { assessGoalDeclarationFit, type DeclarationFitResult } from "@/lib/actions/alignment";
import { getWeekDates } from "@/lib/utils/week-dates";
import { getCoachId, saveGoalToDb, loadStudentGoals } from "@/lib/supabase-operations";

// (Same types and helpers as original page.tsx)
type GoalCategory = "enrollment" | "personal" | "professional";

interface PageState {
  name: string;
  declaration: string;
  declarationMeaning: string;
  goals: Record<GoalCategory, AppliedGoal | null>;
}

const STORAGE_PREFIX = "apa_leap99_student_";

function hydrateGoal(sg: any): AppliedGoal | null {
  if (!sg) return null;
  const template = GOAL_TEMPLATES.find(t => t.id === sg.templateId);
  return template ? { template, answers: sg.answers, pearStatement: sg.pearStatement } : null;
}

function loadState(studentId: string): PageState {
  const def: PageState = {
    name: "", declaration: "", declarationMeaning: "",
    goals: { enrollment: null, personal: null, professional: null },
  };
  try {
    const key = `${STORAGE_PREFIX}${studentId}`;
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (!raw) return def;
    const s: any = JSON.parse(raw);
    return {
      name: s.name || "", declaration: s.declaration || "", declarationMeaning: s.declarationMeaning || "",
      goals: {
        enrollment: hydrateGoal(s.goals?.enrollment),
        personal: hydrateGoal(s.goals?.personal),
        professional: hydrateGoal(s.goals?.professional),
      },
    };
  } catch { return def; }
}

function saveState(state: PageState, studentId: string) {
  try {
    const key = `${STORAGE_PREFIX}${studentId}`;
    const stored = {
      name: state.name, declaration: state.declaration, declarationMeaning: state.declarationMeaning,
      goals: {
        enrollment: state.goals.enrollment ? { templateId: state.goals.enrollment.template.id, answers: state.goals.enrollment.answers, pearStatement: state.goals.enrollment.pearStatement } : null,
        personal: state.goals.personal ? { templateId: state.goals.personal.template.id, answers: state.goals.personal.answers, pearStatement: state.goals.personal.pearStatement } : null,
        professional: state.goals.professional ? { templateId: state.goals.professional.template.id, answers: state.goals.professional.answers, pearStatement: state.goals.professional.pearStatement } : null,
      },
    };
    localStorage.setItem(key, JSON.stringify(stored));
  } catch { /* ignore */ }
}

const GOAL_CATEGORIES: { id: GoalCategory; label: string; description: string; color: string; bg: string; border: string; icon: React.ReactNode; }[] = [
  { id: "enrollment", label: "Enrollment Goal", description: "Invite people into FLEX, ALC, or LEAP — from genuine service.", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", icon: <Users className="h-5 w-5" /> },
  { id: "personal", label: "Personal Goal", description: "Health, relationships, mindset, or a hobby just for you.", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: <Heart className="h-5 w-5" /> },
  { id: "professional", label: "Professional Goal", description: "Income, skills, career presence, or your ideal workspace.", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-400/30", icon: <Briefcase className="h-5 w-5" /> },
];

const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

interface StudentEditorContentProps {
  studentId: string;
}

export function StudentEditorContent({ studentId }: StudentEditorContentProps) {
  const [state, setState] = useState<PageState>(() => ({
    name: "", declaration: "", declarationMeaning: "",
    goals: { enrollment: null, personal: null, professional: null },
  }));
  const [loading, setLoading] = useState(true);
  const [openWizard, setOpenWizard] = useState<GoalCategory | null>(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [declEditing, setDeclEditing] = useState(false);
  const [coachFinalApproved, setCoachFinalApproved] = useState(false);
  const [aiResults, setAiResults] = useState<Partial<Record<GoalCategory, DeclarationFitResult>>>({});
  const [aiLoadingGoal, setAiLoadingGoal] = useState<Partial<Record<GoalCategory, boolean>>>({});
  const [refinedGoals, setRefinedGoals] = useState<Partial<Record<GoalCategory, boolean>>>({});
  const [dismissedRefinements, setDismissedRefinements] = useState<Partial<Record<GoalCategory, boolean>>>({});
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState<"18px" | "20px">("20px");
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<GoalCategory | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<Partial<Record<GoalCategory, number | null>>>({});
  const [editingMilestone, setEditingMilestone] = useState<{ catId: GoalCategory; week: number } | null>(null);
  const [openDayPicker, setOpenDayPicker] = useState<string | null>(null);
  const [newCustomStep, setNewCustomStep] = useState<Partial<Record<GoalCategory, string>>>({});
  const [milestoneAlignResult, setMilestoneAlignResult] = useState<Partial<Record<GoalCategory, { distrib: any; perWeek: any[] }>>>({});

  const saveReady = useRef(false);
  const stateRef = useRef(state);
  const autoAiTriggered = useRef<Set<GoalCategory>>(new Set());

  useEffect(() => { stateRef.current = state; }, [state]);

  // Load state on mount
  useEffect(() => {
    async function load() {
      const localState = loadState(studentId);

      // Try to load from DB
      try {
        const dbGoals = await loadStudentGoals(studentId);
        if (dbGoals && Object.keys(dbGoals).length > 0) {
          for (const [templateId, goal] of Object.entries(dbGoals)) {
            const cat = GOAL_CATEGORIES.find(c =>
              GOAL_TEMPLATES.find(t => t.id === templateId)?.categories?.includes(c.id)
            );
            if (cat) {
              const template = GOAL_TEMPLATES.find(t => t.id === templateId);
              if (template) {
                localState.goals[cat.id] = { template, answers: (goal as any).answers, pearStatement: (goal as any).pearStatement };
              }
            }
          }
          localState.declaration = (dbGoals as any).declaration || localState.declaration;
          localState.declarationMeaning = (dbGoals as any).declarationMeaning || localState.declarationMeaning;
        }
      } catch (e) {
        // Fall back to localStorage if DB fails
      }

      setState(localState);
      setDarkMode(localStorage.getItem("apa_theme") !== "light");
      setFontSize((localStorage.getItem("apa_fontSize") as "18px" | "20px") || "20px");
      saveReady.current = true;
      setLoading(false);
    }

    load();
  }, [studentId]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add("dark"); localStorage.setItem("apa_theme", "dark"); }
    else { root.classList.remove("dark"); localStorage.setItem("apa_theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSize;
    localStorage.setItem("apa_fontSize", fontSize);
  }, [fontSize]);

  // Auto-save to localStorage
  useEffect(() => {
    if (saveReady.current) {
      saveState(state, studentId);
    }
  }, [state, studentId]);

  // Auto-run AI alignment
  useEffect(() => {
    if (!state.declaration) return;
    const allSet = GOAL_CATEGORIES.every(c => state.goals[c.id] !== null);
    if (!allSet) return;
    for (const cat of GOAL_CATEGORIES) {
      if (autoAiTriggered.current.has(cat.id)) continue;
      const goal = state.goals[cat.id];
      if (!goal) continue;
      autoAiTriggered.current.add(cat.id);
      setAiLoadingGoal(prev => ({ ...prev, [cat.id]: true }));
      assessGoalDeclarationFit(goal.pearStatement, state.declaration, goal.answers.essence || null, cat.id, state.declarationMeaning || null)
        .then(result => setAiResults(prev => ({ ...prev, [cat.id]: result })))
        .catch(() => { autoAiTriggered.current.delete(cat.id); })
        .finally(() => setAiLoadingGoal(prev => ({ ...prev, [cat.id]: false })));
    }
  }, [state.goals, state.declaration, state.declarationMeaning]);

  function setField<K extends keyof PageState>(key: K, value: PageState[K]) {
    setState(p => ({ ...p, [key]: value }));
  }

  function setGoalAnswer(catId: GoalCategory, key: string, val: string) {
    setState(prev => {
      const goal = prev.goals[catId];
      if (!goal) return prev;
      return {
        ...prev,
        goals: { ...prev.goals, [catId]: { ...goal, answers: { ...goal.answers, [key]: val } } }
      };
    });
  }

  function handleGoalApply(category: GoalCategory, goal: AppliedGoal) {
    setState(p => ({ ...p, goals: { ...p.goals, [category]: goal } }));
    setOpenWizard(null);
    // Sync to DB
    saveGoalToDb(studentId, category, {
      templateId: goal.template.id,
      answers: goal.answers,
      pearStatement: goal.pearStatement,
      declaration: state.declaration,
      declarationMeaning: state.declarationMeaning,
    });
  }

  function runAlignmentCheck(catId: GoalCategory) {
    const goal = stateRef.current.goals[catId];
    if (!goal) return;

    try {
      const weeks = goal.template.milestones(goal.answers);
      const updatedWeeks = weeks.map(w => ({
        weekNumber: w.weekNumber,
        cumulativePercentage: Number(goal.answers[`ms_${w.weekNumber}_pct`] || w.cumulativePercentage),
      }));

      const distribResult = checkMilestoneGoalAlignment(updatedWeeks);

      const perWeek = weeks.map(wk => {
        const templateActions = wk.actions.length;
        const customRaw = goal.answers[`ms_${wk.weekNumber}_custom`];
        let customSteps: Array<{ text: string; days: number[] }> = [];
        try { customSteps = JSON.parse(customRaw || "[]"); } catch { /* ok */ }

        const totalActions = templateActions + customSteps.length;
        const activeActions = wk.actions.filter((_: unknown, i: number) => goal.answers[`ms_${wk.weekNumber}_act_${i}_done`] !== "false").length
          + customSteps.filter((_: unknown, ci: number) => goal.answers[`ms_${wk.weekNumber}_custom_${ci}_done`] !== "false").length;
        const scheduledDays = new Set(
          wk.actions.flatMap((a: { days?: number[] }) => a.days ?? [])
            .concat(customSteps.flatMap(cs => cs.days ?? []))
        ).size;

        const coverageResult = checkActionMilestoneCoverage(totalActions, activeActions, scheduledDays);
        return {
          weekNumber: wk.weekNumber,
          safe: coverageResult.milestoneSafe,
          overloaded: activeActions > totalActions * 1.5
        };
      });

      setMilestoneAlignResult(prev => ({
        ...prev,
        [catId]: { distrib: distribResult, perWeek }
      }));
    } catch { /* ok */ }
  }

  function computeGoalScore(cat: GoalCategory): number | null {
    const g = state.goals[cat]; if (!g) return null;
    const ak = state.declaration ? getDeclarationAlignmentScore(state.declaration, g.pearStatement) : 0;
    const ai = aiResults[cat];
    const aS = ai ? ai.overallScore : Math.max(ak, 45);
    let mS = 100;
    try { const wks = g.template.milestones(g.answers); mS = checkMilestoneGoalAlignment(wks.map(w => ({ weekNumber: w.weekNumber, cumulativePercentage: w.cumulativePercentage }))).score; } catch { /* ok */ }
    let acS = 100;
    try {
      const wks = g.template.milestones(g.answers);
      acS = Math.round(wks.map(wk => {
        const sd = new Set(wk.actions.flatMap((a: { days?: number[] }) => a.days ?? [])).size;
        const ac = wk.actions.filter((_: unknown, i: number) => g.answers[`ms_${wk.weekNumber}_act_${i}_done`] !== "false").length;
        let cc = 0; try { const cs = JSON.parse(g.answers[`ms_${wk.weekNumber}_custom`] || "[]"); cc = cs.filter((_: unknown, ci: number) => g.answers[`ms_${wk.weekNumber}_custom_${ci}_done`] !== "false").length; } catch { /* ok */ }
        return checkActionMilestoneCoverage(wk.actions.length, ac + cc, sd).coverageScore;
      }).reduce((a, b) => a + b, 0) / wks.length);
    } catch { /* ok */ }
    return Math.round(aS * 0.3 + mS * 0.4 + acS * 0.3);
  }

  const anyGoalSet = Object.values(state.goals).some(g => g !== null);
  const allThreeSet = Object.values(state.goals).every(g => g !== null);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  // Return minimal stub for now — full editor implementation is in original page.tsx
  // This is a placeholder to get the multiuser routing working
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-12">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground mb-4">Goal Editor</h2>
        <p className="text-sm text-muted-foreground mb-4">Stub implementation. Full editor in development.</p>
        <div className="text-xs text-muted-foreground font-mono">
          <p>Student ID: {studentId}</p>
          <p>Goals loaded: {Object.values(state.goals).filter(g => g !== null).length}/3</p>
        </div>
      </div>
    </div>
  );
}
