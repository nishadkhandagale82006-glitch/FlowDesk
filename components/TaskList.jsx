"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, ChevronDown, Eye, Inbox, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDeadline, getDeadline, getTaskStatus, logActivity, TASK_STATUSES } from "@/lib/workflow";
import AddTaskModal from "@/components/AddTaskModal";
import TaskDetailsModal from "@/components/TaskDetailsModal";

function priorityBadge(priority) {
  if (priority === "HIGH") return "bg-emerald-100 text-emerald-700";
  if (priority === "MEDIUM") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

function statusBadge(status) {
  if (status === "DONE") return "bg-emerald-100 text-emerald-700";
  if (status === "OVERDUE") return "bg-blue-100 text-blue-700";
  if (status === "IN_PROGRESS") return "bg-indigo-100 text-indigo-700";
  return "bg-gray-100 text-gray-700";
}

export default function TaskList({ onActivityChange }) {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingTask, setEditingTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);

  async function fetchTasks() {
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);
    setTasks(data || []);
    setError(fetchError?.message || "");
    setLoading(false);
  }

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(8),
      supabase.from("team_members").select("id, name, role").order("name"),
    ]).then(([taskResult, teamResult]) => {
      if (!isCurrent) return;
      setTasks(taskResult.data || []);
      setTeamMembers(teamResult.data || []);
      setError(taskResult.error?.message || "");
      if (teamResult.error) setNotice("Team member options could not be loaded.");
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, []);

  async function handleStatusChange(task, status) {
    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    const activityError = await logActivity(
      status === "DONE" ? "Task completed" : "Task status changed",
      "task",
      task.title,
    );
    setNotice(activityError ? "Task saved. Run the activity migration to enable the activity feed." : "Task status saved.");
    await fetchTasks();
    onActivityChange?.();
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return;
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", task.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await logActivity("Task deleted", "task", task.title);
    await fetchTasks();
    onActivityChange?.();
  }

  async function handleSaved({ activityError } = {}) {
    setShowCreate(false);
    setEditingTask(null);
    if (activityError) setNotice("Task saved. Run the activity migration to enable the activity feed.");
    await fetchTasks();
    onActivityChange?.();
  }

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-gray-900">Recent tasks</h3>
          <p className="mt-1 text-sm text-gray-500">A focused view of the work on your plate</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Create task
        </button>
      </div>

      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={`mx-5 mt-4 rounded-xl px-4 py-3 text-sm sm:mx-6 ${error ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"}`}>
          {error || notice}
          <button type="button" onClick={() => { setError(""); setNotice(""); }} className="ml-3 font-semibold underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-gray-500">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          <p className="text-sm">Loading tasks...</p>
        </div>
      ) : error && tasks.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-semibold text-gray-800">Tasks could not be loaded</p>
          <p className="mt-2 break-words text-sm text-gray-500">{error}</p>
          <button type="button" onClick={fetchTasks} className="mt-4 text-sm font-semibold text-indigo-600">Try again</button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Inbox size={23} aria-hidden="true" /></div>
          <h4 className="font-semibold text-gray-900">No tasks yet</h4>
          <p className="mt-1 max-w-xs text-sm text-gray-500">Create the first task to give your team a clear next step.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-4 text-sm font-semibold text-indigo-600">Create your first task</button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {tasks.map((task) => {
            const status = getTaskStatus(task);
            const deadline = getDeadline(task);
            return (
              <article key={task.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-gray-50 sm:px-6 md:grid-cols-[minmax(0,1.5fr)_minmax(100px,.8fr)_auto_auto] md:items-center">
                <div className="min-w-0">
                  <button type="button" onClick={() => setViewingTask(task)} className="block max-w-full truncate text-left text-base font-semibold text-gray-900 hover:text-indigo-700">
                    {task.title}
                  </button>
                  <p className="mt-1 truncate text-sm text-gray-500">{task.description || "No description"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                  <span>{task.assignee || "Unassigned"}</span>
                  {deadline && (
                    <span className={`inline-flex items-center gap-1.5 ${status === "OVERDUE" ? "font-semibold text-blue-700" : "text-gray-500"}`}>
                      <CalendarClock size={14} aria-hidden="true" />
                      {formatDeadline(deadline, { time: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${priorityBadge(task.priority)}`}>{task.priority}</span>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusBadge(status)}`}>{status.replaceAll("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <label className="sr-only" htmlFor={`status-${task.id}`}>Update status for {task.title}</label>
                  <span className="relative">
                    <select
                      id={`status-${task.id}`}
                      value={task.status === "PENDING" ? "TODO" : task.status || "TODO"}
                      onChange={(event) => handleStatusChange(task, event.target.value)}
                      className="appearance-none rounded-full border border-gray-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-gray-700 focus:border-indigo-500 focus:outline-none"
                    >
                      {TASK_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                    </select>
                    <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  </span>
                  <button type="button" onClick={() => setViewingTask(task)} aria-label={`View ${task.title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-700"><Eye size={16} aria-hidden="true" /></button>
                  <button type="button" onClick={() => setEditingTask(task)} aria-label={`Edit ${task.title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" onClick={() => handleDelete(task)} aria-label={`Delete ${task.title}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-700"><Trash2 size={15} aria-hidden="true" /></button>
                  {status === "DONE" && <Check size={16} className="text-emerald-600" aria-label="Completed" />}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(showCreate || editingTask) && (
        <AddTaskModal
          key={editingTask?.id || "new-task"}
          task={editingTask}
          teamMembers={teamMembers}
          onClose={() => { setShowCreate(false); setEditingTask(null); }}
          onTaskAdded={handleSaved}
        />
      )}
      {viewingTask && (
        <TaskDetailsModal
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={(selectedTask) => { setViewingTask(null); setEditingTask(selectedTask); }}
        />
      )}
    </section>
  );
}
