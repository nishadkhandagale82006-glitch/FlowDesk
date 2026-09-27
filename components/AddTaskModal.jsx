"use client";

import { useState } from "react";
import { CalendarDays, LoaderCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getDeadline, getStoredStatus, logActivity } from "@/lib/workflow";

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AddTaskModal({
  task = null,
  teamMembers = [],
  onClose,
  onTaskAdded,
}) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assignee: task?.assignee || teamMembers[0]?.name || "",
    priority: task?.priority || "MEDIUM",
    due_at: toLocalInput(getDeadline(task || {})),
    status: getStoredStatus(task || {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    setSaving(true);
    setError("");
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignee: form.assignee || null,
      priority: form.priority,
      status: form.status,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
    };

    const result = task?.id
      ? await supabase.from("tasks").update(payload).eq("id", task.id)
      : await supabase.from("tasks").insert(payload).select("id").single();

    if (result.error) {
      setError(result.error.message || "The task could not be saved.");
      setSaving(false);
      return;
    }

    const logError = await logActivity(
      task?.id ? "Task updated" : "Task created",
      "task",
      payload.title,
    );
    setSaving(false);
    onTaskAdded?.({ activityError: logError?.message || null });
    onClose();
  }

  const fieldClass = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="my-auto w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              Task workspace
            </p>
            <h2 id="task-modal-title" className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
              {task ? "Edit task" : "Create a task"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add the details your team needs to move work forward.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task form"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass} htmlFor="task-title">Title</label>
            <input
              id="task-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className={fieldClass}
              placeholder="e.g. Prepare the weekly stock order"
              required
              maxLength={160}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`${fieldClass} min-h-28 resize-y`}
              placeholder="Add context, steps, or anything the assignee should know."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                name="assignee"
                value={form.assignee}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}{member.role ? ` · ${member.role}` : ""}
                  </option>
                ))}
              </select>
              {teamMembers.length === 0 && (
                <p className="mt-2 text-xs text-gray-500">Add a team member to assign this task.</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="task-deadline">Deadline</label>
              <div className="relative">
                <input
                  id="task-deadline"
                  type="datetime-local"
                  name="due_at"
                  value={form.due_at}
                  onChange={handleChange}
                  className={`${fieldClass} pr-11`}
                />
                <CalendarDays size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="task-status">Status</label>
              <select
                id="task-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className={fieldClass}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
            >
              {saving && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {saving ? "Saving..." : task ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
