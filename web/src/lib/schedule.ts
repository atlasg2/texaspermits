// Schedule state is a computed ATTENTION SIGNAL, not a scraped fact. The daily
// engine will persist it to project_schedule; until then we derive it here so the
// Projects table and the Possibly-Late view work on real data today.
//
// TABS dates are filer estimates and status can lag the jobsite — "possibly late"
// means worth a look, never proof a job is behind.

export type ScheduleState =
  | "upcoming"
  | "active"
  | "possibly_late"
  | "complete"
  | "unknown";

export function isTerminal(status: string | null | undefined): boolean {
  const s = (status || "").toLowerCase();
  return s.includes("closed") || s.includes("cancel") || s.includes("void");
}

export function deriveSchedule(
  status: string | null | undefined,
  start: string | null | undefined,
  completion: string | null | undefined,
): ScheduleState {
  if (isTerminal(status)) return "complete";
  const today = new Date().toISOString().slice(0, 10);
  if (completion && completion < today) return "possibly_late";
  if (start && start > today) return "upcoming";
  if (start && start <= today) return "active";
  if (completion && completion >= today) return "active";
  return "unknown";
}

export const SCHEDULE_META: Record<
  ScheduleState,
  { label: string; tone: Tone }
> = {
  upcoming: { label: "Upcoming", tone: "blueprint" },
  active: { label: "Active", tone: "grass" },
  possibly_late: { label: "Possibly Late", tone: "amber" },
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
