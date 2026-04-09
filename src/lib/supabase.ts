import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tables = {
  coaches: {
    Row: { id: string; name: string; created_at: string };
    Insert: { id?: string; name: string; created_at?: string };
    Update: { name?: string };
  };
  students: {
    Row: { id: string; coach_id: string; name: string; created_at: string };
    Insert: { id?: string; coach_id: string; name: string; created_at?: string };
    Update: { name?: string };
  };
  goals: {
    Row: {
      id: string;
      student_id: string;
      templateId: string;
      answers: Record<string, string>;
      pearStatement: string;
      declaration: string;
      declarationMeaning: string;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      student_id: string;
      templateId: string;
      answers: Record<string, string>;
      pearStatement: string;
      declaration: string;
      declarationMeaning?: string;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      templateId?: string;
      answers?: Record<string, string>;
      pearStatement?: string;
      declaration?: string;
      declarationMeaning?: string;
      updated_at?: string;
    };
  };
};
