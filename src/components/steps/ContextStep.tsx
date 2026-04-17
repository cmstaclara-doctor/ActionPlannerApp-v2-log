"use client";

import { PEAR_SAMPLES } from "@/lib/data/pear-samples";
import { ArrowLeft, Edit3 } from "lucide-react";
import { useState } from "react";

interface Props {
  templateId: string;
  sampleId: string | null;
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ContextStep({ templateId, sampleId, answers, onChange, onNext, onBack }: Props) {
  const samples = PEAR_SAMPLES[templateId] || [];
  const sample = sampleId ? samples.find(s => s.id === sampleId) : null;
  const [customPeg, setCustomPeg] = useState(false);

  // If no sample, skip straight to questions
  if (!sample) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-center space-y-2 mb-4">
          <h2 className="text-xl font-bold text-zinc-100">What&apos;s driving this goal?</h2>
          <p className="text-zinc-400 text-sm">Write your personal motivation — your WHY for this goal.</p>
        </div>
        <textarea
          rows={3}
          placeholder="e.g. To prove to myself I can finally commit to something that matters..."
          value={answers.peg || ""}
          onChange={e => onChange("peg", e.target.value)}
          className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  const { contextQ } = sample;
  const selected = answers.coachingContext || "";
  const suggestedPeg = selected && contextQ.pegMap[selected] ? contextQ.pegMap[selected] : "";

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="space-y-1 mb-2">
        <h2 className="text-xl font-bold text-zinc-100">Honest check-in</h2>
        <p className="text-sm text-zinc-400">Answer truthfully — this shapes the heart of your goal.</p>
      </div>

      <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/60">
        <p className="text-zinc-100 font-medium leading-snug">{contextQ.question}</p>
      </div>

      <div className="grid gap-2">
        {contextQ.options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => {
              onChange("coachingContext", opt);
              if (contextQ.pegMap[opt]) {
                onChange("peg", contextQ.pegMap[opt]);
                setCustomPeg(false);
              }
            }}
            className={`p-3 rounded-lg border text-left text-sm transition-all ${
              selected === opt
                ? "border-blue-500 bg-blue-500/10 text-zinc-100"
                : "border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {selected && suggestedPeg && !customPeg && (
        <div className="p-3 rounded-lg border border-zinc-600 bg-zinc-800/60 space-y-2">
          <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium">Suggested peg</p>
          <p className="text-sm text-zinc-200 italic">&ldquo;{suggestedPeg}&rdquo;</p>
          <button
            type="button"
            onClick={() => setCustomPeg(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Edit3 size={12} /> Write my own instead
          </button>
        </div>
      )}

      {(customPeg || (selected === "Other")) && (
        <div className="space-y-1">
          <label className="text-xs text-zinc-400">Your peg (transformation / impact phrase)</label>
          <textarea
            rows={2}
            placeholder="e.g. prove to myself that I can do hard things consistently..."
            value={answers.peg || ""}
            onChange={e => onChange("peg", e.target.value)}
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      )}

      <button
        type="button"
        disabled={!selected}
        onClick={onNext}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium transition-colors"
      >
        Continue
      </button>
    </div>
  );
}
