export function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Returns e.g. "Sep 23, 2026"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
