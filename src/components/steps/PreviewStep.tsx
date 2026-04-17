"use client";

import { GOAL_TEMPLATES } from "@/lib/data/goal-templates";
import type { TemplateWeek } from "@/lib/data/goal-templates";
import { getWeekDates } from "@/lib/utils/week-dates";
import { LEAP99_EVENTS, LEAP99_EVENT_DAYS } from "@/lib/constants";
import { ArrowLeft, Check, Edit3, AlertTriangle, Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  templateId: string;
  sampleId: string | null;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

const DAY_LABELS = ["M", "T", "W", "Th", "F", "Sa", "Su"];
const MIN_COMMITTED = 4;

function SmartField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">{label}</span>
        <button type="button" onClick={() => setEditing(e => !e)} className="text-zinc-600 hover:text-zinc-400 transition-colors">
          <Edit3 size={12} />
        </button>
      </div>
      {editing ? (
        <textarea
          rows={2}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 resize-none"
        />
      ) : (
        <p className="text-sm text-zinc-200 leading-snug">{value || <span className="text-zinc-500 italic">Not set</span>}</p>
      )}
    </div>
  );
}

function CustomActionSection({
  week, customs, answers, eventInfo, onChange, onAdd, onRemove, onToggleDay,
}: {
  week: number;
  customs: { j: number; text: string }[];
  answers: Record<string, string>;
  eventInfo: { days: number[]; short: string } | undefined;
  onChange: (k: string, v: string) => void;
  onAdd: (text: string) => void;
  onRemove: (j: number) => void;
  onToggleDay: (week: number, j: number, day: number) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  }

  return (
    <div className="px-4 pb-3 space-y-2 border-t border-zinc-800/60 pt-2">
      {customs.map(({ j, text }) => {
        const committed = answers[`ms_${week}_cx_${j}_done`] === "true";
        const stored = answers[`ms_${week}_cx_${j}_days`] || "";
        const activeDays = stored === "" ? [] : stored.split(",").map(Number).filter(n => !isNaN(n));
        return (
          <div key={j} className="space-y-2">
            <div className="flex items-start gap-2">
              <button
                type="button"
                onClick={() => onChange(`ms_${week}_cx_${j}_done`, committed ? "false" : "true")}
                className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${committed ? "bg-green-600 border-green-600" : "border-zinc-600 hover:border-zinc-400"}`}
              >
                {committed && <Check size={10} className="text-white m-auto" />}
              </button>
              <span className={`flex-1 text-xs leading-snug ${committed ? "text-zinc-100 font-medium" : "text-zinc-400"}`}>{text}</span>
              <button type="button" onClick={() => onRemove(j)} title="Remove" className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0">
                <X size={11} />
              </button>
            </div>
            {committed && (
              <div className="ml-6 flex items-center gap-1 flex-wrap">
                {DAY_LABELS.map((label, day) => {
                  const isEventDay = eventInfo?.days.includes(day) ?? false;
                  const active = activeDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => onToggleDay(week, j, day)}
                      title={`${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day]}${isEventDay ? ` — ${eventInfo!.short}` : ""}`}
                      className={`relative w-7 h-6 rounded text-xs font-medium transition-colors ${
                        active && isEventDay ? "bg-amber-600 text-white"
                        : active ? "bg-blue-600 text-white"
                        : isEventDay ? "bg-zinc-900 border border-amber-600/50 text-amber-500 hover:border-amber-500"
                        : "bg-zinc-900 border border-zinc-700 text-zinc-500 hover:border-zinc-500"
                      }`}
                    >
                      {label}
                      {isEventDay && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    </button>
                  );
                })}
                {activeDays.length === 0 && <span className="text-xs text-amber-500 ml-1">Pick at least one day</span>}
              </div>
            )}
          </div>
        );
      })}
      {/* Add your own */}
      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="+ Add your own action…"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={commit}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-400 hover:bg-blue-600/30 text-xs transition-colors"
        >
          <Plus size={11} /> Add
        </button>
      </div>
    </div>
  );
}

// Bar heights for overall load chart — n actions × 8px, min 4px (h-1 = 4px)
const BAR_HEIGHT: Record<number, string> = {
  0: "h-1", 1: "h-2", 2: "h-4", 3: "h-6",
  4: "h-8", 5: "h-10", 6: "h-12", 7: "h-14", 8: "h-16",
};

const PCT_WIDTH: Record<number, string> = {
  25: "w-1/4", 37.5: "w-[37.5%]", 50: "w-1/2",
  57.5: "w-[57.5%]", 62.5: "w-[62.5%]", 65: "w-[65%]",
  75: "w-3/4", 87.5: "w-[87.5%]", 100: "w-full",
};

export function PreviewStep({ templateId, sampleId, answers, onChange, onSave, onBack }: Props) {
  const template = GOAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const smarter = template.smarter(answers);
  const milestones: TemplateWeek[] = template.milestones(answers);
  const isEnrollment = template.goalType === "enrollment";

  function getField(key: keyof typeof smarter): string {
    return (answers[`smarter_${key}`] !== undefined ? answers[`smarter_${key}`] : smarter[key]) as string || "";
  }
  function setField(key: string, val: string) {
    onChange(`smarter_${key}`, val);
  }

  function getCommitted(week: number, i: number): boolean {
    return answers[`ms_${week}_${i}_done`] === "true";
  }

  function getActiveDays(week: number, i: number, templateDays: number[]): number[] {
    const stored = answers[`ms_${week}_${i}_days`];
    if (stored !== undefined) {
      return stored === "" ? [] : stored.split(",").map(Number).filter(n => !isNaN(n));
    }
    return templateDays;
  }

  function handleCommit(week: number, i: number, templateDays: number[]) {
    const now = answers[`ms_${week}_${i}_done`] === "true";
    const next = !now;
    onChange(`ms_${week}_${i}_done`, next ? "true" : "false");
    // Pre-populate days from template on first commit if not yet set
    if (next && answers[`ms_${week}_${i}_days`] === undefined) {
      onChange(`ms_${week}_${i}_days`, templateDays.join(","));
    }
  }

  function toggleDay(week: number, i: number, day: number, current: number[]) {
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    onChange(`ms_${week}_${i}_days`, next.join(","));
  }

  // Custom actions per week — stored as ms_{week}_cx_{j} = text
  function getCustomActions(week: number): { j: number; text: string }[] {
    const result: { j: number; text: string }[] = [];
    let j = 0;
    while (answers[`ms_${week}_cx_${j}`] !== undefined) {
      result.push({ j, text: answers[`ms_${week}_cx_${j}`] });
      j++;
    }
    return result;
  }

  function addCustomAction(week: number, text: string) {
    const customs = getCustomActions(week);
    const j = customs.length;
    onChange(`ms_${week}_cx_${j}`, text);
  }

  function removeCustomAction(week: number, j: number) {
    // Shift remaining custom actions down
    const customs = getCustomActions(week);
    // Clear all from j onward and re-set
    for (let k = j; k < customs.length; k++) {
      const next = customs[k + 1];
      if (next) {
        onChange(`ms_${week}_cx_${k}`, next.text);
        onChange(`ms_${week}_cx_${k}_done`, answers[`ms_${week}_cx_${k + 1}_done`] || "false");
        onChange(`ms_${week}_cx_${k}_days`, answers[`ms_${week}_cx_${k + 1}_days`] || "");
      } else {
        // Clear the last slot by setting to empty sentinel then filter in getCustomActions
        onChange(`ms_${week}_cx_${k}`, "\x00");
      }
    }
  }

  function toggleCustomDay(week: number, j: number, day: number) {
    const stored = answers[`ms_${week}_cx_${j}_days`] || "";
    const current = stored === "" ? [] : stored.split(",").map(Number).filter(n => !isNaN(n));
    const next = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort((a, b) => a - b);
    onChange(`ms_${week}_cx_${j}_days`, next.join(","));
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Student name + Declaration — top of preview, required before saving */}
      <div className="rounded-xl border border-blue-600/30 bg-blue-600/5 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">Sign &amp; Commit</h3>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Your full name</label>
          <input
            type="text"
            placeholder="Write your name here…"
            value={answers.realName || ""}
            onChange={e => onChange("realName", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-400">Your declaration</label>
          <textarea
            rows={3}
            placeholder="The grandest version of my greatest vision for myself is…"
            value={answers.declaration || ""}
            onChange={e => onChange("declaration", e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* SMARTER Fields */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">SMARTER Goal Details</h3>
        <div className="grid gap-4">
          <SmartField label="Specific" value={getField("specificDetails")} onChange={v => setField("specificDetails", v)} />
          <SmartField label="Measurable" value={getField("measurableCriteria")} onChange={v => setField("measurableCriteria", v)} />
          <SmartField label="Attainable + Risk" value={getField("achievableResources")} onChange={v => setField("achievableResources", v)} />
          <SmartField label="Relevant" value={getField("relevantAlignment")} onChange={v => setField("relevantAlignment", v)} />
          <SmartField label="Time-bound" value={getField("endDate")} onChange={v => setField("endDate", v)} />
          <SmartField label="Exciting (WHY)" value={getField("excitingMotivation")} onChange={v => setField("excitingMotivation", v)} />
          <SmartField label="Rewarding (Benefits)" value={getField("rewardingBenefits")} onChange={v => setField("rewardingBenefits", v)} />
        </div>
      </div>

      {/* 8-Week Milestone Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">8-Week Action Plan</h3>
        <p className="text-xs text-zinc-500">Check the actions you commit to — then pick the days you will do each one.</p>
        <div className="grid gap-3">
          {milestones.map((wk: TemplateWeek) => {
            const dates = getWeekDates(wk.weekNumber);
            const event = LEAP99_EVENTS[wk.weekNumber];
            const pct = wk.cumulativePercentage;
            const customActions = getCustomActions(wk.weekNumber).filter(c => c.text && c.text !== "\x00");
            const totalActions = wk.actions.length + customActions.length;
            const committedTemplate = wk.actions.filter((_, i) => getCommitted(wk.weekNumber, i)).length;
            const committedCustom = customActions.filter(c => answers[`ms_${wk.weekNumber}_cx_${c.j}_done`] === "true").length;
            const committedCount = committedTemplate + committedCustom;
            const requiredCount = totalActions > 0 && totalActions < MIN_COMMITTED ? totalActions : MIN_COMMITTED;
            const tooFew = totalActions > 0 && committedCount < requiredCount;

            // Distribution analysis — only when enough actions are committed
            const committedItems = [
              ...wk.actions.map((act, i) => ({ days: getActiveDays(wk.weekNumber, i, act.days), committed: getCommitted(wk.weekNumber, i) })),
              ...customActions.map(c => {
                const stored = answers[`ms_${wk.weekNumber}_cx_${c.j}_days`] || "";
                return { days: stored === "" ? [] : stored.split(",").map(Number).filter(n => !isNaN(n)), committed: answers[`ms_${wk.weekNumber}_cx_${c.j}_done`] === "true" };
              }),
            ].filter(x => x.committed);
            const dayLoad: Record<number, number> = {};
            for (const { days } of committedItems) {
              for (const d of days) { dayLoad[d] = (dayLoad[d] || 0) + 1; }
            }
            const overloadedDays = Object.entries(dayLoad)
              .filter(([, count]) => count > 2)
              .map(([day]) => DAY_LABELS[parseInt(day)]);
            const uniqueDays = Object.keys(dayLoad).length;
            const spreadTooTight = committedItems.length >= 3 && uniqueDays < Math.ceil(committedItems.length / 2);

            // Event-day conflict: committed actions scheduled on intensive days
            const eventInfo = LEAP99_EVENT_DAYS[wk.weekNumber];
            const conflictingActions = !isEnrollment && eventInfo
              ? committedItems.filter(x => x.days.some(d => eventInfo.days.includes(d)))
              : [];

            return (
              <div key={wk.weekNumber} className="rounded-xl border border-zinc-700 bg-zinc-800/40 overflow-hidden">
                {/* Week header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-700 bg-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400">WK {wk.weekNumber}</span>
                    <span className="text-xs text-zinc-500">{dates}</span>
                    {event && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30">
                        {event}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      committedCount >= MIN_COMMITTED
                        ? "text-green-400 bg-green-600/10"
                        : "text-amber-400 bg-amber-600/10"
                    }`}>
                      {committedCount}/{totalActions} committed
                    </span>
                    <div className="h-1.5 w-12 rounded-full bg-zinc-700 overflow-hidden">
                      <div className={`h-full bg-blue-500 rounded-full transition-all ${PCT_WIDTH[pct] ?? "w-0"}`} />
                    </div>
                    <span className="text-xs text-zinc-400">{pct}%</span>
                  </div>
                </div>

                {/* Milestone description */}
                <div className="px-4 py-2 border-b border-zinc-800">
                  <p className="text-sm text-zinc-200">{wk.description}</p>
                </div>

                {/* Actions with commitment + day picker */}
                {wk.actions.length > 0 && (
                  <div className="px-4 py-3 space-y-3">
                    {wk.actions.map((act, i) => {
                      const committed = getCommitted(wk.weekNumber, i);
                      const activeDays = getActiveDays(wk.weekNumber, i, act.days);
                      return (
                        <div key={i} className="space-y-2">
                          {/* Action row */}
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              onClick={() => handleCommit(wk.weekNumber, i, act.days)}
                              className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${
                                committed ? "bg-green-600 border-green-600" : "border-zinc-600 hover:border-zinc-400"
                              }`}
                            >
                              {committed && <Check size={10} className="text-white m-auto" />}
                            </button>
                            <span className={`text-xs leading-snug ${committed ? "text-zinc-100 font-medium" : "text-zinc-400"}`}>
                              {act.text}
                            </span>
                          </div>
                          {/* Day picker — shown when committed */}
                          {committed && (
                            <div className="ml-6 flex items-center gap-1 flex-wrap">
                              {DAY_LABELS.map((label, day) => {
                                const isEventDay = eventInfo?.days.includes(day) ?? false;
                                const active = activeDays.includes(day);
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => toggleDay(wk.weekNumber, i, day, activeDays)}
                                    title={`${["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][day]}${isEventDay ? ` — ${eventInfo!.short}` : ""}`}
                                    className={`relative w-7 h-6 rounded text-xs font-medium transition-colors ${
                                      active && isEventDay
                                        ? "bg-amber-600 text-white"
                                        : active
                                        ? "bg-blue-600 text-white"
                                        : isEventDay
                                        ? "bg-zinc-900 border border-amber-600/50 text-amber-500 hover:border-amber-500"
                                        : "bg-zinc-900 border border-zinc-700 text-zinc-500 hover:border-zinc-500"
                                    }`}
                                  >
                                    {label}
                                    {isEventDay && (
                                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    )}
                                  </button>
                                );
                              })}
                              {activeDays.length === 0 && (
                                <span className="text-xs text-amber-500 ml-1">Pick at least one day</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom actions + Add your own */}
                <CustomActionSection
                  week={wk.weekNumber}
                  customs={customActions}
                  answers={answers}
                  eventInfo={eventInfo}
                  onChange={onChange}
                  onAdd={(text) => addCustomAction(wk.weekNumber, text)}
                  onRemove={(j) => removeCustomAction(wk.weekNumber, j)}
                  onToggleDay={toggleCustomDay}
                />

                {/* Commitment nudge — always visible */}
                <div className={`flex items-center gap-1.5 px-4 py-1.5 border-t ${
                  committedCount >= MIN_COMMITTED
                    ? "border-green-600/20 bg-green-600/5"
                    : "border-amber-600/20 bg-amber-600/5"
                }`}>
                  {committedCount >= MIN_COMMITTED
                    ? <Check size={11} className="text-green-500 flex-shrink-0" />
                    : <AlertTriangle size={11} className="text-amber-500 flex-shrink-0" />}
                  <p className={`text-xs ${committedCount >= MIN_COMMITTED ? "text-green-400" : "text-amber-400"}`}>
                    {committedCount >= MIN_COMMITTED
                      ? `${committedCount} actions committed — good to go.`
                      : totalActions <= MIN_COMMITTED
                        ? `Only ${totalActions} actions here — add your own below, then commit to at least ${MIN_COMMITTED}.`
                        : `Check and commit to at least ${MIN_COMMITTED} actions to hit this milestone.`}
                  </p>
                </div>

                {/* Distribution warnings */}
                {overloadedDays.length > 0 && (
                  <div className="flex items-center gap-1.5 px-4 py-2 border-t border-amber-600/20 bg-amber-600/5">
                    <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-400">
                      {overloadedDays.join(" and ")} {overloadedDays.length > 1 ? "are" : "is"} overloaded — consider moving some actions to other days.
                    </p>
                  </div>
                )}
                {!overloadedDays.length && spreadTooTight && (
                  <div className="flex items-center gap-1.5 px-4 py-2 border-t border-amber-600/20 bg-amber-600/5">
                    <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-400">
                      Actions are clustered on {uniqueDays} day{uniqueDays > 1 ? "s" : ""} — spread across more days for a sustainable rhythm.
                    </p>
                  </div>
                )}

                {/* Event conflict warning */}
                {conflictingActions.length > 0 && (
                  <div className="flex items-start gap-1.5 px-4 py-2 border-t border-amber-600/30 bg-amber-600/8">
                    <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300">
                      <span className="font-medium">{eventInfo!.short}</span> — {conflictingActions.length} of your committed action{conflictingActions.length > 1 ? "s are" : " is"} scheduled on intensive days. You may be in workshops all day. Consider shifting those actions to weekdays, unless this goal directly supports your LEAP work.
                    </p>
                  </div>
                )}

                {/* Results */}
                {wk.results.length > 0 && (
                  <div className="px-4 py-2 border-t border-zinc-800/50">
                    {wk.results.map((r, i) => (
                      <p key={i} className="text-xs text-zinc-500 italic">{r.text}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall 8-week day load summary */}
      {(() => {
        const totalLoad: Record<number, number> = {};
        for (const wk of milestones) {
          const customs = getCustomActions(wk.weekNumber).filter(c => c.text && c.text !== "\x00");
          const allItems = [
            ...wk.actions.map((act, i) => ({ days: getActiveDays(wk.weekNumber, i, act.days), committed: getCommitted(wk.weekNumber, i) })),
            ...customs.map(c => {
              const stored = answers[`ms_${wk.weekNumber}_cx_${c.j}_days`] || "";
              return { days: stored === "" ? [] : stored.split(",").map(Number).filter(n => !isNaN(n)), committed: answers[`ms_${wk.weekNumber}_cx_${c.j}_done`] === "true" };
            }),
          ].filter(x => x.committed);
          for (const { days } of allItems) {
            for (const d of days) { totalLoad[d] = (totalLoad[d] || 0) + 1; }
          }
        }
        const counts = Object.values(totalLoad);
        if (counts.length === 0) return null;
        const avg = counts.reduce((a, b) => a + b, 0) / 7;
        const heavy = Object.entries(totalLoad).filter(([, n]) => n > avg * 1.5).map(([d]) => DAY_LABELS[parseInt(d)]);
        const light = DAY_LABELS.map((_, d) => d).filter(d => !totalLoad[d] || totalLoad[d] < avg * 0.5).map(d => DAY_LABELS[d]);
        return (
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Overall 8-Week Load Distribution</h3>
            <div className="flex items-end gap-1.5">
              {DAY_LABELS.map((label, d) => {
                const n = totalLoad[d] || 0;
                const isHeavy = n > avg * 1.5;
                const isEmpty = n === 0;
                return (
                  <div key={d} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs text-zinc-500">{n > 0 ? n : ""}</span>
                    <div className={`w-full rounded-sm transition-all ${BAR_HEIGHT[Math.min(n, 8)] ?? "h-1"} ${
                      isHeavy ? "bg-amber-500" : isEmpty ? "bg-zinc-700" : "bg-blue-500"
                    }`} />
                    <span className={`text-xs ${isHeavy ? "text-amber-400" : isEmpty ? "text-zinc-600" : "text-zinc-400"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
            {(heavy.length > 0 || light.length > 0) && (
              <div className="space-y-1">
                {heavy.length > 0 && (
                  <p className="text-xs text-amber-400 flex items-center gap-1">
                    <AlertTriangle size={11} /> Too heavy on {heavy.join(", ")} — consider moving some actions to lighter days.
                  </p>
                )}
                {light.length > 0 && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <AlertTriangle size={11} className="text-zinc-600" /> {light.join(", ")} {light.length > 1 ? "are" : "is"} almost empty — redistribute for a more consistent weekly rhythm.
                  </p>
                )}
              </div>
            )}
            {heavy.length === 0 && light.length === 0 && (
              <p className="text-xs text-green-400 flex items-center gap-1"><Check size={11} /> Load is well-distributed across the week.</p>
            )}
          </div>
        );
      })()}

      <button
        type="button"
        onClick={onSave}
        disabled={!answers.realName?.trim() || !answers.declaration?.trim()}
        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-semibold transition-colors"
      >
        Save &amp; Commit
      </button>
    </div>
  );
}
