"use client";

import { useEffect, useState } from "react";
import { Activity, Check, Clock3, Plus, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDeadline } from "@/lib/workflow";

function iconFor(action) {
  if (action.includes("created")) return Plus;
  if (action.includes("completed")) return Check;
  if (action.includes("member")) return UsersRound;
  return Clock3;
}

export default function RecentActivity({ refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("task_activity")
      .select("id, action, target_type, target_label, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data, error: fetchError }) => {
        if (!isCurrent) return;
        setItems(data || []);
        setError(fetchError?.message || "");
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Recent activity</h3>
          <p className="mt-1 text-sm text-gray-500">The latest changes across your workspace</p>
        </div>
        <span className="rounded-full bg-indigo-50 p-2.5 text-indigo-600">
          <Activity size={17} strokeWidth={1.7} aria-hidden="true" />
        </span>
      </div>

      {loading ? (
        <p className="rounded-xl bg-gray-50 px-4 py-5 text-sm text-gray-500">Loading activity...</p>
      ) : error ? (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-800">
          Activity needs the database migration in <code>supabase/migrations/002_task_details_and_activity.sql</code>.
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-gray-50 px-4 py-6 text-center">
          <p className="text-sm font-medium text-gray-700">No recent changes yet</p>
          <p className="mt-1 text-xs text-gray-500">Task and team updates will show here.</p>
        </div>
      ) : (
        <ol className="space-y-4">
          {items.map((item, index) => {
            const Icon = iconFor(item.action.toLowerCase());
            return (
              <li key={item.id} className="flex gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                  <Icon size={16} strokeWidth={1.7} aria-hidden="true" />
                  {index < items.length - 1 && <span className="absolute left-1/2 top-9 h-5 w-px -translate-x-1/2 bg-gray-200" />}
                </span>
                <div className="min-w-0 flex-1 border-b border-gray-100 pb-3">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {item.action}: <span className="font-medium">{item.target_label}</span>
                  </p>
                  <time className="mt-1 block text-xs text-gray-500" dateTime={item.created_at}>
                    {formatDeadline(item.created_at, { time: true })}
                  </time>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
