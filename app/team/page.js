"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { Plus, UsersRound, CircleAlert } from "lucide-react";
import { logActivity } from "@/lib/workflow";

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", role: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch team members and all tasks in parallel
  async function fetchData() {
    const [{ data: teamData }, { data: taskData }] = await Promise.all([
      supabase.from("team_members").select("*").order("name"),
      supabase.from("tasks").select("assignee, status"),
    ]);
    setTeam(teamData || []);
    setTasks(taskData || []);
    setLoading(false);
  }

  useEffect(() => {
    let isCurrent = true;

    Promise.all([
      supabase.from("team_members").select("*").order("name"),
      supabase.from("tasks").select("assignee, status"),
    ]).then(([{ data: teamData, error: teamError }, { data: taskData, error: taskError }]) => {
      if (!isCurrent) return;
      setTeam(teamData || []);
      setTasks(taskData || []);
      setError(teamError?.message || taskError?.message || "");
      setLoading(false);
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  function getStats(name) {
    const memberTasks = tasks.filter((t) => t.assignee === name);
    const done = memberTasks.filter((t) => t.status === "DONE").length;
    return { total: memberTasks.length, done };
  }

  async function handleAddMember(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    setSaving(true);
    setError("");
    const { error: insertError } = await supabase.from("team_members").insert({ name: form.name.trim(), role: form.role.trim(), email: form.email.trim() || null });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    const activityError = await logActivity("Team member added", "team", form.name.trim());
    if (activityError) setError("Member added successfully. Apply the activity migration to enable the activity feed.");
    setForm({ name: "", role: "", email: "" });
    setSaving(false);
    fetchData(); // refresh the cards
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 pb-20 md:pb-0">
        {/* Page header */}
        <div className="px-4 md:px-8 py-6 bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
          <h2 className="text-3xl font-medium text-gray-900 tracking-tight">Team</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your team members and view their workload
          </p>
        </div>

        <main className="flex-1 px-5 md:px-10 py-8 max-w-7xl mx-auto w-full space-y-10">
          {error && <p role="alert" className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800"><CircleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400">
              <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium">Loading team data...</p>
            </div>
          ) : (
            <>
              {/* Empty state for team */}
              {team.length === 0 && (
                <div className="px-6 py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-gray-200">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                    <UsersRound size={23} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">No team members</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-sm mb-6">
                    Add your first team member below to start assigning tasks!
                  </p>
                </div>
              )}

              {/* Team member cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {team.map((member) => {
                  const stats = getStats(member.name);
                  const percent =
                    stats.total > 0
                      ? Math.round((stats.done / stats.total) * 100)
                      : 0;

                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Name + role */}
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-gray-950 font-semibold text-lg bg-indigo-500 shadow-sm"
                        >
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg leading-tight">
                            {member.name}
                          </p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                      </div>

                      {/* Stat boxes */}
                      <div className="grid grid-cols-2 gap-3 text-center mb-5">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <p className="text-2xl font-black text-gray-800">
                            {stats.total}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mt-1">Assigned</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                          <p className="text-2xl font-black text-emerald-600">
                            {stats.done}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/70 mt-1">Completed</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                          <span>Completion Rate</span>
                          <span className={percent === 100 ? "text-emerald-600 font-bold" : "text-gray-900 font-bold"}>{percent}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`graph-bar h-2 rounded-full transition-all ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add team member form */}
          <div id="add-member" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:w-2/3 xl:w-1/2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Add Team Member</h3>
                <p className="text-xs text-gray-500">Expand your FlowDesk workspace</p>
              </div>
            </div>

            <form
              onSubmit={handleAddMember}
              className="flex flex-col sm:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sunita"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Email <span className="normal-case font-normal tracking-normal">(optional)</span></label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@business.com" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white text-gray-900" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Role
                </label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="e.g. Accounts"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 focus:bg-white text-gray-900"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 text-white text-base font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? "Adding..." : <><Plus size={15} className="mr-2 inline" aria-hidden="true" />Add member</>}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
