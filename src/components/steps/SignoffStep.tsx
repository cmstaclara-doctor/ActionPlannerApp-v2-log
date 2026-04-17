"use client";

import { assemblePEAR } from "@/lib/pearBuilder";
import { GOAL_TYPE_META } from "@/lib/constants";
import type { GoalType } from "@/lib/types";
import { CheckCircle2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Props {
  goalType: GoalType;
  templateId: string;
  sampleId: string | null;
  answers: Record<string, string>;
  studentName: string;
  onDone: () => void;
}


export function SignoffStep({ goalType, templateId, sampleId, answers, studentName, onDone }: Props) {
  const [copied, setCopied] = useState(false);
  const pearStatement = assemblePEAR(answers, templateId, sampleId);
  const meta = GOAL_TYPE_META[goalType];

  function copyStatement() {
    navigator.clipboard.writeText(pearStatement).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-green-600/20 border border-green-600/40 flex items-center justify-center">
          <CheckCircle2 size={28} className="text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">{meta.label} Saved!</h2>
          <p className="text-sm text-zinc-400 mt-1">
            {studentName}&apos;s {goalType} goal is set for the next 8 weeks.
          </p>
        </div>
      </div>

      {/* Declaration */}
      {answers.declaration && (
        <div className="p-4 rounded-xl border border-green-600/30 bg-green-600/5 text-left space-y-1">
          <p className="text-xs text-green-400 uppercase tracking-wide font-medium">Declaration</p>
          <p className="text-sm text-zinc-100 leading-relaxed italic">&ldquo;{answers.declaration}&rdquo;</p>
          {answers.realName && (
            <p className="text-xs text-zinc-500 text-right">— {answers.realName}</p>
          )}
        </div>
      )}

      {/* PEAR Statement */}
      <div className="p-5 rounded-xl border border-blue-600/30 bg-blue-600/5 text-left space-y-3">
        <p className="text-xs text-blue-400 uppercase tracking-wide font-medium">Goal Statement</p>
        <p className="text-base text-zinc-100 leading-relaxed">&ldquo;{pearStatement}&rdquo;</p>
        <button
          type="button"
          onClick={copyStatement}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy statement"}
        </button>
      </div>

      <div className="text-sm text-zinc-400 space-y-1">
        <p>Read your declaration every morning.</p>
        <p>Feel it. Then act on it.</p>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
