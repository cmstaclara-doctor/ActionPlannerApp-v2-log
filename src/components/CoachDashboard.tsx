"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Plus, Pencil, RotateCcw } from "lucide-react";
import { getCoachId, fetchStudentsForCoach, createStudent, updateStudent } from "@/lib/supabase-operations";

interface Student {
  id: string;
  coach_id: string;
  name: string;
  created_at: string;
}

const SEEDED_STUDENTS = ["Student 1", "Student 2", "Student 3", "Student 4", "Student 5", "Student 6"];

export function CoachDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [coachId, setCoachId] = useState("");

  // Check killpill
  useEffect(() => {
    const cutoffDate = new Date("2026-06-21T23:59:59Z");
    if (new Date() > cutoffDate) {
      document.body.innerHTML =
        '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; background: #0f0f0f; color: #999;"><div style="text-align: center;"><h1 style="font-size: 2rem; margin: 0 0 1rem 0;">Program Ended</h1><p style="font-size: 1rem; margin: 0;">LEAP 99 concluded on June 21, 2026. Thank you for your participation.</p></div></div>';
      return;
    }
  }, []);

  // Load students from DB on mount
  useEffect(() => {
    async function load() {
      const id = getCoachId();
      setCoachId(id);

      const dbStudents = await fetchStudentsForCoach(id);

      // If no students, seed with default ones
      if (dbStudents.length === 0) {
        const seeded: Student[] = SEEDED_STUDENTS.map((name) => ({
          id: `local_${name.toLowerCase().replace(/\s+/g, "_")}`,
          coach_id: id,
          name,
          created_at: new Date().toISOString(),
        }));
        setStudents(seeded);
      } else {
        setStudents(dbStudents);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleAddStudent() {
    if (!newStudentName.trim() || students.length >= 6) return;

    const newStudent = await createStudent(coachId, newStudentName.trim());
    if (newStudent) {
      setStudents([...students, newStudent]);
      setNewStudentName("");
    }
  }

  async function handleSaveName(studentId: string) {
    if (!editingName.trim()) return;
    const success = await updateStudent(studentId, editingName.trim());
    if (success) {
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, name: editingName.trim() } : s))
      );
    }
    setEditingId(null);
    setEditingName("");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const emptySlots = 6 - students.length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Coach Dashboard <span className="text-primary">for LEAP 99</span>
          </h1>
          <p className="text-xs text-muted-foreground">by Doc Kalodski · Multiuser</p>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="rounded-2xl border border-border bg-card p-4 space-y-3 transition-all hover:border-primary/30"
            >
              {/* Student name */}
              <div>
                {editingId === student.id ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName(student.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="flex-1 text-sm bg-transparent border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveName(student.id)}
                      className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(student.id);
                      setEditingName(student.name);
                    }}
                    className="w-full text-left group"
                  >
                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {student.name}
                    </p>
                    <span className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Pencil className="h-2.5 w-2.5" />
                    </span>
                  </button>
                )}
              </div>

              {/* Load/Edit button */}
              <Link
                href={`/student/${student.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors w-full justify-center"
              >
                Edit Goals
              </Link>
            </div>
          ))}

          {/* Empty slots */}
          {emptySlots > 0 && emptySlots <= 6 && (
            <div className="rounded-2xl border border-dashed border-border/40 bg-muted/5 p-4 flex flex-col items-center justify-center min-h-32 space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                {emptySlots > 1 ? `${emptySlots} slots available` : "1 slot available"}
              </p>
              {emptySlots > 0 && (
                <div className="flex gap-1 w-full">
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                    placeholder="Student name…"
                    className="flex-1 text-xs bg-transparent border border-input rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddStudent}
                    disabled={!newStudentName.trim()}
                    className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Seeded note */}
        {students.length > 0 &&
          students.some((s) => SEEDED_STUDENTS.includes(s.name)) && (
            <div className="rounded-lg border border-border/30 bg-muted/5 p-3">
              <p className="text-xs text-muted-foreground">
                💾 Seeded students shown until first save. Once saved, all goals sync to the cloud.
              </p>
            </div>
          )}
      </div>
