"use client";

import { useEffect, useState } from "react";
import { UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProductivityStats({ refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase.from("team_members").select("id, name, role").order("name"),
      supabase.from("tasks").select("assignee, status"),
    ]).then(([teamResult, taskResult]) => {
      if (!active) return;
      if (teamResult.error || taskResult.error) setError(teamResult.error?.message || taskResult.error?.message || "Could not load team statistics.");
      const grouped = new Map((teamResult.data || []).map((member) => [member.name, { ...member, assigned: 0, done: 0 }]));
      (taskResult.data || []).forEach((task) => {
        if (!task.assignee) return;
        const member = grouped.get(task.assignee) || { id: task.assignee, name: task.assignee, role: "", assigned: 0, done: 0 };
        member.assigned += 1;
        if (task.status === "DONE") member.done += 1;
        grouped.set(task.assignee, member);
      });
      setRows([...grouped.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-semibold text-slate-950">Team performance</h2><p className="mt-1 text-sm text-slate-500">Completed work by owner</p></div>
        <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><UsersRound size={18} aria-hidden="true" /></span>
      </div>
      {error ? <p role="alert" className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">{error}</p> : loading ? <p className="py-8 text-center text-sm text-slate-500">Loading team performance...</p> : rows.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-8 text-center"><p className="text-sm font-medium text-slate-700">No team members yet</p><p className="mt-1 text-xs text-slate-500">Add teammates to see their progress here.</p></div> : (
        <div className="space-y-4">
          {rows.map((row) => {
            const percent = row.assigned ? Math.round((row.done / row.assigned) * 100) : 0;
            return <div key={row.id}>
              <div className="mb-2 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{row.name}</p><p className="text-xs text-slate-500">{row.done} of {row.assigned} tasks complete</p></div><span className="text-sm font-semibold text-blue-700">{percent}%</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="graph-bar h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} /></div>
            </div>;
          })}
        </div>
      )}
    </section>
  );
}
