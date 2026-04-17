"use client";

import { GOAL_TYPE_META } from "@/lib/constants";
import type { GoalType } from "@/lib/types";

interface Props {
  onSelect: (type: GoalType) => void;
}

export function GoalTypeStep({ onSelect }: Props) {
  const types: GoalType[] = ["enrollment", "personal", "professional"];

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-2xl font-bold text-zinc-100">What kind of goal are you setting?</h2>
        <p className="text-zinc-400 text-sm">Choose one — you'll create all 3 goals, one at a time.</p>
      </div>
      <div className="grid gap-4">
        {types.map(type => {
          const meta = GOAL_TYPE_META[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="flex items-start gap-4 p-5 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:border-blue-500 hover:bg-zinc-800 transition-all text-left group"
            >
              <span className="text-3xl mt-0.5">{meta.icon}</span>
              <div>
                <div className="font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">
                  {meta.label}
                </div>
                <div className="text-sm text-zinc-400 mt-0.5">{meta.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
