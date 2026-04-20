"use client";

import { useState, useEffect } from "react";
import { getStudents, addStudent, updateStudentName, deleteStudent, seedDefaultStudents, getGoalRecord, getCoachInfo, setCoachInfo, getStudentDeclaration, setStudentDeclaration } from "@/lib/storage";
import type { Student, GoalType } from "@/lib/types";
import { GOAL_TYPE_META } from "@/lib/constants";
import { Plus, Pencil, Check, Trash2, ChevronRight, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import Link from "next/link";

const GOAL_TYPES: GoalType[] = ["enrollment", "personal", "professional"];

// Wizard disabled after Graduation day — goals remain readable, no new entries
const WIZARD_EXPIRY = new Date("2026-06-21T23:59:59+08:00"); // Jun 21 PH time

export function isWizardExpired(): boolean {
  return new Date() > WIZARD_EXPIRY;
}

function DeclarationField({ studentId }: { studentId: string }) {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const decl = await getStudentDeclaration(studentId);
      setText(decl);
      setLoaded(true);
    })();
  }, [studentId]);

  async function handleBlur() {
    await setStudentDeclaration(studentId, text);
  }

  if (!loaded) return null;

  return (
    <div className="px-4 pb-3 border-t border-zinc-700/50 pt-2.5">
      <p className="text-xs text-zinc-600 uppercase tracking-wide font-medium mb-1.5">Declaration</p>
      <textarea
        rows={2}
        placeholder="The grandest version of my greatest vision for myself is…"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-blue-500 resize-none"
      />
    </div>
  );
}

export function CoachDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [goalStatuses, setGoalStatuses] = useState<Record<string, Record<GoalType, boolean>>>({});
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [adding, setAdding] = useState(false);
  const [coachName, setCoachNameState] = useState("");
  const [councilName, setCouncilNameState] = useState("");
  const [editingCoach, setEditingCoach] = useState(false);
  const expired = isWizardExpired();

  useEffect(() => {
    (async () => {
      await seedDefaultStudents();
      const stus = await getStudents();
      setStudents(stus);

      // Pre-fetch all goal records
      const statuses: Record<string, Record<GoalType, boolean>> = {};
      for (const student of stus) {
        statuses[student.id] = { enrollment: false, personal: false, professional: false };
        for (const gt of GOAL_TYPES) {
          const record = await getGoalRecord(student.id, gt);
          statuses[student.id][gt] = !!record;
        }
      }
      setGoalStatuses(statuses);

      const info = await getCoachInfo();
      setCoachNameState(info.coachName);
      setCouncilNameState(info.councilName);
    })();
  }, []);

  async function refresh() {
    const stus = await getStudents();
    setStudents(stus);
    const statuses: Record<string, Record<GoalType, boolean>> = {};
    for (const student of stus) {
      statuses[student.id] = { enrollment: false, personal: false, professional: false };
      for (const gt of GOAL_TYPES) {
        const record = await getGoalRecord(student.id, gt);
        statuses[student.id][gt] = !!record;
      }
    }
    setGoalStatuses(statuses);
  }

  async function handleSaveCoach() {
    await setCoachInfo(coachName, councilName);
    setEditingCoach(false);
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    await addStudent(newName.trim());
    setNewName("");
    setAdding(false);
    await refresh();
  }

  async function handleRename() {
    if (!editingId || !editingName.trim()) return;
    await updateStudentName(editingId, editingName.trim());
    setEditingId(null);
    setEditingName("");
    await refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name} and all their goals? This cannot be undone.`)) return;
    await deleteStudent(id);
    await refresh();
  }

  async function handleResetStudents() {
    if (!confirm("Reset all students to Student 1–6? This will delete all current students and their goals.")) return;
    const all = await getStudents();
    for (const s of all) await deleteStudent(s.id);
    // Re-seed
    const defaults = ["Student1", "Student2", "Student3", "Student4", "Student5", "Student6"];
    for (const name of defaults) await addStudent(name);
    await refresh();
  }

  function getGoalStatusForStudent(studentId: string) {
    const statuses = goalStatuses[studentId] || {};
    return GOAL_TYPES.map(gt => ({ gt, has: statuses[gt] }));
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">ActionPlanning App</h1>
        <p className="text-sm text-zinc-500">LEAP 99 v2.0 · by Doc Kalodski</p>
      </div>

      {/* Coach / Council info */}
      <div className="mb-6 p-4 rounded-xl border border-zinc-700 bg-zinc-800/40 space-y-3">
        {editingCoach ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Coach name"
              value={coachName}
              onChange={e => setCoachNameState(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveCoach(); if (e.key === "Escape") setEditingCoach(false); }}
              autoFocus
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Council name"
              value={councilName}
              onChange={e => setCouncilNameState(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSaveCoach(); if (e.key === "Escape") setEditingCoach(false); }}
              className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveCoach} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                Save
              </button>
              <button type="button" onClick={() => setEditingCoach(false)} className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-zinc-100">
                {coachName || <span className="text-zinc-500 italic">Coach name not set</span>}
              </p>
              <p className="text-xs text-zinc-500">
                {councilName || <span className="italic">Council name not set</span>}
              </p>
            </div>
            <button
              type="button"
              title="Edit coach info"
              onClick={() => setEditingCoach(true)}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Student list header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Students</p>
        {!expired && (
          <button
            type="button"
            title="Reset to default Student 1–6"
            onClick={handleResetStudents}
            className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <RotateCcw size={11} /> Reset defaults
          </button>
        )}
      </div>

      {/* Student list */}
      <div className="space-y-3">
        {students.map(student => {
          const statuses = getGoalStatusForStudent(student.id);
          const completedCount = statuses.filter(s => s.has).length;
          const isEditing = editingId === student.id;

          return (
            <div
              key={student.id}
              className="rounded-xl border border-zinc-700 bg-zinc-800/40 hover:border-zinc-600 transition-colors overflow-hidden"
            >
              {/* Top row: name + badges + actions */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Student name"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                      />
                      <button type="button" title="Save name" onClick={handleRename} className="text-green-400 hover:text-green-300">
                        <Check size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-100 truncate">{student.name}</span>
                        {!expired && (
                          <button
                            type="button"
                            title="Edit name"
                            onClick={() => { setEditingId(student.id); setEditingName(student.name); }}
                            className="text-zinc-600 hover:text-zinc-400 transition-colors flex-shrink-0"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {statuses.map(({ gt, has }) => {
                          const meta = GOAL_TYPE_META[gt];
                          return (
                            <span
                              key={gt}
                              title={meta.label}
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border ${
                                has
                                  ? "border-green-600/40 bg-green-600/10 text-green-400"
                                  : "border-zinc-700 bg-zinc-800/60 text-zinc-600"
                              }`}
                            >
                              {has ? <CheckCircle2 size={9} /> : <Clock size={9} />}
                              <span className="hidden sm:inline">{gt.charAt(0).toUpperCase() + gt.slice(1)}</span>
                              <span className="sm:hidden">{meta.icon}</span>
                            </span>
                          );
                        })}
                        <span className="text-xs text-zinc-600 ml-1">{completedCount}/3</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {!expired && (
                    <button
                      type="button"
                      title="Delete student"
                      onClick={() => handleDelete(student.id, student.name)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <Link
                    href={`/${student.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm"
                  >
                    Open <ChevronRight size={13} />
                  </Link>
                </div>
              </div>

              {/* Declaration — always editable, sits below the top row */}
              <DeclarationField studentId={student.id} />
            </div>
          );
        })}

        {students.length === 0 && (
          <div className="text-center py-10 text-zinc-500 text-sm">
            No students yet. Add one below.
          </div>
        )}
      </div>

      {/* Add student — hidden after wizard expiry */}
      {!expired && (
        <div className="mt-6">
          {adding ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Student name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setAdding(false); }}
                autoFocus
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setAdding(false); setNewName(""); }}
                className="px-3 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Plus size={16} />
              Add student
            </button>
          )}
        </div>
      )}
    </div>
  );
}
