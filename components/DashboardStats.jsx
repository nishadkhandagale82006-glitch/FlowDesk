"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, ClipboardList, Clock3, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getTaskStatus } from "@/lib/workflow";

const cards = [
  { label: "Total tasks", key: "total", Icon: ClipboardList, tone: "blue" },
  { label: "Completed", key: "done", Icon: Check, tone: "green" },
  { label: "In progress", key: "progress", Icon: Clock3, tone: "blue" },
  { label: "Overdue", key: "overdue", Icon: AlertTriangle, tone: "green" },
  { label: "High priority", key: "high", Icon: Flag, tone: "blue" },
];

export default function DashboardStats({ refreshKey = 0 }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    supabase.from("tasks").select("status, priority, due_at").then(({ data, error: queryError }) => {
      if (!active) return;
      setTasks(data || []);
      setError(queryError?.message || "");
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshKey]);

  const counts = tasks.reduce((result, task) => {
    result.total += 1;
    const status = getTaskStatus(task);
    if (status === "DONE") result.done += 1;
    if (status === "IN_PROGRESS") result.progress += 1;
    if (status === "OVERDUE") result.overdue += 1;
    if (task.priority === "HIGH") result.high += 1;
    return result;
  }, { total: 0, done: 0, progress: 0, overdue: 0, high: 0 });

  return (
    <section aria-label="Task overview">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Workspace overview</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Good work starts here</h1>
        <p className="mt-2 text-base text-slate-600">A live view of what your team is moving forward.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Could not load task statistics: {error}</p>}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {cards.map(({ label, key, Icon, tone }) => (
          <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "green" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}><Icon size={19} aria-hidden="true" /></span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">{loading ? "—" : counts[key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
