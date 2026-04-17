// ─── Core Types for APA Wizard ───────────────────────────────────────────────

export type GoalType = "enrollment" | "personal" | "professional";

export interface Student {
  id: string;
  name: string;
  createdAt: string;
  ggStudentId?: string;   // GoalGetter user ID for transfer
}

export interface GoalRecord {
  studentId: string;
  goalType: GoalType;
  templateId: string;
  subCategory: string;
  answers: Record<string, string>;
  pearStatement: string;
  smarter: {
    goalStatement?: string;
    specificDetails: string;
    measurableCriteria: string;
    achievableResources: string;
    relevantAlignment: string;
    endDate: string;
    excitingMotivation: string;
    rewardingBenefits: string;
  };
  milestones: Array<{
    weekNumber: number;
    weekDates: string;            // e.g. "Apr 27–May 3" — required for GG import
    description: string;
    cumulativePercentage: number;
    actions: Array<{ text: string; days: number[] }>;
    results: Array<{ text: string }>;
  }>;
  savedAt: string;
}

export interface WizardState {
  step: number;
  goalType: GoalType | null;
  subCategory: string | null;
  templateId: string | null;
  selectedSampleId: string | null;
  answers: Record<string, string>;
}

// Sub-category display metadata
export interface SubCategoryMeta {
  id: string;
  label: string;
  description: string;
  goalType: GoalType;
}
