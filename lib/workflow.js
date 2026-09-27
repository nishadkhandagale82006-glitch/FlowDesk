import { supabase } from "@/lib/supabase";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

export function getStoredStatus(task) {
  return task.status === "PENDING" ? "TODO" : task.status || "TODO";
}

export function getTaskStatus(task, now = Date.now()) {
  const status = getStoredStatus(task);
  if (status === "DONE") return "DONE";

  const deadline = task.due_at || task.due_date;
  if (deadline && new Date(deadline).getTime() < now) return "OVERDUE";
  return status;
}

export function getDeadline(task) {
  return task.due_at || task.due_date || null;
}

export function formatDeadline(value, options = {}) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid deadline";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(options.time ? { hour: "numeric", minute: "2-digit" } : {}),
  }).format(date);
}

export async function logActivity(action, targetType, targetLabel) {
  const { error } = await supabase.from("task_activity").insert({
    action,
    target_type: targetType,
    target_label: targetLabel,
  });
  return error;
}
