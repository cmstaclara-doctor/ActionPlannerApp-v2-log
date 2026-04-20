"use client";

import { useState, useEffect } from "react";
import { getGoalRecord, deleteGoalRecord } from "@/lib/storage";
import { GOAL_TEMPLATES } from "@/lib/data/goal-templates";
import { APAWizard } from "./APAWizard";
import { GOAL_TYPE_META } from "@/lib/constants";
import { isWizardExpired } from "./CoachDashboard";
import type { GoalRecord, GoalType } from "@/lib/types";
import { Plus, Pencil, Trash2, ArrowLeft, CheckCircle2, Clock, Target } from "lucide-react";
import Link from "next/link";

const GOAL_TYPES: GoalType[] = ["enrollment", "personal", "professional"];

interface Props {
  studentId: string;
  studentName: string;
}

interface GoalCardProps {
  goalType: GoalType;
  record: GoalRecord | null;
  expired: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onNew: () => void;
}

function GoalCard({ goalType, record, expired, onEdit, onDelete, onNew }: GoalCardProps) {
  const meta = GOAL_TYPE_META[goalType];
  const hasGoal = !!record;

  return (
    <div className={`rounded-xl border p-5 space-y-3 ${
      hasGoal ? "border-zinc-700 bg-zinc-800/40" : "border-dashed border-zinc-700 bg-zinc-900/50"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">{meta.label}</h3>
            <p className="text-xs text-zinc-500">{meta.description}</p>
          </div>
        </div>
        {hasGoal && !expired && (
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={onEdit} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors" title="Edit goal">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete goal">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {hasGoal && record ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            &ldquo;{record.pearStatement.slice(0, 140)}{record.pearStatement.length > 140 ? "…" : ""}&rdquo;
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Target size={10} /> 8-week plan</span>
              <span>{record.milestones.length} weeks</span>
            </div>
            <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full w-0" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <CheckCircle2 size={11} className="text-green-500" />
            <span>Saved {new Date(record.savedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
          </div>
        </div>
      ) : !expired ? (
        <button type="button" onClick={onNew} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors">
          <Plus size={15} />
          <span>Create {meta.label.toLowerCase()}</span>
        </button>
      ) : null}
    </div>
  );
}

export function StudentGoalPage({ studentId, studentName }: Props) {
  const [records, setRecords] = useState<Record<GoalType, GoalRecord | null>>({
    enrollment: null, personal: null, professional: null,
  });
  const [wizard, setWizard] = useState<{ goalType: GoalType; editing: boolean } | null>(null);

  async function loadData() {
    const loaded = {} as Record<GoalType, GoalRecord | null>;
    for (const gt of GOAL_TYPES) {
      loaded[gt] = await getGoalRecord(studentId, gt);
    }
    setRecords(loaded);
  }

  useEffect(() => {
    loadData();
  }, [studentId]);

  async function handleDelete(goalType: GoalType) {
    if (!confirm(`Delete ${goalType} goal for ${studentName}? This cannot be undone.`)) return;
    await deleteGoalRecord(studentId, goalType);
    await loadData();
  }

  const existingRecord = wizard ? records[wizard.goalType] : null;
  const expired = isWizardExpired();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-6 max-w-lg mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={14} /> All students
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
              <span className="text-blue-400 font-bold text-sm">{studentName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">{studentName}</h1>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <Clock size={10} />
                LEAP 99 · Apr–Jun 2026
              </p>
            </div>
          </div>
        </div>

        {/* Completion badges */}
        <div className="flex items-center gap-2">
          {GOAL_TYPES.map(gt => (
            <span key={gt} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
              records[gt] ? "border-green-600/40 bg-green-600/10 text-green-400" : "border-zinc-700 bg-zinc-800 text-zinc-500"
            }`}>
              {records[gt] ? <CheckCircle2 size={10} /> : <Clock size={10} />}
              {gt.charAt(0).toUpperCase() + gt.slice(1)}
            </span>
          ))}
        </div>

        {/* Goal Cards */}
        <div className="space-y-4">
          {GOAL_TYPES.map(gt => (
            <GoalCard
              key={gt}
              goalType={gt}
              record={records[gt]}
              expired={expired}
              onNew={() => !expired && setWizard({ goalType: gt, editing: false })}
              onEdit={() => !expired && setWizard({ goalType: gt, editing: true })}
              onDelete={() => handleDelete(gt)}
            />
          ))}
        </div>

      </div>

      {/* Wizard Modal — disabled after Jun 21 */}
      {wizard && !expired && (
        <APAWizard
          studentId={studentId}
          studentName={studentName}
          initialGoalType={wizard.goalType}
          existingAnswers={wizard.editing && existingRecord ? existingRecord.answers : undefined}
          existingTemplateId={wizard.editing && existingRecord ? existingRecord.templateId : undefined}
          existingSubCategory={wizard.editing && existingRecord ? existingRecord.subCategory : undefined}
          existingSampleId={wizard.editing && existingRecord ? (existingRecord.answers._sampleId ?? undefined) : undefined}
          onClose={() => setWizard(null)}
          onSaved={() => { loadData(); setWizard(null); }}
        />
      )}
    </div>
  );
}
