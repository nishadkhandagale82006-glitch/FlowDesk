"use client";

import { useEffect, useState } from "react";
import { Flame, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayStreak(dailyCounts, today) {
  let cursor = new Date(today);
  if (!dailyCounts[dateKey(cursor)]) cursor = new Date(cursor.getTime() - DAY_MS);

  let streak = 0;
  while (dailyCounts[dateKey(cursor)]) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

function completionRing(percent) {
  const degrees = percent * 3.6;
  return `conic-gradient(#16a34a 0deg ${degrees}deg, #dbeafe ${degrees}deg 360deg)`;
}

function heatColor(count) {
  if (!count) return "bg-slate-100";
  if (count === 1) return "bg-emerald-200";
  if (count === 2) return "bg-emerald-300";
  if (count <= 4) return "bg-emerald-500";
  return "bg-emerald-700";
}

export default function ProductivityStats({ refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      const [teamResult, taskResult, activityResult] = await Promise.all([
        supabase.from("team_members").select("id, name, role").order("name"),
        supabase.from("tasks").select("assignee, status"),
        supabase.from("task_activity").select("id, action, member_name, created_at").eq("action", "Task completed"),
      ]);

      let completionHistory = activityResult.data || [];
      let missingMemberColumn = false;
      if (activityResult.error) {
        const fallback = await supabase
          .from("task_activity")
          .select("id, action, created_at")
          .eq("action", "Task completed");
        completionHistory = fallback.data || [];
        missingMemberColumn = !fallback.error;
      }

      if (!active) return;
      setError(teamResult.error?.message || taskResult.error?.message || "");
      setHistoryError(missingMemberColumn || Boolean(activityResult.error && !completionHistory.length));
      setHistory(completionHistory);

      const grouped = new Map((teamResult.data || []).map((member) => [member.name, {
        ...member,
        assigned: 0,
        done: 0,
        completedByDate: {},
      }]));

      for (const task of taskResult.data || []) {
        if (!task.assignee) continue;
        const member = grouped.get(task.assignee) || {
          id: task.assignee,
          name: task.assignee,
          role: "",
          assigned: 0,
          done: 0,
          completedByDate: {},
        };
        member.assigned += 1;
        if (task.status === "DONE") member.done += 1;
        grouped.set(task.assignee, member);
      }

      for (const item of completionHistory) {
        if (!item.member_name || !item.created_at) continue;
        const member = grouped.get(item.member_name);
        if (!member) continue;
        const key = dateKey(new Date(item.created_at));
        member.completedByDate[key] = (member.completedByDate[key] || 0) + 1;
      }

      const today = new Date();
      setRows([...grouped.values()]
        .map((member) => ({ ...member, streak: dayStreak(member.completedByDate, today) }))
        .sort((a, b) => {
          const rateA = a.assigned ? a.done / a.assigned : 0;
          const rateB = b.assigned ? b.done / b.assigned : 0;
          return rateB - rateA || b.done - a.done || a.name.localeCompare(b.name);
        }));
      setLoading(false);
    }

    fetchStats();
    return () => { active = false; };
  }, [refreshKey]);

  const today = new Date();
  const dailyTeamCounts = {};
  for (const item of history) {
    if (!item.created_at) continue;
    const key = dateKey(new Date(item.created_at));
    dailyTeamCounts[key] = (dailyTeamCounts[key] || 0) + 1;
  }
  const calendarDays = Array.from({ length: 56 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 55 + index);
    return { date, count: dailyTeamCounts[dateKey(date)] || 0 };
  });
  const best = rows.find((row) => row.assigned > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Team performance</h2>
          <p className="mt-1 text-sm text-slate-500">Completion rates and daily momentum</p>
        </div>
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><UsersRound size={18} aria-hidden="true" /></span>
      </div>

      {error ? <p role="alert" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{error}</p> : loading ? <p className="py-8 text-center text-sm text-slate-500">Loading team performance...</p> : rows.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-8 text-center"><p className="text-sm font-medium text-slate-700">No team members yet</p><p className="mt-1 text-xs text-slate-500">Add teammates to see their progress here.</p></div> : (
        <>
          {best && <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Leading by completion rate: <span className="font-bold">{best.name}</span></p>}

          <div className="space-y-3">
            {rows.map((row, index) => {
              const percent = row.assigned ? Math.round((row.done / row.assigned) * 100) : 0;
              return (
                <div key={row.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                  <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: completionRing(percent) }} aria-label={`${row.name}: ${percent}% complete`}>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-[11px] font-bold text-slate-800">{percent}%</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-slate-900">{row.name}</span>
                      {index === 0 && row.assigned > 0 && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">TOP</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{row.done} of {row.assigned} completed</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><Flame size={13} aria-hidden="true" />{row.streak} day streak</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div><h3 className="text-sm font-semibold text-slate-900">Team streaks</h3><p className="text-xs text-slate-500">Daily task completions · last 8 weeks</p></div>
              <span className="text-xs font-medium text-slate-500">Less <span className="mx-1 inline-flex gap-0.5 align-middle">{[0, 1, 3, 5].map((count) => <i key={count} className={`h-2.5 w-2.5 rounded-[3px] ${heatColor(count)}`} />)}</span> More</span>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-1" aria-label="Task completion activity for the last 56 days">
              {calendarDays.map(({ date, count }) => <span key={dateKey(date)} title={`${count} completed ${date.toLocaleDateString()}`} className={`h-3 w-3 rounded-[3px] ${heatColor(count)}`} />)}
            </div>
            {historyError && <p className="mt-3 text-xs leading-5 text-slate-500">Run <code>supabase/migrations/002_task_details_and_activity.sql</code> to save completions by team member and show personal streaks.</p>}
          </div>
        </>
      )}
    </section>
  );
}
