export type AppStatus = "NOT_SUBMITTED" | "SUBMITTED" | "GRADED";

export function normalizeStatus(status?: string | null): AppStatus {
  if (!status) return "NOT_SUBMITTED";
  if (status === "DONE") return "GRADED";
  if (status === "IN_PROGRESS") return "SUBMITTED";
  if (status === "TODO") return "NOT_SUBMITTED";
  if (status === "GRADED" || status === "SUBMITTED" || status === "NOT_SUBMITTED") return status;
  return "NOT_SUBMITTED";
}


