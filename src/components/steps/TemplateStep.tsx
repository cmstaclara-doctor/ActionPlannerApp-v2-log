"use client";

import { SUBCATEGORIES } from "@/lib/constants";
import type { GoalType } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface Props {
  goalType: GoalType;
  onSelect: (subCategoryId: string) => void;
  onBack: () => void;
}

export function TemplateStep({ goalType, onSelect, onBack }: Props) {
  const options = SUBCATEGORIES.filter(s => s.goalType === goalType);

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
        <h2 className="text-xl font-bold text-zinc-100">Choose your focus area</h2>
        <p className="text-zinc-400 text-sm">Pick the sub-category that best fits your goal.</p>
      </div>
      <div className="grid gap-3">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className="flex flex-col gap-1 p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:border-blue-500 hover:bg-zinc-800 transition-all text-left group"
          >
            <div className="font-medium text-zinc-100 group-hover:text-blue-400 transition-colors">
              {opt.label}
            </div>
            <div className="text-sm text-zinc-400">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
