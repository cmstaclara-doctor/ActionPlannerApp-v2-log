"use client";

import { GOAL_TEMPLATES } from "@/lib/data/goal-templates";
import type { TemplateQuestion } from "@/lib/data/goal-templates";
import { SchedulePicker } from "@/components/SchedulePicker";
import { assemblePEAR } from "@/lib/pearBuilder";
import { ArrowLeft, AlertTriangle, Info, Plus } from "lucide-react";
import { useState } from "react";

interface Props {
  templateId: string;
  sampleId: string | null;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onChangeTemplate?: () => void;
}

function isVisible(q: TemplateQuestion, answers: Record<string, string>): boolean {
  if (!q.dependsOn) return true;
  const dep = q.dependsOn;
  const val = answers[dep.id] || "";
  if (dep.notEmpty) return val.trim().length > 0;
  if (dep.value) return val.includes(dep.value);
  return true;
}

function MultiSelectInput({ q, answers, onChange }: { q: TemplateQuestion; answers: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const [customText, setCustomText] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  // Ensure "other" is always the last option
  const baseOpts = (q.options || []).filter(o => o.toLowerCase() !== "other");
  const opts = [...baseOpts, "other"];

  const currentRaw = answers[q.id] || q.defaultValue || "";
  const current = currentRaw.split(",").map(s => s.trim()).filter(Boolean);

  // Separate standard values from custom ones
  const standardVals = current.filter(v => opts.some(o => o.toLowerCase() === v.toLowerCase()));
  const customVals = current.filter(v => !opts.some(o => o.toLowerCase() === v.toLowerCase()));

  function toggle(opt: string) {
    const normalOpt = opt.toLowerCase();
    if (normalOpt === "other") {
      setShowCustom(s => !s);
      return;
    }
    let next: string[];
    const already = current.some(v => v.toLowerCase() === normalOpt);
    if (already) {
      next = current.filter(v => v.toLowerCase() !== normalOpt);
    } else {
      next = [...current, opt];
    }
    onChange(q.id, next.join(","));
  }

  function addCustom() {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const already = current.some(v => v.toLowerCase() === trimmed.toLowerCase());
    if (!already) {
      const next = [...current, trimmed];
      onChange(q.id, next.join(","));
    }
    setCustomText("");
  }

  function removeCustom(val: string) {
    const next = current.filter(v => v !== val);
    onChange(q.id, next.join(","));
  }

  const otherActive = showCustom || customVals.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {opts.map(opt => {
          const isOther = opt.toLowerCase() === "other";
          const active = isOther ? otherActive : current.some(v => v.toLowerCase() === opt.toLowerCase());
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                active
                  ? "border-blue-500 bg-blue-500/15 text-blue-300"
                  : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {/* Custom values added */}
      {customVals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customVals.map(v => (
            <span key={v} className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-xs text-blue-300">
              {v}
              <button type="button" onClick={() => removeCustom(v)} className="hover:text-red-400 transition-colors">×</button>
            </span>
          ))}
        </div>
      )}
      {/* Custom input */}
      {(showCustom || standardVals.some(v => v === "other")) && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your own..."
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustom(); }}}
            className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={addCustom}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/40 text-blue-400 hover:bg-blue-600/30 text-xs transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      )}
    </div>
  );
}

function SelectInput({ q, answers, onChange }: { q: TemplateQuestion; answers: Record<string, string>; onChange: (k: string, v: string) => void }) {
  const baseOpts = (q.options || []).filter(o => o.toLowerCase() !== "other");
  const opts = [...baseOpts, "Other"];
  const current = answers[q.id] || q.defaultValue || "";
  const [customText, setCustomText] = useState("");

  const isCustom = current && !opts.some(o => o.toLowerCase() === current.toLowerCase());

  return (
    <div className="space-y-2">
    <div className="flex flex-col gap-2">
      {opts.map(opt => {
        const isOther = opt.toLowerCase() === "other";
        const active = isOther ? (current.toLowerCase() === "other" || isCustom) : current.toLowerCase() === opt.toLowerCase();
        return (
          <button
            key={opt}
            type="button"
            onClick={() => { onChange(q.id, opt); }}
            className={`p-3 rounded-lg border text-left text-sm transition-all ${
              active
                ? "border-blue-500 bg-blue-500/10 text-zinc-100"
                : "border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
    {/* Custom answer when "Other" selected */}
    {(current.toLowerCase() === "other" || isCustom) && (
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Describe your choice..."
          value={isCustom ? current : customText}
          onChange={e => {
            setCustomText(e.target.value);
            onChange(q.id, e.target.value || "Other");
          }}
          className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
      </div>
    )}
    </div>
  );
}

export function QuestionsStep({ templateId, sampleId, answers, onChange, onNext, onBack, onChangeTemplate }: Props) {
  const template = GOAL_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const visibleQs = template.questions.filter(q => isVisible(q, answers));
  const risks = template.answerRisks ? template.answerRisks(answers) : [];
  const pearPreview = assemblePEAR(answers, templateId, sampleId);

  // Initialize defaults for unanswered questions
  function ensureDefaults() {
    if (!template) return;
    for (const q of template.questions) {
      if (q.defaultValue && !answers[q.id]) {
        onChange(q.id, q.defaultValue);
      }
    }
  }

  function handleNext() {
    ensureDefaults();
    onNext();
  }

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <h2 className="text-xl font-bold text-zinc-100">{template.name}</h2>
        <p className="text-sm text-zinc-400 mt-0.5">{template.description}</p>
      </div>

      {template.safetyNote && (
        <div className="flex gap-2 p-3 rounded-lg border border-amber-600/40 bg-amber-600/10">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">{template.safetyNote}</p>
        </div>
      )}

      <div className="space-y-5">
        {visibleQs.map(q => {
          const val = answers[q.id] !== undefined ? answers[q.id] : (q.defaultValue || "");
          const risk = risks.find(r => r.field === q.id);

          return (
            <div key={q.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <label className="text-sm font-medium text-zinc-200">{q.label}</label>
                {q.unit && <span className="text-xs text-zinc-500 mt-0.5">{q.unit}</span>}
              </div>

              {q.hint && (
                <div className="flex items-start gap-1.5 text-xs text-zinc-500">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{q.hint}</span>
                </div>
              )}

              {q.type === "number" && (
                <input
                  type="number"
                  placeholder={q.placeholder}
                  value={val}
                  onChange={e => onChange(q.id, e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              )}

              {q.type === "text" && (
                <input
                  type="text"
                  placeholder={q.placeholder}
                  value={val}
                  onChange={e => onChange(q.id, e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              )}

              {q.type === "select" && (
                <SelectInput q={q} answers={answers} onChange={onChange} />
              )}

              {q.type === "multiselect" && (
                <MultiSelectInput q={q} answers={answers} onChange={onChange} />
              )}

              {q.type === "schedule" && (
                <SchedulePicker
                  value={val}
                  onChange={v => onChange(q.id, v)}
                />
              )}

              {risk && (
                <div className="flex gap-1.5 mt-1">
                  <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400">{risk.message}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live PEAR Preview */}
      {pearPreview && (
        <div className="mt-4 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Live PEAR preview</p>
          <p className="text-sm text-zinc-200 leading-relaxed italic">&ldquo;{pearPreview}&rdquo;</p>
        </div>
      )}

      {/* Global risks not tied to a specific field */}
      {risks.filter(r => !r.field).map((r, i) => (
        <div key={i} className="flex gap-2 p-3 rounded-lg border border-amber-600/40 bg-amber-600/10">
          <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">{r.message}</p>
        </div>
      ))}

      <button
        type="button"
        onClick={handleNext}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
      >
        Preview my goal plan →
      </button>

      {onChangeTemplate && (
        <div className="pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onChangeTemplate}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Change template / focus area
          </button>
        </div>
      )}
    </div>
  );
}
