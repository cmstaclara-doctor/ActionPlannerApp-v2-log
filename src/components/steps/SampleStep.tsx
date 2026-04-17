"use client";

import { PEAR_SAMPLES } from "@/lib/data/pear-samples";
import { ArrowLeft, Sparkles } from "lucide-react";

interface Props {
  templateId: string;
  onSelect: (sampleId: string | null) => void;
  onBack: () => void;
}

export function SampleStep({ templateId, onSelect, onBack }: Props) {
  const samples = PEAR_SAMPLES[templateId] || [];

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div className="text-center space-y-1 mb-4">
        <h2 className="text-xl font-bold text-zinc-100">Choose a starting point</h2>
        <p className="text-zinc-400 text-sm">Pick a sample that resonates — or start fresh.</p>
      </div>

      <div className="grid gap-3">
        {samples.map(sample => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSelect(sample.id)}
            className="flex flex-col gap-2 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:border-blue-500 hover:bg-zinc-800 transition-all text-left group"
          >
            <div className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
              {sample.label}
            </div>
            <div className="text-sm text-zinc-400">{sample.description}</div>
            <div className="mt-1 text-xs text-zinc-500 italic leading-relaxed border-l-2 border-zinc-700 pl-3">
              &ldquo;{sample.statement.slice(0, 120)}...&rdquo;
            </div>
          </button>
        ))}

        <button
          type="button"
          onClick={() => onSelect(null)}
          className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-zinc-600 bg-zinc-900/50 hover:border-zinc-400 hover:bg-zinc-800/50 transition-all text-left group"
        >
          <Sparkles size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
          <div>
            <div className="font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
              Start from scratch
            </div>
            <div className="text-sm text-zinc-500">Write your own goal from a blank slate</div>
          </div>
        </button>
      </div>
    </div>
  );
}
