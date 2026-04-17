"use client";
// ─── SchedulePicker ───────────────────────────────────────────────────────────
// Produces "Mon:1,Tue:2,Fri:3" format consumed by goal-templates.ts
// parseSchedule() in goal-templates.ts is private — we produce the same format.

import { useState, useEffect } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayEntry { day: string; hours: number; active: boolean }

function parseValue(val: string): DayEntry[] {
  if (!val || !val.trim()) {
    return DAYS.map(d => ({ day: d, hours: d === "Sat" || d === "Sun" ? 0 : 1, active: d !== "Sat" && d !== "Sun" }));
  }
  const map: Record<string, number> = {};
  val.split(",").forEach(e => {
    const [d, h] = e.split(":");
    if (d && h) map[d.trim()] = parseFloat(h) || 0;
  });
  return DAYS.map(d => ({ day: d, hours: map[d] ?? 0, active: (map[d] ?? 0) > 0 }));
}

function toValue(entries: DayEntry[]): string {
  return entries.filter(e => e.active && e.hours > 0).map(e => `${e.day}:${e.hours}`).join(",");
}

interface Props { value?: string; onChange: (val: string) => void }

export function SchedulePicker({ value, onChange }: Props) {
  const [entries, setEntries] = useState<DayEntry[]>(() => parseValue(value || ""));

  useEffect(() => {
    setEntries(parseValue(value || ""));
  }, [value]);

  function toggleDay(day: string) {
    const next = entries.map(e => {
      if (e.day !== day) return e;
      const active = !e.active;
      return { ...e, active, hours: active && e.hours === 0 ? 1 : e.hours };
    });
    setEntries(next);
    onChange(toValue(next));
  }

  function setHours(day: string, raw: string) {
    const hours = Math.max(0, Math.min(8, parseFloat(raw) || 0));
    const next = entries.map(e => e.day === day ? { ...e, hours, active: hours > 0 } : e);
    setEntries(next);
    onChange(toValue(next));
  }

  const weekly = entries.filter(e => e.active).reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {entries.map(e => (
          <div key={e.day} className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => toggleDay(e.day)}
              className={`w-10 h-8 rounded text-xs font-medium transition-colors ${
                e.active
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {e.day}
            </button>
            {e.active && (
              <input
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={e.hours}
                onChange={ev => setHours(e.day, ev.target.value)}
                className="w-10 text-center text-xs bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-zinc-100"
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-400">
        {weekly > 0 ? `${weekly} hrs/week — ${entries.filter(e => e.active).map(e => e.day).join(", ")}` : "No days selected"}
      </p>
    </div>
  );
}
