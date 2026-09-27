"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronDown, CircleAlert, Filter, Inbox, Plus, Search, SlidersHorizontal } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AddTaskModal from "@/components/AddTaskModal";
import TaskDetailsModal from "@/components/TaskDetailsModal";
import RecentActivity from "@/components/RecentActivity";
import { supabase } from "@/lib/supabase";
import { formatDeadline, getDeadline, getTaskStatus, logActivity, TASK_STATUSES } from "@/lib/workflow";

const STATUS_FILTERS = ["ALL", "TODO", "IN_PROGRESS", "DONE", "OVERDUE"];
const PRIORITIES = ["ALL", "HIGH", "MEDIUM", "LOW"];

function badgeForStatus(status) {
  if (status === "DONE") return "bg-emerald-100 text-emerald-700";
  if (status === "OVERDUE") return "bg-blue-100 text-blue-700";
  if (status === "IN_PROGRESS") return "bg-indigo-100 text-indigo-700";
  return "bg-gray-100 text-gray-700";
}

function badgeForPriority(priority) {
  if (priority === "HIGH") return "bg-emerald-100 text-emerald-700";
  if (priority === "MEDIUM") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("deadline");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const [now] = useState(() => Date.now());

  async function fetchData() {
    const { data, error: fetchError } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    setTasks(data || []);
    setError(fetchError?.message || "");
    setLoading(false);
  }

  useEffect(() => {
    let isCurrent = true;
    Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("team_members").select("id, name, role, email").order("name"),
    ]).then(([taskResult, teamResult]) => {
      if (!isCurrent) return;
      setTasks(taskResult.data || []);
      setTeamMembers(teamResult.data || []);
      setError(taskResult.error?.message || "");
      if (teamResult.error) setNotice("Team filters could not be loaded.");
      setLoading(false);
    });
    return () => { isCurrent = false; };
  }, []);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = tasks.filter((task) => {
      const status = getTaskStatus(task);
      const matchesSearch = !query || [task.title, task.description, task.assignee]
        .some((value) => value?.toLowerCase().includes(query));
      return matchesSearch
        && (statusFilter === "ALL" || status === statusFilter)
        && (priorityFilter === "ALL" || task.priority === priorityFilter)
        && (assigneeFilter === "ALL" || (task.assignee || "") === assigneeFilter);
    });

    return result.sort((a, b) => {
      if (sort === "deadline") {
        const deadlineA = getDeadline(a);
        const deadlineB = getDeadline(b);
        if (!deadlineA) return 1;
        if (!deadlineB) return -1;
        return new Date(deadlineA) - new Date(deadlineB);
      }
      if (sort === "priority") {
        const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (rank[a.priority] ?? 3) - (rank[b.priority] ?? 3);
      }
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter, sort]);

  async function updateStatus(task, status) {
    const { error: updateError } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    const activityError = await logActivity(status === "DONE" ? "Task completed" : "Task status changed", "task", task.title, status === "DONE" ? task.assignee : null);
    setNotice(activityError ? "Task saved. Run the activity migration to enable the activity feed." : "Task status updated.");
    await fetchData();
    setActivityRefresh((value) => value + 1);
  }

  async function handleSaved({ activityError } = {}) {
    setShowCreate(false);
    setEditingTask(null);
    if (activityError) setNotice("Task saved. Run the activity migration to enable the activity feed.");
    await fetchData();
    setActivityRefresh((value) => value + 1);
  }

  const fieldClass = "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="min-h-screen pb-24 md:ml-64 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-5 py-6 backdrop-blur sm:px-8 md:py-7">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Workflow</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">Tasks</h2>
              <p className="mt-1 text-sm text-gray-500">Search, prioritize, and keep work moving.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={17} aria-hidden="true" /> Create task
            </button>
          </div>
        </header>

        <main className="mx-auto grid max-w-7xl gap-7 px-5 py-7 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:px-10">
          <section className="min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 lg:flex-row">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search tasks</span>
                  <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search tasks, descriptions, people..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[540px]">
                  <label className="relative">
                    <span className="sr-only">Sort tasks</span>
                    <SlidersHorizontal size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <select value={sort} onChange={(event) => setSort(event.target.value)} className={`${fieldClass} appearance-none py-3 pl-9 pr-8`}>
                      <option value="deadline">Deadline soonest</option>
                      <option value="created">Recently created</option>
                      <option value="priority">Priority highest</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Filter by priority</span>
                    <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className={`${fieldClass} appearance-none py-3 pl-9 pr-8`}>
                      {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority === "ALL" ? "All priorities" : `${priority[0]}${priority.slice(1).toLowerCase()} priority`}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Filter by assignee</span>
                    <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className={`${fieldClass} appearance-none py-3 pr-8`}>
                      <option value="ALL">All team members</option>
                      <option value="">Unassigned</option>
                      {teamMembers.map((member) => <option key={member.id} value={member.name}>{member.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filter tasks by status">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    aria-pressed={statusFilter === status}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-colors ${statusFilter === status ? "bg-indigo-600 text-white" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    {status === "ALL" ? "All tasks" : status.replaceAll("_", " ")}
                  </button>
                ))}
                <span className="ml-auto hidden shrink-0 self-center text-xs text-gray-500 sm:block">
                  {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
                </span>
              </div>
            </div>

            {(error || notice) && (
              <div role={error ? "alert" : "status"} className={`mt-4 flex items-start justify-between gap-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"}`}>
                <span>{error || notice}</span>
                <button type="button" onClick={() => { setError(""); setNotice(""); }} className="font-semibold underline">Dismiss</button>
              </div>
            )}

            <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_150px] gap-4 border-b border-gray-200 bg-gray-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 md:grid lg:px-6">
                <span>Task</span><span>Assignee</span><span>Priority</span><span>Status / deadline</span>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-sm text-gray-500">Loading tasks...</div>
              ) : error && tasks.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <CircleAlert size={25} className="mx-auto text-blue-600" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-gray-900">Could not load tasks</h3>
                  <p className="mt-1 break-words text-sm text-gray-500">{error}</p>
                  <button type="button" onClick={fetchData} className="mt-4 text-sm font-semibold text-indigo-600">Try again</button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600"><Inbox size={23} aria-hidden="true" /></span>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No matching tasks</h3>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                    {tasks.length === 0 ? "Create a task to give your team a clear next step." : "Try changing the search or filters to see more work."}
                  </p>
                  {tasks.length === 0 ? (
                    <button type="button" onClick={() => setShowCreate(true)} className="mt-4 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Create task</button>
                  ) : (
                    <button type="button" onClick={() => { setSearch(""); setStatusFilter("ALL"); setPriorityFilter("ALL"); setAssigneeFilter("ALL"); }} className="mt-4 text-sm font-semibold text-indigo-600">Clear filters</button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTasks.map((task) => {
                    const status = getTaskStatus(task);
                    const deadline = getDeadline(task);
                    const dueSoon = deadline && status !== "DONE" && new Date(deadline).getTime() - now <= 48 * 60 * 60 * 1000 && status !== "OVERDUE";
                    return (
                      <article key={task.id} className="grid gap-4 px-5 py-5 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1fr)_140px_120px_150px] md:items-center lg:px-6">
                        <div className="min-w-0">
                          <button type="button" onClick={() => setViewingTask(task)} className="block max-w-full truncate text-left text-base font-semibold text-gray-900 hover:text-indigo-700">{task.title}</button>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-gray-500">{task.description || "No description added"}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeForPriority(task.priority)}`}>{task.priority}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeForStatus(status)}`}>{status.replaceAll("_", " ")}</span>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-gray-700">{task.assignee || "Unassigned"}</div>
                        <span className={`hidden w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide md:inline-flex ${badgeForPriority(task.priority)}`}>{task.priority}</span>
                        <div className="flex flex-wrap items-center justify-between gap-3 md:block">
                          <span className={`hidden w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide md:inline-flex ${badgeForStatus(status)}`}>{status.replaceAll("_", " ")}</span>
                          {deadline && (
                            <span className={`mt-1 flex items-center gap-1.5 text-xs ${status === "OVERDUE" || dueSoon ? "font-semibold text-blue-700" : "text-gray-500"}`}>
                              {status === "OVERDUE" ? <CircleAlert size={14} aria-hidden="true" /> : <CalendarClock size={14} aria-hidden="true" />}
                              {status === "OVERDUE" ? "Overdue · " : dueSoon ? "Due soon · " : "Due "}{formatDeadline(deadline, { time: true })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 md:col-span-4 md:justify-end">
                          <label className="sr-only" htmlFor={`task-status-${task.id}`}>Update status for {task.title}</label>
                          <select id={`task-status-${task.id}`} value={task.status === "PENDING" ? "TODO" : task.status || "TODO"} onChange={(event) => updateStatus(task, event.target.value)} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
                            {TASK_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
                          </select>
                          <button type="button" onClick={() => setViewingTask(task)} className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-blue-50">Details</button>
                          <button type="button" onClick={() => setEditingTask(task)} className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">Edit</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <aside className="min-w-0">
            <RecentActivity refreshKey={activityRefresh} />
            <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <h3 className="font-semibold text-gray-900">A clear next step</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">Keep ownership and deadlines visible so nothing gets lost between calls.</p>
            </div>
          </aside>
        </main>
      </div>

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
          onEdit={(task) => { setViewingTask(null); setEditingTask(task); }}
        />
      )}
    </div>
  );
}
