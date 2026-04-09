"use client";

import { useEffect, useState, useCallback } from "react";
import { getStudentGoals, updateGoal } from "@/lib/actions/goals";
import { updateMilestone } from "@/lib/actions/milestones";
import { getBatchCurrentWeek, getBatchWeekInfo } from "@/lib/actions/attendance";
import { getStudentAlignment, assessGoalDeclarationFit, type DeclarationFitResult } from "@/lib/actions/alignment";
import { useNavigation } from "@/components/layout/DashboardShell";
import {
  ChevronDown, ChevronUp, ChevronRight, Plus, X, Check,
  BookOpen, Pencil, AlertTriangle, Sparkles,
  ArrowRight, FlaskConical, Wand2, ChevronLeft,
  Calendar, RefreshCw, LayoutList, TrendingUp, Zap,
} from "lucide-react";
import { CheckboxApprovalPanel, type ApprovalField } from "./jj/CheckboxApprovalPanel";
import { getStudentDetail } from "@/lib/actions/students";
import { WheelOfLifeModal } from "./WheelOfLifeModal";
import { GoalTemplateModal } from "./GoalTemplateModal";
import { saveWheelGoals, improveSmarterField } from "@/lib/actions/wheel-of-life";
import { scanFields } from "@/lib/utils/pii-scan";
import { GOAL_TEMPLATES, type GoalTemplate } from "@/lib/data/goal-templates";

// ─── Types ───────────────────────────────────────────────────────

interface CheckItem { text: string; done: boolean; days?: number[]; }

interface MilestoneData {
  id: string;
  weekNumber: number;
  weekStartDate: string | null;
  weekEndDate: string | null;
  milestoneDescription: string | null;
  actions: string | null;
  results: string | null;
  cumulativePercentage: number;
}

interface GoalData {
  id: string;
  goalType: string;
  goalStatement: string;
  valuesDeclaration: string | null;
  specificDetails: string | null;
  measurableCriteria: string | null;
  achievableResources: string | null;
  relevantAlignment: string | null;
  endDate: string | null;
  excitingMotivation: string | null;
  rewardingBenefits: string | null;
  milestones: MilestoneData[];
}

interface SmarterField {
  key: keyof GoalData;
  letter: string;
  label: string;
  placeholder: string;
  suggestion: string;
  minWords: number;
}

interface MilestoneQuestions {
  hoursPerDay: string;
  daysPerWeek: string;
  startingPct: string;
  busyWeeks: string;
  obstacle: string;
  accountabilityPartner: string;
  reviewDay: string;
  prospectCount: string;
  contactsPerDay: string;
  enrollTarget: string;
  conversionRatio: string;
  channel: string;
  flexTarget: string;
  alcTarget: string;
  leapTarget: string;
  seminarDates: string;
  baseline: string;
  dailyActivity: string;
  measureMethod: string;
  habitTrigger: string;
  targetCredential: string;
  currentLevel: string;
  studyHours: string;
  learningMethod: string;
  examDate: string;
}

const DEFAULT_QUESTIONS: MilestoneQuestions = {
  hoursPerDay: "2", daysPerWeek: "5", startingPct: "0",
  busyWeeks: "", obstacle: "", accountabilityPartner: "", reviewDay: "Sunday",
  prospectCount: "", contactsPerDay: "5", enrollTarget: "", conversionRatio: "5", channel: "referrals",
  flexTarget: "", alcTarget: "", leapTarget: "", seminarDates: "",
  baseline: "", dailyActivity: "", measureMethod: "journal", habitTrigger: "",
  targetCredential: "", currentLevel: "beginner", studyHours: "3", learningMethod: "combination", examDate: "",
};

interface TestResult { letter: string; label: string; covered: boolean | null; fix?: string; }

// ─── SMARTER fields ───────────────────────────────────────────────

const SMARTER_FIELDS: SmarterField[] = [
  {
    key: "specificDetails", letter: "S", label: "Specific", minWords: 8,
    placeholder: "Who exactly? What activity? Where? How many? How often?",
    suggestion: "Name the exact action, who, where, and frequency. E.g., '5 parents from Barangay X via personal invitations after Sunday service, twice a week.'"
  },
  {
    key: "measurableCriteria", letter: "M", label: "Measurable", minWords: 6,
    placeholder: "How many? By what % or amount? How will you track it weekly?",
    suggestion: "A specific number + your tracking method. E.g., '5 enrollments, logged every Monday in the action planner.'"
  },
  {
    key: "achievableResources", letter: "A", label: "Attainable", minWords: 6,
    placeholder: "What time, skills, network, tools, or budget do you have available?",
    suggestion: "List your real assets. E.g., '3 hrs/day, 20-parent network, WhatsApp follow-ups, accountability partner Josie.'"
  },
  {
    key: "relevantAlignment", letter: "R", label: "Risk", minWords: 8,
    placeholder: "What's your starting point? Why is this target new territory — beyond what you've done before?",
    suggestion: "State your baseline + why the target stretches you. Risk = comfort-zone challenge, not danger. E.g., 'I've never earned over ₱5k/month — ₱10k is new territory for me.' Or: 'I weigh 150 lbs — 145 lbs is my first-ever fitness commitment.' If you've done it before at this level, raise the target."
  },
  {
    key: "endDate", letter: "T", label: "Time-bound", minWords: 4,
    placeholder: "Specific deadline — date, week number, or month (e.g., Week 10 · April 12, 2026)",
    suggestion: "Hard deadlines create urgency — goals without them drift. E.g., 'Week 10 — April 12, 2026. Weekly check-in every Sunday.'"
  },
  {
    key: "excitingMotivation", letter: "E", label: "Exciting", minWords: 10,
    placeholder: "What emotion does this goal stir in you? Whose face do you picture when you imagine achieving it?",
    suggestion: "Go deep — describe your emotional WHY, not just the practical reason. What does achieving this prove? Who does it make you? Emotional pegs: identity · family · legacy · freedom · love · pride · joy · courage. E.g., 'Showing my children that courage wins fires me up every morning — this is the version of myself I've always believed I could become.'"
  },
  {
    key: "rewardingBenefits", letter: "R", label: "Rewarding", minWords: 10,
    placeholder: "What will you HAVE (tangible) + how will you FEEL (emotional) when you achieve this?",
    suggestion: "Name both dimensions: the concrete reward AND the feeling it gives you. Emotional pegs: pride · gratitude · freedom · joy · peace · accomplishment · recognition. E.g., 'I'll earn my performance bonus and treat my family to a celebration dinner — and feel the deep pride of knowing I kept my word.'"
  },
];

// ─── Generation helpers ───────────────────────────────────────────

function generateGoalStatement(draft: Record<string, string>): string {
  const s = draft.specificDetails?.trim();
  const m = draft.measurableCriteria?.trim();
  const a = draft.achievableResources?.trim();
  const r = draft.relevantAlignment?.trim();
  const t = draft.endDate?.trim();
  const e = draft.excitingMotivation?.trim();
  const rw = draft.rewardingBenefits?.trim();
  const parts: string[] = [];
  let core = "I will " + (s ? s.replace(/^I will\s+/i, "").replace(/\.$/, "") : "[specific goal]");
  if (m) core += `, achieving ${m.replace(/\.$/, "")}`;
  if (t) core += ` by ${t.replace(/\.$/, "")}`;
  parts.push(core + ".");
  if (a) parts.push(`To do this, I will use ${a.replace(/\.$/, "")}.`);
  if (r) parts.push(`This matters because ${r.charAt(0).toLowerCase() + r.slice(1).replace(/\.$/, "")}.`);
  if (e && rw) parts.push(`I am driven by ${e.replace(/\.$/, "")}, and my reward is ${rw.replace(/\.$/, "")}.`);
  else if (e) parts.push(`I am driven by ${e.replace(/\.$/, "")}.`);
  else if (rw) parts.push(`My reward is ${rw.replace(/\.$/, "")}.`);
  return parts.join(" ");
}

// Per-field quality check — runs live in both edit AND view mode
// Uses fieldKey (not letter) so both "R" fields have separate logic
function checkSmarterFieldQuality(fieldKey: string, value: string): string | null {
  const val = value.trim();
  if (!val) return null;
  const words = val.split(/\s+/);

  switch (fieldKey) {
    case "specificDetails": {
      if (words.length < 8) return "Too vague — name exactly what you'll do, who you'll do it with, where, and how often.";
      if (!/\d/.test(val) && !/every|daily|weekly|each|per|twice|once|\dx|times?/i.test(val))
        return "Add a quantity or frequency (e.g., '5 contacts', 'twice a week') to make it concrete.";
      return null;
    }
    case "measurableCriteria": {
      if (!/\d+/.test(val)) return "No number found — add a specific metric (e.g., 5 enrollments, 10%, ₱10,000).";
      if (!/log|track|journal|planner|sheet|record|measure|count|note|monitor|app|checklist/i.test(val))
        return "Add your tracking method (e.g., 'logged in the action planner', 'tracked in a spreadsheet').";
      return null;
    }
    case "achievableResources": {
      if (words.length < 6) return "List your actual resources or capacity (time, contacts, tools, skills).";
      if (!/hour|hr|min|day|week|contact|network|budget|tool|app|phone|skill|experience|knowledge|support|partner|team|money|fund/i.test(val))
        return "Name specific resources: hours per day, people who can help, tools you have, or budget available.";
      return null;
    }
    case "endDate": {
      if (!/\d{4}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|week\s*\d+|month\s*\d+|january|february|march|april|june|july|august|september|october|november|december/i.test(val))
        return "No deadline detected — add a specific date, week number, or month.";
      if (/soon|someday|this year|next year|eventually|later|one day/i.test(val))
        return "Too vague — name the exact date or week number.";
      return null;
    }
    case "relevantAlignment": {
      // Risk = comfort-zone challenge, not physical danger
      const v = val.toLowerCase();
      if (/\b(maintain|keep|stay at|stay the same|same as before|at least the same|continue|no change|as usual|as always)\b/i.test(v))
        return "This sounds like maintaining the status quo, not a stretch. Risk = going beyond what you've done before. Raise the target or describe what makes it new territory.";
      const stretchSignals = [
        /first time/i,
        /never (done|earned|reached|achieved|had|completed|tried|made|gotten|been|gone|hit|passed|crossed)/i,
        /haven['']?t (done|earned|reached|achieved|had|completed|tried|made|gotten|been|gone|hit|passed|crossed)/i,
        /hasn['']?t (done|earned|reached|achieved)/i,
        /beyond (my|the)/i, /out of (my )?comfort/i,
        /new (territory|level|record|high|ground)/i,
        /push(ing)? (myself|beyond|past|through)/i,
        /\bdouble\b|\btriple\b/i,
        /from\s+\d[\d,.]*/i,
        /increase (from|by)/i, /exceed(ing)? (my|past|previous|prior)/i,
        /surpass(ing)?/i, /stretch/i, /comfort zone/i, /never before/i,
        /highest (ever|so far|in my)/i,
      ];
      if (!stretchSignals.some((r) => r.test(v)))
        return "Describe your baseline and why the target is new territory. Risk = going beyond what you've done before. E.g., 'I've never earned over ₱5k — targeting ₱10k pushes me past my comfort zone.'";
      return null;
    }
    case "excitingMotivation": {
      if (words.length < 10) return "Too short — describe specifically what emotionally drives you. Whose face do you picture? What feeling does achieving this give you?";
      const emotional = /love|dream|pride|joy|family|legacy|freedom|courage|identity|belong|prove|believe|passion|inspir|transform|worthy|strong|proud|hope|future|children|kids|husband|wife|parent|mother|father|life|become|always wanted|fire|excit|heart|soul|mean|purpose|why/i;
      const utilitarian = /\b(need|require|must|have to|should|important|necessary)\b/i;
      if (!emotional.test(val)) {
        if (utilitarian.test(val))
          return "This sounds like a practical need, not an emotional drive. Go deeper: what does achieving this MEAN to you? Who does it make you? Emotional pegs: identity · family · legacy · freedom · love · pride · courage.";
        return "Add the emotional dimension. Why does this fire you up at a deeper level? Emotional pegs: identity · family · legacy · freedom · love · pride · courage · joy.";
      }
      return null;
    }
    case "rewardingBenefits": {
      if (words.length < 10) return "Too short — describe both: what you'll HAVE (tangible) AND how you'll FEEL (emotional reward).";
      const tangible = /earn|buy|purchase|achieve|receive|get|have|own|complete|finish|reach|bonus|certificate|award|money|income|salary|prize|treat|celebrat|gift|vacation|trip|reward/i;
      const emotional = /feel|proud|grateful|free|peace|joy|happy|accomplish|worthy|satisf|recogni|trusted|celebrat|transform|whole|confident|relief|bless/i;
      if (!tangible.test(val) && !emotional.test(val))
        return "Describe both the concrete reward (what you'll earn/have/achieve) AND the emotional payoff (how you'll feel).";
      if (!emotional.test(val))
        return "Add the emotional reward — how will you feel when you achieve this? Emotional pegs: pride · gratitude · freedom · joy · peace · accomplishment · recognition.";
      if (!tangible.test(val))
        return "Add a concrete, tangible reward. What specifically will you earn, buy, achieve, or receive?";
      return null;
    }
    default:
      return null;
  }
}

function testStatement(statement: string, draft: Record<string, string>): TestResult[] {
  const stmt = statement.toLowerCase();
  const hasNumber = /\d+/.test(stmt);
  const hasDate = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december|\d{4}|week\s*\d+|month\s*\d+)\b/i.test(stmt);

  const FIXES: Record<string, { pass: () => boolean; fix: string }> = {
    specificDetails: {
      pass: () => hasNumber || stmt.split(/\s+/).length >= 12,
      fix: "Add the exact number and method — e.g., \"...enroll 3 clients through personal referrals, 5 conversations/week.\"",
    },
    measurableCriteria: {
      pass: () => hasNumber,
      fix: "Add a specific number — e.g., \"...at least 5 clients\" or \"...₱15,000 per month\" or \"...by Week 8.\"",
    },
    achievableResources: {
      pass: () => /will|through|by |via |with |using |enroll|contact|call|reach|study|practice|work|build/i.test(stmt),
      fix: "Mention your method or approach — e.g., \"...through daily outreach via WhatsApp\" or \"...by practicing 4×/week.\"",
    },
    relevantAlignment: {
      pass: () => /first time|never (done|earned|reached|achieved|before)|haven'?t|beyond (my|the)|out of (my )?comfort|new (level|record|territory|high)|push(ing)? (myself|beyond)|double|triple|from \d|increase from|exceed(ing)? (my|past)|surpass|stretch|comfort zone/i.test(stmt),
      fix: "Show the stretch — e.g., \"...pushing beyond what I've done before\" or \"...for the first time in my life\" or \"...doubling my previous record.\"",
    },
    endDate: {
      pass: () => hasDate,
      fix: "Add a hard deadline — e.g., \"...by June 19, 2026\" or \"...by Week 8 of LEAP 99.\"",
    },
    excitingMotivation: {
      pass: () => /love|excit|passion|driven|proud|joy|dream|inspir|transform|becom|freedom|courage|legacy|family|father|mother|children|kids|husband|wife|heart|soul|purpose|always wanted|believe|worthy|fire/i.test(stmt),
      fix: "Add your emotional WHY — e.g., \"...driven by love for my family\" or \"...because I believe in who I'm becoming\" or \"...to prove to myself that I can.\"",
    },
    rewardingBenefits: {
      pass: () => /reward|earn|achiev|bonus|certif|success|win|reach|accomplish|grow|transform|celebrat|treat|gift|prize/i.test(stmt)
        && /feel|proud|grateful|free|peace|joy|satisf|worthy|recogni|whole|confident|relief/i.test(stmt),
      fix: "Add both the tangible reward AND how you'll feel — e.g., \"...earning my first ₱10k and feeling the pride of keeping my word.\"",
    },
  };

  return SMARTER_FIELDS.map((f) => {
    const val = (draft[f.key as string] || "").trim();
    if (!val) return { letter: f.letter, label: f.label, covered: null };
    const entry = FIXES[f.key as string];
    if (!entry) return { letter: f.letter, label: f.label, covered: true };
    const covered = entry.pass();
    return { letter: f.letter, label: f.label, covered, fix: covered ? undefined : entry.fix };
  });
}

function generateMilestones(goal: GoalData, q: MilestoneQuestions): { weekNumber: number; description: string }[] {
  const hoursPerDay = parseFloat(q.hoursPerDay) || 2;
  const daysPerWeek = parseInt(q.daysPerWeek) || 5;
  const weeklyHours = hoursPerDay * daysPerWeek;
  const startPct = parseInt(q.startingPct) || 0;
  const remaining = 100 - startPct;
  const progressPerWeek = remaining / 10;
  const goalType = goal.goalType;

  const busySet = new Set(
    (q.busyWeeks || "").split(",").map((w) => parseInt(w.trim())).filter((n) => !isNaN(n))
  );

  function weekPct(week: number) {
    return Math.min(100, Math.round(startPct + progressPerWeek * (week - 1)));
  }

  function w1(type: string): string {
    if (type === "enrollment") {
      const flex = parseInt(q.flexTarget || "0");
      const alc = parseInt(q.alcTarget || "0");
      const leap = parseInt(q.leapTarget || "0");
      const totalStr = (flex + alc + leap) > 0 ? `${flex + alc + leap}` : (q.enrollTarget || "?");
      const breakdown = (flex + alc + leap) > 0
        ? `FLEX: ${flex} · ALC: ${alc} · LEAP: ${leap} (total ${totalStr})`
        : (q.enrollTarget ? `Total target: ${q.enrollTarget}` : "set program targets");
      const list = q.prospectCount ? `${q.prospectCount}-name prospect list` : "prospect list";
      const daily = q.contactsPerDay ? `${q.contactsPerDay} contacts/day` : "daily contacts";
      const seminars = q.seminarDates ? `Seminar schedule: ${q.seminarDates}. ` : "";
      return `ACTION PLAN: Set program targets — ${breakdown}. Compile your ${list} by program (FLEX/ALC/LEAP). ${seminars}Set up a 3-column tracking sheet (FLEX · ALC · LEAP). Prepare conversation guides per program. Schedule ${daily} on your calendar. Confirm accountability partner (${q.accountabilityPartner || "TBD"}). Set your ${q.reviewDay || "Sunday"} weekly review.`;
    }
    if (type === "personal") {
      return `ACTION PLAN: Record your baseline — ${q.baseline || "current measurement"}. Set up your ${q.measureMethod || "tracking"} system. Schedule your daily ${q.dailyActivity || "practice"} (${q.hoursPerDay}h × ${q.daysPerWeek} days/week). Build your habit stack: ${q.habitTrigger || "identify your trigger"}. Tell your accountability partner (${q.accountabilityPartner || "TBD"}) your commitment. Set your ${q.reviewDay || "Sunday"} weekly check-in.`;
    }
    return `ACTION PLAN: Gather all ${q.learningMethod || "learning"} resources for ${q.targetCredential || "your target credential"}. Create your ${q.studyHours || weeklyHours}hr/week study schedule. Set up your practice environment. Find your mentor or study partner. Confirm accountability with ${q.accountabilityPartner || "TBD"}. Set your ${q.reviewDay || "Sunday"} weekly review.${q.examDate ? ` Exam/assessment date: ${q.examDate}.` : ""}`;
  }

  function wProgress(week: number, type: string): string {
    const pct = weekPct(week);
    const busy = busySet.has(week) ? " ⚠️ Noted: busy week — adjust targets if needed." : "";
    if (type === "enrollment") {
      const flex = parseInt(q.flexTarget || "0");
      const alc = parseInt(q.alcTarget || "0");
      const leap = parseInt(q.leapTarget || "0");
      const programTotal = flex + alc + leap;
      const useBreakdown = programTotal > 0;
      const flexW = useBreakdown ? Math.ceil((flex * pct) / 100) : null;
      const alcW = useBreakdown ? Math.ceil((alc * pct) / 100) : null;
      const leapW = useBreakdown ? Math.ceil((leap * pct) / 100) : null;
      const totalW = useBreakdown ? Math.ceil((programTotal * pct) / 100) : (q.enrollTarget ? Math.ceil((parseInt(q.enrollTarget) * pct) / 100) : null);
      const breakdown = useBreakdown
        ? `FLEX: ${flexW} · ALC: ${alcW} · LEAP: ${leapW} (total ${totalW})`
        : (totalW ? `${totalW} enrollments` : "");
      const contacts = parseInt(q.contactsPerDay || "5") * daysPerWeek;
      const conv = parseInt(q.conversionRatio || "5");
      const needed = Math.ceil(contacts / conv);
      const seminars = q.seminarDates ? ` Upcoming seminars: ${q.seminarDates}.` : "";
      return `TARGET ${pct}%${breakdown ? ` (${breakdown})` : ""}: Reach out to ${contacts} prospects via ${q.channel || "outreach"}. Aim for ${needed} new enrollments.${seminars} Follow up on previous leads. Update FLEX/ALC/LEAP tracker daily.${busy}`;
    }
    if (type === "personal") {
      return `TARGET ${pct}%: Complete all ${daysPerWeek} sessions of ${q.dailyActivity || "your practice"} (${hoursPerDay}h each). Log in ${q.measureMethod || "your tracker"}. Compare to baseline${q.baseline ? ` (${q.baseline})` : ""}. Identify what's working and what to adjust.${busy}`;
    }
    return `TARGET ${pct}%: Complete ${weeklyHours} hours of ${q.learningMethod || "study/practice"} toward ${q.targetCredential || "your goal"}. Review previous week's progress. Practice key concepts. Log learnings.${busy}`;
  }

  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    let description = "";
    if (week === 1) description = w1(goalType);
    else if (week <= 11) description = wProgress(week, goalType);
    else description = `CELEBRATE 🎉: Review your 12-week journey. Document key wins and lessons. Share your achievement with ${q.accountabilityPartner || "your coach"}. Plan your next goal.`;
    return { weekNumber: week, description };
  });
}

function getWeekTarget(n: number): string {
  if (n === 1) return "Action Plan";
  if (n >= 2 && n <= 10) return `${(n - 1) * 10}–${n * 10}%`;
  if (n === 11) return "100%";
  if (n === 12) return "Enjoy";
  return "";
}

// ─── Alignment helpers ────────────────────────────────────────────

function alignKw(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
}

function computeDeclarationAlignment(
  declaration: string | null,
  goalStatement: string,
  smarter: Record<string, string>
): { score: number; missedTerms: string[] } {
  if (!declaration?.trim()) return { score: 100, missedTerms: [] };
  const combined = [goalStatement, ...Object.values(smarter)].join(" ").toLowerCase();

  const segments = declaration.split(",").map((s) => s.trim()).filter(Boolean);
  const isValueList = segments.length >= 2 && segments.every((s) => s.split(" ").length <= 4);

  if (isValueList) {
    const missed: string[] = [];
    let hits = 0;
    for (const val of segments) {
      const kw = alignKw(val);
      if (!kw.length || kw.some((k) => combined.includes(k))) hits++;
      else missed.push(val);
    }
    return { score: segments.length > 0 ? Math.round((hits / segments.length) * 100) : 100, missedTerms: missed };
  }

  const keywords = [...new Set(alignKw(declaration).filter((w) => w.length > 5))];
  if (!keywords.length) return { score: 100, missedTerms: [] };
  const missed = keywords.filter((k) => !combined.includes(k));
  return {
    score: Math.round(((keywords.length - missed.length) / keywords.length) * 100),
    missedTerms: missed.slice(0, 4),
  };
}

function milestoneAligned(goalStatement: string, milestoneDesc: string): boolean {
  const kw = alignKw(goalStatement);
  if (!kw.length || !milestoneDesc.trim()) return true;
  return kw.filter((k) => milestoneDesc.toLowerCase().includes(k)).length / kw.length >= 0.12;
}

function actionAligned(milestoneDesc: string, actionText: string): boolean {
  const kw = alignKw(milestoneDesc);
  if (!kw.length || !actionText.trim()) return true;
  return kw.filter((k) => actionText.toLowerCase().includes(k)).length / kw.length >= 0.05;
}

// ─── Sub-components ───────────────────────────────────────────────

function ColHeader({ step, title, badge }: { step: string; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{step}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground">{title}</span>
      {badge}
    </div>
  );
}

function Collapsible({
  title, badge, action, children, defaultOpen = false, accent = false, icon,
}: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode;
  children: React.ReactNode; defaultOpen?: boolean; accent?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`bg-card rounded-xl border overflow-hidden ${accent ? "border-primary/30" : "border-border"}`}>
      <div
        className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none border-b border-border ${accent ? "bg-primary/5" : ""} ${!open ? "border-b-0" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
        {icon && <span className="shrink-0">{icon}</span>}
        <span className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-primary" : "text-muted-foreground"}`}>{title}</span>
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {badge}
          {action}
        </div>
      </div>
      {open && children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export function ActionPlannerTab({ studentId, readOnly }: { studentId: string; readOnly?: boolean }) {
  const { selectedGoalType, user } = useNavigation();
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [studentDeclaration, setStudentDeclaration] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<string>(selectedGoalType);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [totalWeeks, setTotalWeeks] = useState<number>(12);
  const [batchStartDate, setBatchStartDate] = useState<string>("2026-02-02");
  const [loading, setLoading] = useState(true);
  const [savingWeek, setSavingWeek] = useState<number | null>(null);

  // Declaration AI fit
  const [declFitResult, setDeclFitResult] = useState<DeclarationFitResult | null>(null);
  const [declFitLoading, setDeclFitLoading] = useState(false);
  const [declFitError, setDeclFitError] = useState<string | null>(null);

  // Column 1: SMARTER
  const [smarterOpen, setSmarterOpen] = useState(false);
  const [editingSmarter, setEditingSmarter] = useState(false);
  const [smarterDraft, setSmarterDraft] = useState<Record<string, string>>({});
  const [savingSmarter, setSavingSmarter] = useState(false);
  const [statementDraft, setStatementDraft] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [savingToGoal, setSavingToGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const [valuesDraft, setValuesDraft] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  // AI Improve per-field
  type AiImproveState = { loading: boolean; improved: string; explanation: string } | null;
  const [aiImprove, setAiImprove] = useState<Record<string, AiImproveState>>({});

  // Per-field assess result: undefined = not yet assessed, null = passed, string = issue
  const [fieldAssess, setFieldAssess] = useState<Record<string, string | null | undefined>>({});

  // Column 2: Milestones
  const [showQuestions, setShowQuestions] = useState(true);
  const [questions, setQuestions] = useState<MilestoneQuestions>(DEFAULT_QUESTIONS);
  const [milestonePreview, setMilestonePreview] = useState<{ weekNumber: number; description: string }[] | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [milestoneDrafts, setMilestoneDrafts] = useState<Record<number, string>>({});
  const [editingMilestoneWeek, setEditingMilestoneWeek] = useState<number | null>(null);

  // Column 3: Actions
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [showWeekPicker, setShowWeekPicker] = useState(false);
  const [actionDrafts, setActionDrafts] = useState<
    Record<number, { description: string; actions: CheckItem[]; results: CheckItem[] }>
  >({});

  // Calendar + Retrieve + Upgrade
  const [calendarView, setCalendarView] = useState(false);
  const [calendarExpanded, setCalendarExpanded] = useState(false);
  const [retrieving, setRetrieving] = useState(false);
  const [retrievedStats, setRetrievedStats] = useState<{
    actionsPct: number; milestonePct: number; misaligned: boolean;
    enrollmentResults: number; personalResults: number; professionalResults: number;
  } | null>(null);
  const [upgradeAnalyzing, setUpgradeAnalyzing] = useState(false);
  const [upgradeData, setUpgradeData] = useState<{ misalignmentSummary: string } | null>(null);
  const [upgradeFields, setUpgradeFields] = useState<ApprovalField[]>([]);
  const [applyingUpgrade, setApplyingUpgrade] = useState(false);

  const [showWheelModal, setShowWheelModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [wheelScores, setWheelScores] = useState<Record<string, number> | undefined>(undefined);
  const [studentName, setStudentName] = useState<string>("");

  const canEdit =
    !readOnly &&
    (user.role === "coach" || user.role === "head_coach" ||
    (user.role === "student" && user.userId === studentId) ||
    (user.role === "council_leader" && user.userId === studentId));

  const load = useCallback(async () => {
    try {
      const [data, week, alignment, batchInfo, detail] = await Promise.all([
        getStudentGoals(studentId),
        getBatchCurrentWeek(),
        getStudentAlignment(studentId),
        getBatchWeekInfo(),
        getStudentDetail(studentId),
      ]);
      setGoals(data as GoalData[]);
      setCurrentWeek(week);
      setSelectedWeek(week);
      setBatchStartDate(batchInfo.batchStartDate);
      setStudentDeclaration(alignment.declaration);
      if (detail?.name) setStudentName(detail.name);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    setActiveGoal(selectedGoalType);
    setEditingSmarter(false); setTestResults(null);
    setEditingGoal(false); setShowQuestions(false); setMilestonePreview(null);
    setStatementDraft(""); setDeclFitResult(null); setDeclFitError(null);
  }, [selectedGoalType]);

  useEffect(() => {
    if (!statementDraft) {
      const goal = goals.find((g) => g.goalType === activeGoal);
      if (goal?.goalStatement) setStatementDraft(goal.goalStatement);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, activeGoal]);

  const currentGoal = goals.find((g) => g.goalType === activeGoal);

  // ── C1: SMARTER ──────────────────────────────────────────────

  function startEditSmarter() {
    if (!currentGoal) return;
    const d: Record<string, string> = {};
    for (const f of SMARTER_FIELDS) d[f.key as string] = (currentGoal[f.key] as string | null) || "";
    setSmarterDraft(d); setEditingSmarter(true); setShowBuilder(false); setTestResults(null); setSmarterOpen(true); setFieldAssess({});
  }

  async function saveSmarter() {
    if (!currentGoal) return;
    setSavingSmarter(true);
    try {
      await updateGoal(currentGoal.id, {
        specificDetails: smarterDraft.specificDetails || undefined,
        measurableCriteria: smarterDraft.measurableCriteria || undefined,
        achievableResources: smarterDraft.achievableResources || undefined,
        relevantAlignment: smarterDraft.relevantAlignment || undefined,
        endDate: smarterDraft.endDate || undefined,
        excitingMotivation: smarterDraft.excitingMotivation || undefined,
        rewardingBenefits: smarterDraft.rewardingBenefits || undefined,
      });
      setEditingSmarter(false); await load();
    } catch (e) { console.error(e); } finally { setSavingSmarter(false); }
  }

  async function handleAiImprove(fieldKey: string, fieldLabel: string, issue: string, currentValue: string) {
    const scan = scanFields({ currentValue, goalStatement: currentGoal?.goalStatement, declaration: studentDeclaration });
    if (!scan.clean) {
      const ok = window.confirm(`⚠️ Privacy Check\n\nFields may contain: ${scan.warnings.join(", ")}.\n\nThey will be redacted before reaching the AI.\n\nContinue?`);
      if (!ok) return;
    }
    setAiImprove((p) => ({ ...p, [fieldKey]: { loading: true, improved: "", explanation: "" } }));
    try {
      const result = await improveSmarterField(
        fieldKey, fieldLabel, issue, currentValue,
        activeGoal, studentDeclaration, currentGoal?.goalStatement || null
      );
      setAiImprove((p) => ({ ...p, [fieldKey]: { loading: false, ...result } }));
    } catch {
      setAiImprove((p) => ({ ...p, [fieldKey]: null }));
    }
  }

  function handleGenerate() {
    const saved: Record<string, string> = {};
    for (const f of SMARTER_FIELDS) saved[f.key as string] = (currentGoal?.[f.key] as string | null) || "";
    setStatementDraft(generateGoalStatement(editingSmarter ? smarterDraft : saved));
    setTestResults(null);
  }

  async function copyToGoalStatement() {
    if (!currentGoal || !statementDraft.trim()) return;
    setSavingToGoal(true);
    try {
      await updateGoal(currentGoal.id, { goalStatement: statementDraft.trim() });
      setShowBuilder(false); setEditingSmarter(false); setTestResults(null); await load();
    } catch (e) { console.error(e); } finally { setSavingToGoal(false); }
  }

  async function saveGoalStatement() {
    if (!currentGoal || !goalDraft.trim()) return;
    setSavingGoal(true);
    try {
      await updateGoal(currentGoal.id, {
        goalStatement: goalDraft.trim(),
        valuesDeclaration: valuesDraft.trim() || undefined,
      });
      setEditingGoal(false); await load();
    } catch (e) { console.error(e); } finally { setSavingGoal(false); }
  }

  // ── C2: Milestones ────────────────────────────────────────────

  function handleGenerateMilestones() {
    if (!currentGoal) return;
    setMilestonePreview(generateMilestones(currentGoal, questions));
    setShowQuestions(false);
  }

  async function exportMilestones(list?: { weekNumber: number; description: string }[]) {
    const toExport = list ?? milestonePreview;
    if (!currentGoal || !toExport) return;
    setSavingMilestones(true);
    try {
      await Promise.all(
        toExport.map((m) => updateMilestone(currentGoal.id, m.weekNumber, { milestoneDescription: m.description }))
      );
      setMilestonePreview(null); await load();
    } catch (e) { console.error(e); } finally { setSavingMilestones(false); }
  }

  async function generateAndExport() {
    if (!currentGoal) return;
    const generated = generateMilestones(currentGoal, questions);
    await exportMilestones(generated);
  }

  async function exportSavedMilestones() {
    if (!currentGoal) return;
    const toExport = currentGoal.milestones
      .filter((m) => m.milestoneDescription)
      .map((m) => ({ weekNumber: m.weekNumber, description: m.milestoneDescription! }));
    if (!toExport.length) return;
    await exportMilestones(toExport);
  }

  async function saveMilestoneDescription(week: number) {
    if (!currentGoal) return;
    const desc = milestoneDrafts[week];
    if (desc === undefined) return;
    try {
      await updateMilestone(currentGoal.id, week, { milestoneDescription: desc });
      setEditingMilestoneWeek(null); await load();
    } catch (e) { console.error(e); }
  }

  // ── C3: Actions ───────────────────────────────────────────────

  function initActionDraft(week: number) {
    if (actionDrafts[week]) return;
    const milestone = currentGoal?.milestones.find((m) => m.weekNumber === week);
    setActionDrafts((prev) => ({
      ...prev,
      [week]: {
        description: milestone?.milestoneDescription || "",
        actions: milestone?.actions ? JSON.parse(milestone.actions) : [],
        results: milestone?.results ? JSON.parse(milestone.results) : [],
      },
    }));
  }

  useEffect(() => {
    if (currentGoal) initActionDraft(selectedWeek);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek, currentGoal]);

  function updateActionDraft(week: number, field: string, value: string | CheckItem[]) {
    setActionDrafts((prev) => ({ ...prev, [week]: { ...prev[week], [field]: value } }));
  }

  function addActionItem(field: "actions" | "results") {
    const d = actionDrafts[selectedWeek];
    if (!d) return;
    updateActionDraft(selectedWeek, field, [...d[field], { text: "", done: false }]);
  }

  function updateActionText(field: "actions" | "results", index: number, text: string) {
    const d = actionDrafts[selectedWeek];
    if (!d) return;
    updateActionDraft(selectedWeek, field, d[field].map((item, i) => i === index ? { ...item, text } : item));
  }

  function updateActionDays(index: number, days: number[]) {
    const d = actionDrafts[selectedWeek];
    if (!d) return;
    updateActionDraft(selectedWeek, "actions", d.actions.map((item, i) => i === index ? { ...item, days } : item));
  }

  function removeActionItem(field: "actions" | "results", index: number) {
    const d = actionDrafts[selectedWeek];
    if (!d) return;
    updateActionDraft(selectedWeek, field, d[field].filter((_, i) => i !== index));
  }

  async function saveActions() {
    if (!currentGoal || !actionDrafts[selectedWeek]) return;
    const d = actionDrafts[selectedWeek];
    // Mandatory day validation
    const missingDays = d.actions.filter((a) => a.text.trim() !== "" && (!a.days || a.days.length === 0));
    if (missingDays.length > 0) {
      alert(`Please assign at least one day for ${missingDays.length === 1 ? "1 action step" : `${missingDays.length} action steps`} before saving.`);
      return;
    }
    setSavingWeek(selectedWeek);
    try {
      const cleanActions = d.actions.filter((a) => a.text.trim() !== "");
      const cleanResults = d.results.filter((r) => r.text.trim() !== "");
      await updateMilestone(currentGoal.id, selectedWeek, {
        milestoneDescription: d.description,
        actions: JSON.stringify(cleanActions),
        results: JSON.stringify(cleanResults),
      });
      await load();
      setActionDrafts((prev) => ({ ...prev, [selectedWeek]: { ...prev[selectedWeek], actions: cleanActions, results: cleanResults } }));
    } catch (e) { console.error(e); } finally { setSavingWeek(null); }
  }

  // ── Retrieve + Upgrade ────────────────────────────────────────

  async function retrieveCurrentData() {
    if (!currentGoal) return;
    setRetrieving(true);
    try {
      const [detail] = await Promise.all([getStudentDetail(studentId), load()]);
      const weekMil = currentGoal.milestones.find((m) => m.weekNumber === currentWeek);
      const actions: CheckItem[] = (() => { try { return JSON.parse(weekMil?.actions || "[]"); } catch { return []; } })();
      const doneCount = actions.filter((a) => a.done).length;
      const actionsPct = actions.length > 0 ? Math.round((doneCount / actions.length) * 100) : 0;
      const resultsPct = activeGoal === "enrollment"
        ? detail?.enrollmentResults ?? 0
        : activeGoal === "personal" ? detail?.personalResults ?? 0
        : detail?.professionalResults ?? 0;
      const targetPct = weekMil?.cumulativePercentage ?? 0;
      const misaligned = actionsPct >= 100 && resultsPct < targetPct;
      setRetrievedStats({
        actionsPct,
        milestonePct: resultsPct,
        misaligned,
        enrollmentResults: detail?.enrollmentResults ?? 0,
        personalResults: detail?.personalResults ?? 0,
        professionalResults: detail?.professionalResults ?? 0,
      });
    } catch (e) { console.error(e); } finally { setRetrieving(false); }
  }

  async function analyzeUpgrade() {
    if (!currentGoal) return;
    const weekMilScan = currentGoal.milestones.find((m) => m.weekNumber === currentWeek);
    const actionsScan: CheckItem[] = (() => { try { return JSON.parse(weekMilScan?.actions || "[]"); } catch { return []; } })();
    const scan = scanFields({
      goalStatement: currentGoal.goalStatement,
      milestone: weekMilScan?.milestoneDescription,
      actions: actionsScan.map((a) => a.text).join(" "),
    });
    if (!scan.clean) {
      const ok = window.confirm(`⚠️ Privacy Check\n\nFields may contain: ${scan.warnings.join(", ")}.\n\nThey will be redacted before reaching the AI.\n\nContinue?`);
      if (!ok) return;
    }
    setUpgradeAnalyzing(true);
    setUpgradeData(null);
    setUpgradeFields([]);
    try {
      const weekMil = weekMilScan;
      const actions: CheckItem[] = actionsScan;
      const resp = await fetch("/api/upgrade/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: currentGoal.id,
          goalType: activeGoal,
          goalStatement: currentGoal.goalStatement,
          currentWeek,
          weekMilestone: weekMil?.milestoneDescription ?? "",
          currentActions: actions.map((a) => a.text),
          actionStepsPct: retrievedStats?.actionsPct ?? 100,
          milestonePct: retrievedStats?.milestonePct ?? 0,
          targetPct: weekMil?.cumulativePercentage ?? 0,
        }),
      });
      const data = await resp.json();
      if (data.suggestions?.length) {
        setUpgradeData({ misalignmentSummary: data.misalignmentSummary });
        setUpgradeFields(data.suggestions.map((s: { field: string; oldStep: string; newStep: string }, i: number) => ({
          key: `step_${i}`,
          label: `Action Step ${i + 1}`,
          oldValue: s.oldStep || null,
          newValue: s.newStep,
          approved: false,
        })));
      }
    } catch (e) { console.error(e); } finally { setUpgradeAnalyzing(false); }
  }

  async function applyUpgrade() {
    if (!currentGoal || upgradeFields.length === 0) return;
    setApplyingUpgrade(true);
    try {
      const approved = upgradeFields.filter((f) => f.approved);
      await fetch("/api/upgrade/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: currentGoal.id,
          weekNumber: currentWeek,
          approvedSteps: approved.map((f) => f.newValue),
          upgradeReason: upgradeData?.misalignmentSummary ?? "Coach-approved upgrade",
        }),
      });
      // Apply new steps to the action draft
      const newActions = approved.map((f) => ({ text: f.newValue, done: false }));
      setActionDrafts((prev) => ({
        ...prev,
        [currentWeek]: { ...(prev[currentWeek] ?? { description: "", results: [] }), actions: newActions },
      }));
      setUpgradeFields([]);
      setUpgradeData(null);
      setRetrievedStats(null);
    } catch (e) { console.error(e); } finally { setApplyingUpgrade(false); }
  }

  // ── Template apply ────────────────────────────────────────────

  async function applyTemplate(template: GoalTemplate, answers: Record<string, string>) {
    setShowTemplateModal(false);
    // Build SMARTER draft from template
    const s = template.smarter(answers);
    const newSmarter: Record<string, string> = {
      specificDetails: s.specificDetails,
      measurableCriteria: s.measurableCriteria,
      achievableResources: s.achievableResources,
      relevantAlignment: s.relevantAlignment,
      endDate: s.endDate,
      excitingMotivation: s.excitingMotivation,
      rewardingBenefits: s.rewardingBenefits,
    };
    setSmarterDraft(newSmarter);
    setStatementDraft(generateGoalStatement(newSmarter));
    setEditingSmarter(true);
    setSmarterOpen(true);
    setShowBuilder(false);
    setTestResults(null);

    // Build milestone action drafts from template weeks
    const weeks = template.milestones(answers);
    const newDrafts: Record<number, { description: string; actions: CheckItem[]; results: CheckItem[] }> = {};
    for (const wk of weeks) {
      newDrafts[wk.weekNumber] = {
        description: wk.description,
        actions: wk.actions.map((a) => ({ text: a.text, done: false, days: a.days })),
        results: wk.results.map((r) => ({ text: r.text, done: false })),
      };
    }
    setActionDrafts(newDrafts);
    // Switch to the correct goal type tab
    setActiveGoal(template.goalType);

    // Persist template days to DB immediately so they survive page reload
    if (currentGoal) {
      try {
        await Promise.all(
          weeks.map((wk) =>
            updateMilestone(currentGoal.id, wk.weekNumber, {
              milestoneDescription: wk.description,
              actions: JSON.stringify(wk.actions.map((a) => ({ text: a.text, done: false, days: a.days }))),
              results: JSON.stringify(wk.results.map((r) => ({ text: r.text, done: false }))),
            })
          )
        );
        await load();
      } catch (e) { console.error("[applyTemplate] auto-save failed:", e); }
    }
  }

  // ── Render ────────────────────────────────────────────────────

  if (loading) return <div className="h-96 bg-muted animate-pulse rounded-xl" />;

  if (!currentGoal) return (
    <>
      {showWheelModal && (
        <WheelOfLifeModal
          studentId={studentId}
          studentName={studentName || "Student"}
          declaration={studentDeclaration}
          onComplete={async (scores, goalStatements) => {
            setWheelScores(scores);
            await saveWheelGoals(studentId, scores, goalStatements);
            setShowWheelModal(false);
            load();
          }}
          onClose={() => setShowWheelModal(false)}
        />
      )}
      {showTemplateModal && (
        <GoalTemplateModal
          goalType={activeGoal as "enrollment" | "personal" | "professional"}
          wheelScores={wheelScores}
          declarationText={studentDeclaration}
          onApply={applyTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
      {/* Goal type tabs so user can navigate to the right type */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {(["enrollment", "personal", "professional"] as const).map((type) => (
            <button key={type} onClick={() => setActiveGoal(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeGoal === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
          >
            ✨ Use a Template
          </button>
          <button
            onClick={() => setShowWheelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            🌀 Wheel of Life
          </button>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border p-12 text-center space-y-4">
        <p className="text-2xl">🎯</p>
        <p className="text-foreground font-semibold">No {activeGoal} goal set yet.</p>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Start from a template or use the Wheel of Life assessment to discover where to focus.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            ✨ Use a Template
          </button>
          {goals.length === 0 && (
            <button
              onClick={() => setShowWheelModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground text-sm font-semibold rounded-xl hover:bg-muted/80 transition-colors border border-border"
            >
              <span>🌀</span> Wheel of Life
            </button>
          )}
        </div>
      </div>
    </>
  );

  const values = currentGoal.valuesDeclaration?.split(",").map((v) => v.trim()).filter(Boolean) || [];
  const criteriaValues = SMARTER_FIELDS.map((f) => ({
    ...f,
    value: ((editingSmarter ? smarterDraft[f.key as string] : (currentGoal[f.key] as string | null)) || ""),
  }));
  const filled = criteriaValues.filter((c) => c.value.trim() !== "").length;
  const qualityPassed = criteriaValues.filter((c) => c.value.trim() !== "" && !checkSmarterFieldQuality(c.key as string, c.value)).length;
  const pct = Math.round((qualityPassed / 7) * 100);
  const barColor = activeGoal === "enrollment" ? "bg-blue-500" : activeGoal === "personal" ? "bg-yellow-400" : "bg-purple-500";
  const canGenerate = filled >= 2;

  const milestonesWithContent = currentGoal.milestones.filter((m) => m.milestoneDescription).length;
  const weekMilestone = currentGoal.milestones.find((m) => m.weekNumber === selectedWeek);
  const weekDraft = actionDrafts[selectedWeek];

  const passedTests = testResults?.filter((r) => r.covered === true).length ?? 0;
  const totalApplicable = testResults?.filter((r) => r.covered !== null).length ?? 0;

  const smarterForAlign: Record<string, string> = {};
  for (const f of SMARTER_FIELDS) smarterForAlign[f.key as string] = (currentGoal[f.key] as string | null) || "";
  const declarationAlignment = computeDeclarationAlignment(
    studentDeclaration,
    currentGoal.goalStatement,
    smarterForAlign
  );

  const milestonesAlignedCount = currentGoal.milestones.filter(
    (m) => m.milestoneDescription && milestoneAligned(currentGoal.goalStatement, m.milestoneDescription)
  ).length;

  // Count weeks that have at least one non-empty action saved
  const weekActionCounts: Record<number, number> = {};
  for (const m of currentGoal.milestones) {
    try {
      const acts: CheckItem[] = JSON.parse(m.actions || "[]");
      weekActionCounts[m.weekNumber] = acts.filter((a) => a.text.trim() !== "").length;
    } catch { weekActionCounts[m.weekNumber] = 0; }
  }
  const weeksWithActions = Object.values(weekActionCounts).filter((c) => c > 0).length;

  return (
    <div className="space-y-4">
      {/* Goal type tabs + top-right actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {(["enrollment", "personal", "professional"] as const).map((type) => (
            <button key={type} onClick={() => { setActiveGoal(type); setEditingSmarter(false); setShowBuilder(false); setTestResults(null); setEditingGoal(false); setShowQuestions(false); setRetrievedStats(null); setUpgradeData(null); setUpgradeFields([]); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${activeGoal === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
              title="Load a LEAP 99 goal template"
            >
              ✨ Use a Template
            </button>
          )}
          <button
            onClick={() => setShowWheelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border border-border hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Wheel of Life — re-assess and update goals"
          >
            🌀 Wheel of Life
          </button>
          <button
            onClick={retrieveCurrentData}
            disabled={retrieving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${retrieving ? "animate-spin" : ""}`} />
            {retrieving ? "Retrieving…" : "Retrieve Current Data"}
          </button>
        </div>
      </div>

      {/* Wheel of Life modal — available any time from header button */}
      {showWheelModal && (
        <WheelOfLifeModal
          studentId={studentId}
          studentName={studentName || "Student"}
          declaration={studentDeclaration}
          onComplete={async (scores, goalStatements) => {
            setWheelScores(scores);
            await saveWheelGoals(studentId, scores, goalStatements);
            setShowWheelModal(false);
            load();
          }}
          onClose={() => setShowWheelModal(false)}
        />
      )}
      {/* Template modal */}
      {showTemplateModal && (
        <GoalTemplateModal
          goalType={activeGoal as "enrollment" | "personal" | "professional"}
          wheelScores={wheelScores}
          declarationText={studentDeclaration}
          onApply={applyTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {/* Retrieved stats banner */}
      {retrievedStats && (
        <div className={`rounded-xl border p-4 space-y-3 ${retrievedStats.misaligned ? "bg-orange-500/5 border-orange-500/30" : "bg-emerald-500/5 border-emerald-500/20"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 ${retrievedStats.misaligned ? "text-orange-500" : "text-emerald-600"}`} />
              <span className="text-sm font-semibold">
                {retrievedStats.misaligned
                  ? "⚠️ Misalignment Detected — Actions done but milestone not met"
                  : "✓ Data Retrieved"}
              </span>
            </div>
            <button onClick={() => { setRetrievedStats(null); setUpgradeData(null); setUpgradeFields([]); }} className="text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-background/60 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Action Steps (W{currentWeek})</p>
              <p className={`text-xl font-bold ${retrievedStats.actionsPct >= 100 ? "text-emerald-600" : "text-foreground"}`}>{retrievedStats.actionsPct}%</p>
            </div>
            <div className="bg-background/60 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{activeGoal.charAt(0).toUpperCase() + activeGoal.slice(1)} Results</p>
              <p className={`text-xl font-bold ${retrievedStats.milestonePct >= 70 ? "text-emerald-600" : retrievedStats.milestonePct >= 40 ? "text-amber-500" : "text-red-500"}`}>{retrievedStats.milestonePct}%</p>
            </div>
            <div className="bg-background/60 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Gap</p>
              <p className="text-xl font-bold text-foreground">{Math.max(0, (currentGoal?.milestones.find((m) => m.weekNumber === currentWeek)?.cumulativePercentage ?? 0) - retrievedStats.milestonePct)}%</p>
            </div>
          </div>
          {retrievedStats.misaligned && !upgradeData && (
            <button
              onClick={analyzeUpgrade}
              disabled={upgradeAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Zap className={`h-4 w-4 ${upgradeAnalyzing ? "animate-pulse" : ""}`} />
              {upgradeAnalyzing ? "AI Analyzing Misalignment…" : "⚡ Generate Upgraded Action Steps"}
            </button>
          )}
          {upgradeData && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground italic">{upgradeData.misalignmentSummary}</p>
              <CheckboxApprovalPanel
                title="Upgraded Action Steps — Approve to apply"
                fields={upgradeFields}
                onChange={setUpgradeFields}
                onApply={() => applyUpgrade()}
                onReject={() => { setUpgradeFields([]); setUpgradeData(null); }}
              />
              {applyingUpgrade && <p className="text-xs text-primary text-center">Saving upgraded steps…</p>}
            </div>
          )}
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-start">

        {/* ════ COLUMN 1: Goal Foundation ════ */}
        <div className="space-y-3">
          <ColHeader step="1" title="Goal Foundation" badge={
            qualityPassed === 7
              ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">SMARTER ✓</span>
              : filled === 7
              ? <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"><AlertTriangle className="h-3 w-3" />{7 - qualityPassed} need improvement</span>
              : <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20"><AlertTriangle className="h-3 w-3" />{7 - filled} missing</span>
          } />

          {/* A: Draft goal statement */}
          <Collapsible
            title="A · Draft Goal Statement"
            action={canEdit && !editingGoal ? (
              <button onClick={() => { setGoalDraft(currentGoal.goalStatement); setValuesDraft(currentGoal.valuesDeclaration || ""); setEditingGoal(true); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="h-3 w-3" /> Edit
              </button>
            ) : undefined}
          >
            <div className="px-4 py-3 space-y-2.5">
              {editingGoal ? (
                <div className="space-y-2">
                  <textarea value={goalDraft} onChange={(e) => setGoalDraft(e.target.value)} rows={4} placeholder="Write your draft goal statement…" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1">Values (comma-separated)</label>
                    <input type="text" value={valuesDraft} onChange={(e) => setValuesDraft(e.target.value)} placeholder="e.g. Impact, Integrity, Growth, Service" className="w-full text-xs border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveGoalStatement} disabled={savingGoal || !goalDraft.trim()} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      <Check className="h-3 w-3" />{savingGoal ? "Saving…" : "Save Draft"}
                    </button>
                    <button onClick={() => setEditingGoal(false)} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {currentGoal.goalStatement
                    ? <p className="text-sm text-foreground leading-relaxed">{currentGoal.goalStatement}</p>
                    : <p className="text-xs text-muted-foreground italic">No goal statement yet — edit to add a draft.</p>
                  }
                  {values.length > 0 ? (
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Values</p>
                      <div className="flex flex-wrap gap-1">
                        {values.map((v) => (
                          <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{v}</span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No values set — edit to add your values.</p>
                  )}
                </>
              )}
            </div>
          </Collapsible>

          {/* B: Declaration Alignment */}
          <Collapsible
            title="B · Declaration Alignment"
            badge={studentDeclaration ? (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                declarationAlignment.score >= 70
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : declarationAlignment.score >= 40
                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                  : "bg-red-500/10 text-red-500 border border-red-500/20"
              }`}>{declarationAlignment.score}% aligned</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">No declaration</span>
            )}
            action={studentDeclaration && currentGoal.goalStatement ? (
              <button
                onClick={async () => {
                  const scan = scanFields({ goalStatement: currentGoal.goalStatement, declaration: studentDeclaration, values: currentGoal.valuesDeclaration });
                  if (!scan.clean) {
                    const ok = window.confirm(`⚠️ Privacy Check\n\nFields may contain: ${scan.warnings.join(", ")}.\n\nThey will be redacted before reaching the AI.\n\nContinue?`);
                    if (!ok) return;
                  }
                  setDeclFitLoading(true);
                  setDeclFitResult(null);
                  setDeclFitError(null);
                  try {
                    const result = await assessGoalDeclarationFit(
                      currentGoal.goalStatement,
                      studentDeclaration,
                      currentGoal.valuesDeclaration,
                      activeGoal
                    );
                    setDeclFitResult(result);
                  } catch (err) {
                    setDeclFitError(err instanceof Error ? err.message : "AI assessment failed. Please try again.");
                  }
                  finally { setDeclFitLoading(false); }
                }}
                disabled={declFitLoading}
                className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {declFitLoading ? "Assessing…" : declFitResult ? "Re-assess" : "AI Deep Assess"}
              </button>
            ) : undefined}
          >
            <div className="px-4 py-3 space-y-3">
              {studentDeclaration ? (
                <>
                  {/* Declaration text */}
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-2">{studentDeclaration}</p>

                  {/* Keyword match result */}
                  {declarationAlignment.missedTerms.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Key themes not yet reflected in goal:</p>
                      <div className="flex flex-wrap gap-1">
                        {declarationAlignment.missedTerms.map((t) => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            💡 {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-600">✓ Goal keywords reflect the declaration.</p>
                  )}

                  {/* AI Deep Assessment results */}
                  {declFitLoading && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      <span className="text-xs text-muted-foreground">AI is reading the goal and declaration…</span>
                    </div>
                  )}
                  {declFitError && !declFitLoading && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                      <p className="text-xs font-semibold text-red-500 mb-0.5">Assessment failed</p>
                      <p className="text-xs text-red-400">{declFitError}</p>
                    </div>
                  )}
                  {declFitResult && !declFitLoading && (
                    <div className="space-y-3 pt-1 border-t border-border/50">
                      {/* Overall + 3 dimension scores */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Assessment</p>
                        {[
                          { label: "Overall Fit", score: declFitResult.overallScore, bold: true },
                          { label: "Ambition", score: declFitResult.ambitionScore, bold: false },
                          { label: "Thematic", score: declFitResult.thematicScore, bold: false },
                          { label: "Specificity", score: declFitResult.specificityScore, bold: false },
                        ].map(({ label, score, bold }) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className={`text-xs w-20 shrink-0 ${bold ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{label}</span>
                            <div className="flex-1 bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${score >= 70 ? "bg-emerald-500" : score >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className={`text-xs w-7 text-right shrink-0 font-medium ${score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-600" : "text-red-500"}`}>{score}%</span>
                          </div>
                        ))}
                      </div>

                      {/* Analysis */}
                      <div className="rounded-lg bg-muted/40 px-3 py-2">
                        <p className="text-[11px] text-foreground leading-relaxed">{declFitResult.analysis}</p>
                      </div>

                      {/* Suggested tweak */}
                      {declFitResult.suggestedTweak && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wide">✦ Suggested Goal Tweak</p>
                          <p className="text-[11px] text-foreground leading-relaxed italic">"{declFitResult.suggestedTweak}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">No declaration found — the student/coach needs to submit one first.</p>
              )}
            </div>
          </Collapsible>

          {/* C: SMARTER Check — custom toggle (already collapsible) */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <button onClick={() => setSmarterOpen((o) => !o)} className="flex items-center gap-2 flex-1 text-left">
                {smarterOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">C · SMARTER Check</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-16 bg-muted rounded-full h-1">
                    <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${qualityPassed === 7 ? "text-emerald-600" : qualityPassed < filled ? "text-yellow-600" : "text-muted-foreground"}`}>{qualityPassed}/7 ✓</span>
                </div>
              </button>
              {canEdit && !editingSmarter && (
                <button onClick={startEditSmarter} className="p-1 text-muted-foreground hover:text-primary transition-colors">
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            {smarterOpen && (
              <div className="divide-y divide-border">
                {criteriaValues.map((c, i) => {
                  const filled = c.value.trim() !== "";
                  // Live analysis — always computed, shown in BOTH edit and view mode
                  const qualityHint = filled ? checkSmarterFieldQuality(c.key as string, c.value) : null;
                  const ok = filled && !qualityHint;
                  const wc = c.value.trim() ? c.value.trim().split(/\s+/).length : 0;
                  const wcOk = wc >= c.minWords;
                  const ai = aiImprove[c.key as string];
                  return (
                    <div key={i} className={`px-4 py-2.5 ${!filled ? "bg-amber-500/5" : qualityHint ? "bg-yellow-500/5" : ""}`}>
                      <div className="flex items-start gap-2.5">
                        <span className={`shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${ok ? "bg-emerald-500/15 text-emerald-600" : qualityHint ? "bg-yellow-500/15 text-yellow-600" : "bg-amber-500/15 text-amber-600"}`}>
                          {ok ? "✓" : c.letter}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</p>
                            {filled && (
                              <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${wcOk ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                                {wc}/{c.minWords}w
                              </span>
                            )}
                          </div>

                          {editingSmarter ? (
                            <div className="space-y-1.5 mt-0.5">
                              <textarea
                                value={smarterDraft[c.key as string] || ""}
                                onChange={(e) => {
                                  setSmarterDraft((p) => ({ ...p, [c.key as string]: e.target.value }));
                                  // Clear AI suggestion + assess result when user types
                                  if (ai) setAiImprove((p) => ({ ...p, [c.key as string]: null }));
                                  setFieldAssess((p) => ({ ...p, [c.key as string]: undefined }));
                                }}
                                rows={c.minWords >= 10 ? 3 : 2}
                                placeholder={c.placeholder}
                                className="w-full text-xs border border-border rounded px-2 py-1 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                              />

                              {/* Assess button — evaluates DRAFT text, not saved text */}
                              {(() => {
                                const draftVal = (smarterDraft[c.key as string] || "").trim();
                                const assessed = fieldAssess[c.key as string];
                                const draftIssue = assessed !== undefined
                                  ? assessed  // already assessed
                                  : qualityHint; // fall back to saved-value hint

                                return (
                                  <div className="space-y-1.5">
                                    {/* Assess button — always shown when there's draft text */}
                                    {draftVal && (
                                      <button
                                        onClick={() => {
                                          const issue = checkSmarterFieldQuality(c.key as string, draftVal);
                                          setFieldAssess((p) => ({ ...p, [c.key as string]: issue ?? null }));
                                        }}
                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold border border-primary/20"
                                      >
                                        ✦ Assess
                                      </button>
                                    )}

                                    {/* Result: pass or issue */}
                                    {assessed !== undefined && (
                                      assessed === null ? (
                                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">✓ Passes SMARTER check for {c.label}</p>
                                      ) : (
                                        <div className="space-y-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-2">
                                          <p className="text-[11px] text-yellow-600 dark:text-yellow-400 leading-relaxed font-medium">⚡ {assessed}</p>
                                          <p className="text-[11px] text-muted-foreground leading-relaxed">💡 {c.suggestion}</p>
                                          {!ai && (
                                            <button
                                              onClick={() => handleAiImprove(c.key as string, c.label, assessed, draftVal)}
                                              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                                            >
                                              <Sparkles className="h-2.5 w-2.5" /> AI Rewrite
                                            </button>
                                          )}
                                        </div>
                                      )
                                    )}

                                    {/* Show saved-value hint only if not yet assessed */}
                                    {assessed === undefined && draftIssue && (
                                      <div className="space-y-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20 px-2.5 py-2">
                                        <p className="text-[11px] text-yellow-600 dark:text-yellow-400 leading-relaxed font-medium">⚡ {draftIssue}</p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">💡 {c.suggestion}</p>
                                        {!ai && (
                                          <button
                                            onClick={() => handleAiImprove(c.key as string, c.label, draftIssue, smarterDraft[c.key as string] || "")}
                                            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                                          >
                                            <Sparkles className="h-2.5 w-2.5" /> AI Rewrite
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {assessed === undefined && !draftIssue && filled && (
                                      <p className="text-[11px] text-emerald-600 dark:text-emerald-500">✓ Looks good</p>
                                    )}
                                    {assessed === undefined && !filled && (
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">💡 {c.suggestion}</p>
                                    )}

                                    {/* AI suggestion block */}
                                    {ai?.loading && (
                                      <p className="text-[11px] text-primary/70 animate-pulse">✨ Generating improved version…</p>
                                    )}
                                    {ai && !ai.loading && ai.improved && (
                                      <div className="space-y-1 pt-1 border-t border-yellow-500/20">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">AI suggests:</p>
                                        <p className="text-[11px] text-foreground/90 leading-relaxed italic">"{ai.improved}"</p>
                                        {ai.explanation && (
                                          <p className="text-[10px] text-muted-foreground">{ai.explanation}</p>
                                        )}
                                        <div className="flex gap-1.5 pt-0.5">
                                          <button
                                            onClick={() => {
                                              setSmarterDraft((p) => ({ ...p, [c.key as string]: ai.improved }));
                                              setAiImprove((p) => ({ ...p, [c.key as string]: null }));
                                              setFieldAssess((p) => ({ ...p, [c.key as string]: undefined }));
                                            }}
                                            className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 transition-colors font-medium"
                                          >
                                            Use this ↑
                                          </button>
                                          <button
                                            onClick={() => setAiImprove((p) => ({ ...p, [c.key as string]: null }))}
                                            className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                                          >
                                            Dismiss
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>

                          ) : filled ? (
                            <div className="space-y-1">
                              <p className="text-xs text-foreground/80 leading-relaxed">{c.value}</p>
                              {qualityHint ? (
                                <div className="space-y-0.5 mt-0.5">
                                  <p className="text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">⚡ {qualityHint}</p>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">💡 {c.suggestion}</p>
                                </div>
                              ) : (
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/60">✓ Criteria met</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed mt-0.5">💡 {c.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {editingSmarter && (
                  <div className="px-4 py-3 bg-muted/10 space-y-2.5">
                    <div className="flex gap-2">
                      <button onClick={saveSmarter} disabled={savingSmarter} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                        <Check className="h-3 w-3" />{savingSmarter ? "Saving…" : "Save Criteria"}
                      </button>
                      <button onClick={() => { setEditingSmarter(false); setShowBuilder(false); }} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">Cancel</button>
                    </div>
                    <div className="border-t border-border pt-2.5">
                      <button onClick={handleGenerate} disabled={!canGenerate} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                        <Sparkles className="h-3 w-3" /> Generate Statement from Criteria
                      </button>
                      {!canGenerate && <p className="text-xs text-muted-foreground mt-1">Fill Specific + 1 more to generate.</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* D: Test & Export — collapsible */}
          <Collapsible
            title="D · Test &amp; Export Statement"
            accent
            icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
            action={canEdit ? (
              <button onClick={handleGenerate} disabled={!canGenerate} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                <Sparkles className="h-3 w-3" /> Generate from Criteria
              </button>
            ) : undefined}
          >
            <div className="p-4 space-y-3">
              {values.length > 0 && (
                <div className="flex flex-wrap gap-1 pb-1">
                  <span className="text-xs text-muted-foreground self-center">Values:</span>
                  {values.map((v) => (
                    <span key={v} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{v}</span>
                  ))}
                </div>
              )}
              <textarea value={statementDraft} onChange={(e) => { setStatementDraft(e.target.value); setTestResults(null); }} rows={5} placeholder="Type or generate your goal statement here…" className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed" />
              <button onClick={() => setTestResults(testStatement(statementDraft, editingSmarter ? smarterDraft : smarterForAlign))} disabled={!statementDraft.trim()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 transition-colors w-full justify-center">
                <FlaskConical className="h-3 w-3" /> Test SMARTER Coverage
              </button>
              {testResults && (
                <div className="rounded-lg border border-border p-3 space-y-2.5">
                  {/* Score summary + badges */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">{passedTests}/{totalApplicable} criteria reflected</p>
                    {passedTests === totalApplicable && totalApplicable > 0 && (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">✓ All criteria met!</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {testResults.map((r, i) => (
                      <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.covered === null ? "bg-muted text-muted-foreground" : r.covered ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-500"}`}>
                        {r.letter} {r.covered === null ? "—" : r.covered ? "✓" : "✗"}
                      </span>
                    ))}
                  </div>
                  {/* Per-criterion fix suggestions for failing ones */}
                  {testResults.some((r) => r.covered === false) && (
                    <div className="space-y-1.5 pt-1 border-t border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">How to fix:</p>
                      {testResults.filter((r) => r.covered === false && r.fix).map((r, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-red-500/15 text-red-500">{r.letter}</span>
                          <div>
                            <p className="text-[11px] font-semibold text-foreground/80">{r.label}</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.fix}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {canEdit && (
                <div className="flex gap-2 pt-1 border-t border-border flex-wrap">
                  <button onClick={copyToGoalStatement} disabled={savingToGoal || !statementDraft.trim()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-1 justify-center">
                    <ArrowRight className="h-3 w-3" />{savingToGoal ? "Exporting…" : "✓ Export to Results"}
                  </button>
                  <button onClick={() => { setStatementDraft(currentGoal.goalStatement || ""); setTestResults(null); }} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground transition-colors">Reset</button>
                </div>
              )}
            </div>
          </Collapsible>
        </div>

        {/* ════ COLUMN 2: Milestone Planner ════ */}
        <div className="space-y-4">
          <ColHeader step="2" title="12-Week Milestones" badge={
            milestonesWithContent > 0
              ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{milestonesWithContent}/12 set</span>
              : <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">None yet</span>
          } />

          {/* A: Questionnaire — already collapsible */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setShowQuestions((o) => !o)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left border-b border-border">
              {showQuestions ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <Wand2 className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">A · Milestone Questionnaire</span>
            </button>
            {showQuestions && (
              <div className="p-4 space-y-4">
                {/* Universal */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Capacity</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Hours/day</label>
                      <select value={questions.hoursPerDay} onChange={(e) => setQuestions((q) => ({ ...q, hoursPerDay: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                        {["0.5","1","1.5","2","3","4","5","6"].map((v) => <option key={v} value={v}>{v}h</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Days/week</label>
                      <select value={questions.daysPerWeek} onChange={(e) => setQuestions((q) => ({ ...q, daysPerWeek: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                        {["1","2","3","4","5","6","7"].map((v) => <option key={v} value={v}>{v} days</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Starting % complete</label>
                      <input type="number" min="0" max="100" value={questions.startingPct} onChange={(e) => setQuestions((q) => ({ ...q, startingPct: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Weekly review day</label>
                      <select value={questions.reviewDay} onChange={(e) => setQuestions((q) => ({ ...q, reviewDay: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                        {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Accountability partner name</label>
                    <input type="text" value={questions.accountabilityPartner} onChange={(e) => setQuestions((q) => ({ ...q, accountabilityPartner: e.target.value }))} placeholder="Coach name, friend, etc." className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">Busy weeks (comma-separated, e.g. 4,8)</label>
                    <input type="text" value={questions.busyWeeks} onChange={(e) => setQuestions((q) => ({ ...q, busyWeeks: e.target.value }))} placeholder="e.g. 4, 8" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">#1 expected obstacle</label>
                    <input type="text" value={questions.obstacle} onChange={(e) => setQuestions((q) => ({ ...q, obstacle: e.target.value }))} placeholder="What could slow you down?" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                {/* Goal-type specific */}
                {activeGoal === "enrollment" && (
                  <div className="space-y-2.5 border-t border-border pt-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Enrollment Targets by Program</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">FLEX target</label>
                        <input type="number" value={questions.flexTarget} onChange={(e) => setQuestions((q) => ({ ...q, flexTarget: e.target.value }))} placeholder="e.g. 5" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">ALC target</label>
                        <input type="number" value={questions.alcTarget} onChange={(e) => setQuestions((q) => ({ ...q, alcTarget: e.target.value }))} placeholder="e.g. 3" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">LEAP target</label>
                        <input type="number" value={questions.leapTarget} onChange={(e) => setQuestions((q) => ({ ...q, leapTarget: e.target.value }))} placeholder="e.g. 2" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Seminar schedule (dates, e.g. Mar 20, Apr 5, Apr 19)</label>
                      <input type="text" value={questions.seminarDates} onChange={(e) => setQuestions((q) => ({ ...q, seminarDates: e.target.value }))} placeholder="e.g. Mar 20, Apr 5, Apr 19" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-1">Outreach Details</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Prospect list size</label>
                        <input type="number" value={questions.prospectCount} onChange={(e) => setQuestions((q) => ({ ...q, prospectCount: e.target.value }))} placeholder="e.g. 50" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Contacts/day</label>
                        <input type="number" value={questions.contactsPerDay} onChange={(e) => setQuestions((q) => ({ ...q, contactsPerDay: e.target.value }))} placeholder="e.g. 5" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Conversion (1 in N)</label>
                        <select value={questions.conversionRatio} onChange={(e) => setQuestions((q) => ({ ...q, conversionRatio: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                          {["2","3","5","8","10","15","20"].map((v) => <option key={v} value={v}>1 in {v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Primary channel</label>
                        <select value={questions.channel} onChange={(e) => setQuestions((q) => ({ ...q, channel: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                          {["referrals","events","cold calls","social media","combination"].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {activeGoal === "personal" && (
                  <div className="space-y-2.5 border-t border-border pt-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Goal Details</p>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Current baseline measurement</label>
                      <input type="text" value={questions.baseline} onChange={(e) => setQuestions((q) => ({ ...q, baseline: e.target.value }))} placeholder="e.g. 75kg, 0 days/week, Level 1" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Daily/weekly practice activity</label>
                      <input type="text" value={questions.dailyActivity} onChange={(e) => setQuestions((q) => ({ ...q, dailyActivity: e.target.value }))} placeholder="e.g. 30-min walk, journaling, meditation" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Tracking method</label>
                        <select value={questions.measureMethod} onChange={(e) => setQuestions((q) => ({ ...q, measureMethod: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                          {["journal","app","scale","photos","coach assessment","spreadsheet"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Habit trigger</label>
                        <input type="text" value={questions.habitTrigger} onChange={(e) => setQuestions((q) => ({ ...q, habitTrigger: e.target.value }))} placeholder="e.g. after breakfast" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                )}

                {activeGoal === "professional" && (
                  <div className="space-y-2.5 border-t border-border pt-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Professional Goal Details</p>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-0.5">Target skill or credential</label>
                      <input type="text" value={questions.targetCredential} onChange={(e) => setQuestions((q) => ({ ...q, targetCredential: e.target.value }))} placeholder="e.g. Python certification, leadership skills" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Current level</label>
                        <select value={questions.currentLevel} onChange={(e) => setQuestions((q) => ({ ...q, currentLevel: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                          {["beginner","intermediate","advanced"].map((l) => <option key={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Study hours/week</label>
                        <input type="number" value={questions.studyHours} onChange={(e) => setQuestions((q) => ({ ...q, studyHours: e.target.value }))} placeholder="e.g. 5" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Learning method</label>
                        <select value={questions.learningMethod} onChange={(e) => setQuestions((q) => ({ ...q, learningMethod: e.target.value }))} className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary">
                          {["online course","books","mentor","practice","combination"].map((m) => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-0.5">Exam/assessment date</label>
                        <input type="text" value={questions.examDate} onChange={(e) => setQuestions((q) => ({ ...q, examDate: e.target.value }))} placeholder="e.g. April 2026" className="w-full text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1 border-t border-border">
                  <button onClick={generateAndExport} disabled={savingMilestones} className="flex items-center justify-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-1">
                    <ArrowRight className="h-3.5 w-3.5" />{savingMilestones ? "Saving…" : "✓ Generate & Save Milestones"}
                  </button>
                  <button onClick={handleGenerateMilestones} disabled={savingMilestones} className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors">
                    <Wand2 className="h-3.5 w-3.5" /> Preview First
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* B: Milestone preview — always visible; shows preview when available */}
          {milestonePreview ? (
            <div className="bg-card rounded-xl border border-primary/30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">B · Preview — Test Alignment</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {milestonePreview.filter((m) => milestoneAligned(currentGoal.goalStatement, m.description)).length}/12 aligned
                </span>
              </div>
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {milestonePreview.map((m) => {
                  const aligned = milestoneAligned(currentGoal.goalStatement, m.description);
                  return (
                    <div key={m.weekNumber} className="px-4 py-2 flex items-start gap-2">
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground w-5">W{m.weekNumber}</span>
                      <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${aligned ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>{aligned ? "✓" : "!"}</span>
                      <p className="text-[11px] text-foreground/80 leading-relaxed">{m.description}</p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 px-4 py-3 border-t border-border">
                <button onClick={() => exportMilestones()} disabled={savingMilestones} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-1 justify-center">
                  <ArrowRight className="h-3 w-3" />{savingMilestones ? "Saving…" : "✓ Save Milestones"}
                </button>
                <button onClick={() => { setMilestonePreview(null); setShowQuestions(true); }} className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                  ← Revise
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
                <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">B · Preview — Test Alignment</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-muted-foreground italic">
                  Use the questionnaire above to generate AI milestones — they'll appear here for review before saving.
                </p>
              </div>
            </div>
          )}

          {/* C: Saved Milestones — collapsible + export button */}
          <Collapsible
            title="C · Saved Milestones"
            badge={
              milestonesWithContent > 0 ? (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  milestonesAlignedCount === milestonesWithContent
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                }`}>
                  {milestonesAlignedCount}/{milestonesWithContent} aligned
                </span>
              ) : undefined
            }
          >
            <div className="divide-y divide-border">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => {
                const milestone = currentGoal.milestones.find((m) => m.weekNumber === week);
                const isCurrent = week === currentWeek;
                const isExpanded = expandedMilestone === week;
                const isEditing = editingMilestoneWeek === week;
                const desc = milestone?.milestoneDescription;
                return (
                  <div key={week} className={isCurrent ? "border-l-2 border-primary" : ""}>
                    <button onClick={() => setExpandedMilestone(isExpanded ? null : week)} className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors text-left">
                      {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                      <span className={`text-xs font-medium shrink-0 ${isCurrent ? "text-primary" : ""}`}>W{week}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{getWeekTarget(week)}</span>
                      {desc && (
                        <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-full font-medium ${milestoneAligned(currentGoal.goalStatement, desc) ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`} title={milestoneAligned(currentGoal.goalStatement, desc) ? "Aligned with goal" : "Review alignment with goal"}>
                          {milestoneAligned(currentGoal.goalStatement, desc) ? "✓" : "!"}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground truncate flex-1">{desc || "—"}</span>
                      {canEdit && (
                        <button onClick={(e) => { e.stopPropagation(); setMilestoneDrafts((p) => ({ ...p, [week]: desc || "" })); setEditingMilestoneWeek(week); setExpandedMilestone(week); }} className="shrink-0 p-0.5 text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea value={milestoneDrafts[week] || ""} onChange={(e) => setMilestoneDrafts((p) => ({ ...p, [week]: e.target.value }))} rows={3} className="w-full text-xs border border-border rounded-lg px-2.5 py-2 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
                            <div className="flex gap-2">
                              <button onClick={() => saveMilestoneDescription(week)} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                                <Check className="h-3 w-3" /> Save
                              </button>
                              <button onClick={() => setEditingMilestoneWeek(null)} className="text-xs px-2.5 py-1 rounded bg-muted text-muted-foreground transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-foreground/80 leading-relaxed">{desc || <span className="text-muted-foreground italic">No milestone yet</span>}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {canEdit && milestonesWithContent > 0 && (
              <div className="px-4 py-3 border-t border-border">
                <button onClick={exportSavedMilestones} disabled={savingMilestones} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center">
                  <ArrowRight className="h-3 w-3" />{savingMilestones ? "Saving…" : "✓ Save All Milestones"}
                </button>
              </div>
            )}
          </Collapsible>
        </div>

        {/* ════ COLUMN 3: Weekly Actions ════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <ColHeader step="3" title="Weekly Actions" badge={
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${weeksWithActions === 12 ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : weeksWithActions > 0 ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted text-muted-foreground"}`}>
                {weeksWithActions}/12 weeks planned
              </span>
            } />
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setCalendarView(false)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${!calendarView ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutList className="h-3 w-3" /> List
              </button>
              <button
                onClick={() => setCalendarView(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${calendarView ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Calendar className="h-3 w-3" /> Calendar
              </button>
            </div>
          </div>

          {/* Calendar View */}
          {calendarView && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setCalendarExpanded((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">12-Week Calendar</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{activeGoal} · starts {new Date(batchStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  {calendarExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </button>
              {calendarExpanded && (
                <>
                  <div className="border-t border-border" />
                  <div className="p-3 grid grid-cols-4 gap-2">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
                      const mil = currentGoal.milestones.find((m) => m.weekNumber === w);
                      const acts: CheckItem[] = (() => { try { return JSON.parse(mil?.actions || "[]"); } catch { return []; } })();
                      const doneActs = acts.filter((a) => a.done).length;
                      const hasMilestone = !!mil?.milestoneDescription;
                      const isCurrent = w === currentWeek;
                      const isPast = w < currentWeek;
                      const start = mil?.weekStartDate ? new Date(mil.weekStartDate) : null;
                      return (
                        <button
                          key={w}
                          onClick={() => { setCalendarView(false); setSelectedWeek(w); }}
                          className={`rounded-xl border p-2.5 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${isCurrent ? "border-primary bg-primary/5" : "border-border"}`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[11px] font-bold ${isCurrent ? "text-primary" : isPast ? "text-muted-foreground" : "text-foreground"}`}>W{w}</span>
                            {isCurrent && <span className="text-[8px] bg-primary text-primary-foreground px-1 rounded font-bold">NOW</span>}
                          </div>
                          {start && <p className="text-[9px] text-muted-foreground mb-1.5">{start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                          <div className="flex gap-1 flex-wrap">
                            {hasMilestone && <span className="w-2 h-2 rounded-full bg-purple-500" title="Milestone set" />}
                            {acts.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-500" title={`${acts.length} action steps`} />}
                            {doneActs > 0 && doneActs === acts.length && acts.length > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" title="All done ✓" />}
                          </div>
                          {acts.length > 0 && (
                            <p className="text-[9px] text-muted-foreground mt-1">{doneActs}/{acts.length} done</p>
                          )}
                          {mil?.cumulativePercentage ? (
                            <p className="text-[9px] text-purple-500 mt-0.5">{mil.cumulativePercentage}% target</p>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border flex items-center gap-4 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> milestone set</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> action steps</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> all done</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Week navigation — always visible */}
          {!calendarView && (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5">
              <button onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))} disabled={selectedWeek === 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 flex flex-col items-center">
                <p className="text-sm font-semibold">Week {selectedWeek}{selectedWeek === currentWeek ? " · Current" : ""}</p>
                {weekMilestone?.weekStartDate && weekMilestone?.weekEndDate ? (
                  <p className="text-xs text-primary font-medium">
                    {new Date(weekMilestone.weekStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(weekMilestone.weekEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{getWeekTarget(selectedWeek)} target</p>
                )}
              </div>
              <button onClick={() => setSelectedWeek((w) => Math.min(12, w + 1))} disabled={selectedWeek === 12} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {/* Toggle button — very obvious */}
            <button
              onClick={() => setShowWeekPicker((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold text-primary bg-primary/5 hover:bg-primary/10 border-t border-border transition-colors"
            >
              {showWeekPicker ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showWeekPicker ? "Hide Week Picker" : "Pick Week (1–12)"}
            </button>
            {/* Week quick-select dots — collapsed by default */}
            {showWeekPicker && (
              <div className="px-4 py-3 space-y-2 border-t border-border">
                <div className="overflow-x-auto">
                  <div className="flex gap-1 justify-start min-w-max mx-auto w-fit">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
                      const actionCount = weekActionCounts[w] ?? 0;
                      const hasMilestone = !!currentGoal.milestones.find((m) => m.weekNumber === w)?.milestoneDescription;
                      return (
                        <div key={w} className="flex flex-col items-center gap-0.5">
                          <button onClick={() => { setSelectedWeek(w); setShowWeekPicker(false); }}
                            className={`w-6 h-6 rounded-full text-[9px] font-bold transition-all ${w === selectedWeek ? "bg-primary text-primary-foreground scale-110 shadow-sm" : actionCount > 0 ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30" : w === currentWeek ? "bg-primary/20 text-primary" : hasMilestone ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50"}`}>
                            {w}
                          </button>
                          {actionCount > 0 && w !== selectedWeek && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 inline-block" />has actions</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary/20 inline-block" />current week</span>
                </div>
              </div>
            )}
          </div>

          )} {/* end !calendarView week nav */}

          {/* Milestone reference — collapsible */}
          {!calendarView && <Collapsible
            title={`Week ${selectedWeek} Milestone`}
            badge={weekMilestone?.milestoneDescription ? (
              <span className="text-xs text-muted-foreground">{getWeekTarget(selectedWeek)} target</span>
            ) : undefined}
            accent={!!weekMilestone?.milestoneDescription}
          >
            <div className="px-4 py-3 space-y-2">
              {weekMilestone?.milestoneDescription ? (
                <>
                  <p className="text-xs text-foreground/80 leading-relaxed">{weekMilestone.milestoneDescription}</p>
                  <p className="text-[9px] text-muted-foreground italic">Your actions this week should directly move this milestone forward.</p>
                </>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground italic">No milestone set for Week {selectedWeek} yet.</p>
                  <p className="text-xs text-muted-foreground">→ Go to <span className="font-medium text-primary">Step 2 (12-Week Milestones)</span> to generate or write your milestones first.</p>
                </div>
              )}
            </div>
          </Collapsible>}

          {/* Actions editor — collapsible */}
          {!calendarView &&
          weekDraft && (
            <Collapsible title={`Week ${selectedWeek} Plan`}>
              <div className="divide-y divide-border">
                {/* Actions */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Action Steps</p>
                    {canEdit && (
                      <button onClick={() => addActionItem("actions")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    )}
                  </div>
                  {canEdit && weekDraft.actions.length === 0 && (
                    <p className="text-xs text-muted-foreground italic bg-muted/40 rounded-lg px-3 py-2">
                      What will you do this week? Be specific — <span className="font-medium">what, when, how often.</span>
                    </p>
                  )}
                  <div className="space-y-2">
                    {weekDraft.actions.map((action, i) => {
                      const ALL_DAYS = ["M","T","W","Th","F","Sa","Su"];
                      const assignedDays = action.days ?? [];
                      const isWeekdays = assignedDays.length === 5 && [0,1,2,3,4].every(d => assignedDays.includes(d));
                      const isDaily    = assignedDays.length === 7;
                      const noDays     = action.text.trim() !== "" && assignedDays.length === 0;
                      return (
                        <div key={i} className={`space-y-1 rounded-lg p-2 -mx-2 transition-colors ${noDays ? "bg-amber-500/5 border border-amber-400/30" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs shrink-0 w-3">{i + 1}.</span>
                            {action.text && weekMilestone?.milestoneDescription && (
                              <span className={`shrink-0 w-2 h-2 rounded-full ${actionAligned(weekMilestone.milestoneDescription, action.text) ? "bg-emerald-500" : "bg-amber-400"}`} />
                            )}
                            {canEdit ? (
                              <>
                                <input type="text" value={action.text} onChange={(e) => updateActionText("actions", i, e.target.value)} placeholder="What will you do?" className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                                <button onClick={() => removeActionItem("actions", i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="h-3 w-3" /></button>
                              </>
                            ) : (
                              <div className="flex-1 flex items-center gap-2 flex-wrap">
                                <span className="text-xs">{action.text}</span>
                                {assignedDays.length > 0 && (
                                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                    {isDaily ? "Daily" : isWeekdays ? "Weekdays" : assignedDays.map(d => ALL_DAYS[d]).join(" ")}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Day pills — always visible, required */}
                          <div className="flex items-center gap-1 pl-4 flex-wrap">
                            {ALL_DAYS.map((label, d) => {
                              const active = assignedDays.includes(d);
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => {
                                    if (!canEdit) return;
                                    const next = active
                                      ? assignedDays.filter((x) => x !== d)
                                      : [...assignedDays, d].sort((a, b) => a - b);
                                    updateActionDays(i, next);
                                  }}
                                  className={`w-7 h-7 text-[10px] font-bold rounded-lg border transition-all select-none ${
                                    active
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                      : canEdit
                                      ? "bg-muted/60 text-muted-foreground border-border hover:border-primary/50 hover:text-primary hover:bg-primary/10 cursor-pointer"
                                      : "bg-muted/30 text-muted-foreground/40 border-transparent cursor-default"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => updateActionDays(i, isWeekdays && !isDaily ? [] : [0,1,2,3,4])}
                                  className={`ml-1 text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${isWeekdays && !isDaily ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                >
                                  {isWeekdays && !isDaily ? "✓ Wkdays" : "Wkdays"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateActionDays(i, isDaily ? [] : [0,1,2,3,4,5,6])}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition-colors ${isDaily ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                                >
                                  {isDaily ? "✓ Daily" : "Daily"}
                                </button>
                              </>
                            )}
                            {noDays && (
                              <span className="text-[10px] text-amber-500 font-semibold ml-1">📅 When will you do this?</span>
                            )}
                            {!noDays && assignedDays.length > 0 && (
                              <span className="text-[9px] text-muted-foreground ml-1">{assignedDays.length}×/wk</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {weekDraft.actions.length > 0 && weekMilestone?.milestoneDescription && (
                    <p className="text-[9px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" /> aligned to milestone
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0 ml-1" /> review connection
                    </p>
                  )}
                </div>

                {/* Expected Outcomes */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expected Outcomes</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">What will you have achieved by end of week?</p>
                    </div>
                    {canEdit && (
                      <button onClick={() => addActionItem("results")} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {weekDraft.results.length === 0 && <p className="text-xs text-muted-foreground italic">No outcomes yet.</p>}
                    {weekDraft.results.map((result, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs shrink-0 w-3">{i + 1}.</span>
                        {canEdit ? (
                          <>
                            <input type="text" value={result.text} onChange={(e) => updateActionText("results", i, e.target.value)} placeholder="e.g. 3 new referrals, 1 seminar confirmed" className="flex-1 text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary" />
                            <button onClick={() => removeActionItem("results", i)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0"><X className="h-3 w-3" /></button>
                          </>
                        ) : <span className="text-xs">{result.text}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="px-4 pb-4 pt-2">
                  <button onClick={saveActions} disabled={savingWeek === selectedWeek} className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors w-full justify-center">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {savingWeek === selectedWeek ? "Saving…" : `✓ Save Week ${selectedWeek} Plan`}
                  </button>
                </div>
              )}
            </Collapsible>
          )}
        </div>

      </div>
    </div>
  );
}

