"use client";
// ─── APA Wizard — 7-step goal wizard ─────────────────────────────────────────

import { useState, useCallback } from "react";
import { GoalTypeStep } from "./steps/GoalTypeStep";
import { TemplateStep } from "./steps/TemplateStep";
import { SampleStep } from "./steps/SampleStep";
import { ContextStep } from "./steps/ContextStep";
import { QuestionsStep } from "./steps/QuestionsStep";
import { PreviewStep } from "./steps/PreviewStep";
import { SignoffStep } from "./steps/SignoffStep";
import { saveGoalRecord } from "@/lib/storage";
import { buildGoalRecord } from "@/lib/pearBuilder";
import { SUBCATEGORY_TO_TEMPLATE } from "@/lib/data/goal-templates";
import type { GoalType, WizardState } from "@/lib/types";
import { X } from "lucide-react";

interface Props {
  studentId: string;
  studentName: string;
  initialGoalType?: GoalType;
  existingAnswers?: Record<string, string>;
  existingTemplateId?: string;
  existingSubCategory?: string;
  existingSampleId?: string;
  onClose: () => void;
  onSaved: () => void;
}

// Step indices
const STEP_GOAL_TYPE = 0;
const STEP_TEMPLATE = 1;
const STEP_SAMPLE = 2;
const STEP_CONTEXT = 3;
const STEP_QUESTIONS = 4;
const STEP_PREVIEW = 5;
const STEP_SIGNOFF = 6;

const STEP_LABELS = ["Goal Type", "Focus Area", "Sample", "Context", "Details", "Preview", "Done"];

export function APAWizard({
  studentId,
  studentName,
  initialGoalType,
  existingAnswers,
  existingTemplateId,
  existingSubCategory,
  existingSampleId,
  onClose,
  onSaved,
}: Props) {
  const isEditing = !!existingAnswers && !!existingTemplateId;

  const [state, setState] = useState<WizardState>({
    step: isEditing ? STEP_QUESTIONS : (initialGoalType ? STEP_TEMPLATE : STEP_GOAL_TYPE),
    goalType: initialGoalType || null,
    subCategory: existingSubCategory || null,
    templateId: existingTemplateId || null,
    selectedSampleId: existingSampleId !== undefined ? existingSampleId : null,
    answers: existingAnswers || {},
  });

  const setStep = (step: number) => setState(s => ({ ...s, step }));

  const setAnswer = useCallback((key: string, value: string) => {
    setState(s => ({ ...s, answers: { ...s.answers, [key]: value } }));
  }, []);

  function selectGoalType(type: GoalType) {
    setState(s => ({ ...s, goalType: type, step: STEP_TEMPLATE }));
  }

  function selectSubCategory(subCat: string) {
    const templateId = SUBCATEGORY_TO_TEMPLATE[subCat] || subCat;
    setState(s => ({ ...s, subCategory: subCat, templateId, step: STEP_SAMPLE }));
  }

  function selectSample(sampleId: string | null) {
    setState(s => ({ ...s, selectedSampleId: sampleId, step: STEP_CONTEXT }));
  }

  function handleSave() {
    if (!state.goalType || !state.templateId || !state.subCategory) return;
    try {
      const record = buildGoalRecord(
        studentId,
        state.goalType,
        state.templateId,
        state.subCategory,
        state.answers,
        state.selectedSampleId
      );
      saveGoalRecord(record);
      setState(s => ({ ...s, step: STEP_SIGNOFF }));
    } catch (e) {
      console.error("Failed to save goal:", e);
    }
  }

  const currentStep = state.step;
  const progress = Math.round((currentStep / (STEP_LABELS.length - 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs text-zinc-500">Action Planner · {studentName}</p>
              <p className="text-sm font-medium text-zinc-200">{STEP_LABELS[currentStep]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress bar */}
        {currentStep < STEP_SIGNOFF && (
          <div className="h-0.5 bg-zinc-800">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {currentStep === STEP_GOAL_TYPE && (
            <GoalTypeStep onSelect={selectGoalType} />
          )}

          {currentStep === STEP_TEMPLATE && state.goalType && (
            <TemplateStep
              goalType={state.goalType}
              onSelect={selectSubCategory}
              onBack={() => setStep(STEP_GOAL_TYPE)}
            />
          )}

          {currentStep === STEP_SAMPLE && state.templateId && (
            <SampleStep
              templateId={state.templateId}
              onSelect={selectSample}
              onBack={() => setStep(STEP_TEMPLATE)}
            />
          )}

          {currentStep === STEP_CONTEXT && state.templateId && (
            <ContextStep
              templateId={state.templateId}
              sampleId={state.selectedSampleId}
              answers={state.answers}
              onChange={setAnswer}
              onNext={() => setStep(STEP_QUESTIONS)}
              onBack={() => setStep(STEP_SAMPLE)}
            />
          )}

          {currentStep === STEP_QUESTIONS && state.templateId && (
            <QuestionsStep
              templateId={state.templateId}
              sampleId={state.selectedSampleId}
              answers={state.answers}
              onChange={setAnswer}
              onNext={() => setStep(STEP_PREVIEW)}
              onBack={() => setStep(STEP_CONTEXT)}
              onChangeTemplate={() => setStep(STEP_TEMPLATE)}
            />
          )}

          {currentStep === STEP_PREVIEW && state.templateId && (
            <PreviewStep
              templateId={state.templateId}
              sampleId={state.selectedSampleId}
              answers={state.answers}
              onChange={setAnswer}
              onSave={handleSave}
              onBack={() => setStep(STEP_QUESTIONS)}
            />
          )}

          {currentStep === STEP_SIGNOFF && state.goalType && state.templateId && (
            <SignoffStep
              goalType={state.goalType}
              templateId={state.templateId}
              sampleId={state.selectedSampleId}
              answers={state.answers}
              studentName={studentName}
              onDone={() => { onSaved(); onClose(); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
