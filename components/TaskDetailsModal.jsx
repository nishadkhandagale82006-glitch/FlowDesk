"use client";

import { CalendarClock, Clock3, Pencil, UserRound, X } from "lucide-react";
import { formatDeadline, getDeadline, getTaskStatus } from "@/lib/workflow";

function badge(status, priority) {
  if (status === "DONE") return "bg-emerald-100 text-emerald-700";
  if (status === "OVERDUE" || priority === "HIGH") return "bg-blue-100 text-blue-700";
  return "bg-indigo-50 text-indigo-700";
}

export default function TaskDetailsModal({ task, onClose, onEdit }) {
  if (!task) return null;

  const status = getTaskStatus(task);
  const deadline = getDeadline(task);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        className="my-auto w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badge(status, task.priority)}`}>
              {status.replaceAll("_", " ")}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${badge(status, task.priority)}`}>
              {task.priority} priority
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h2 id="task-details-title" className="mt-5 break-words text-2xl font-semibold text-gray-900 sm:text-3xl">
          {task.title}
        </h2>
        <p className="mt-3 whitespace-pre-wrap break-words text-base leading-7 text-gray-600">
          {task.description || "No description added for this task."}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <UserRound size={15} aria-hidden="true" /> Assignee
            </div>
            <p className="mt-2 text-base font-semibold text-gray-900">{task.assignee || "Unassigned"}</p>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {status === "OVERDUE" ? <Clock3 size={15} aria-hidden="true" /> : <CalendarClock size={15} aria-hidden="true" />}
              Deadline
            </div>
            <p className={`mt-2 text-base font-semibold ${status === "OVERDUE" ? "text-blue-700" : "text-gray-900"}`}>
              {formatDeadline(deadline, { time: true })}
              {status === "OVERDUE" && <span className="ml-2 text-xs font-medium">Overdue</span>}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Pencil size={15} aria-hidden="true" /> Edit task
          </button>
        </div>
      </section>
    </div>
  );
}
