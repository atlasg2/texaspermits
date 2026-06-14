// Project state combines TABS lifecycle status with filer-estimated dates.
// Dates take precedence for open projects because source status can lag.

export type ScheduleState =
  | "registered"
  | "approved"
  | "active"
  | "behind"
  | "complete"
  | "unknown";

export function isTerminal(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return (
    s.includes("inspection complete") ||
    s.includes("closed") ||
    s.includes("cancel") ||
    s.includes("void")
  );
}

export function isStaleRegistration(
  status: string | null | undefined,
  completion: string | null | undefined,
): boolean {
  if (status !== "Project Registered" || !completion) return false;
  return completion < new Date().toISOString().slice(0, 10);
}

export function isBehindEstimate(
  status: string | null | undefined,
  completion: string | null | undefined,
): boolean {
  if (status !== "Review Complete" || !completion) return false;
  return completion < new Date().toISOString().slice(0, 10);
}

export function deriveSchedule(
  status: string | null | undefined,
  start: string | null | undefined,
  completion: string | null | undefined,
): ScheduleState {
  if (isTerminal(status)) return "complete";
  const today = new Date().toISOString().slice(0, 10);
  if (completion && completion < today) return "behind";
  if (start && start <= today) return "active";
  if (status === "Review Complete") return "approved";
  if (status === "Project Registered") return "registered";
  return "unknown";
}

export const SCHEDULE_META: Record<
  ScheduleState,
  { label: string; tone: Tone }
> = {
  registered: { label: "Registered", tone: "neutral" },
  approved: { label: "Approved / Not Started", tone: "blueprint" },
  active: { label: "Active", tone: "grass" },
  behind: { label: "Behind", tone: "rust" },
  complete: { label: "Complete", tone: "slate" },
  unknown: { label: "Unknown", tone: "neutral" },
};

// Source status → tone for the Status column badge.
export type Tone = "blueprint" | "grass" | "amber" | "rust" | "slate" | "neutral";

export function statusTone(status: string | null | undefined): Tone {
  const s = (status || "").toLowerCase();
  if (s.includes("closed")) return "slate";
  if (s.includes("review complete")) return "blueprint";
  if (s.includes("inspection")) return "grass";
  if (s.includes("registered")) return "neutral";
  return "neutral";
}

export function statusLabel(status: string | null | undefined): string {
  if (status === "Project Registered") return "Registered";
  if (status === "Review Complete") return "Review Complete";
  if (status === "Inspection Complete") return "Inspection Complete";
  if (status === "Project Closed") return "Closed";
  return status || "Unknown";
}
