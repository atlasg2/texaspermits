// Plain filter constants — safe to import from client components. Must NOT import
// anything that pulls in the server-only Supabase admin client.

export const WORK_OPTIONS = [
  "Renovation/Alteration",
  "New Construction",
  "Additions to Existing Building",
];

export const STAGE_OPTIONS = [
  { value: "open", label: "All open TABS stages" },
  { value: "behind", label: "Behind estimate" },
  { value: "registered", label: "Project Registered" },
  { value: "review-complete", label: "Review Complete" },
  { value: "inspection-complete", label: "Inspection Complete" },
  { value: "closed", label: "Project Closed" },
  { value: "all", label: "All TABS stages" },
];

export const TIMING_OPTIONS = [
  { value: "", label: "Any estimated timing" },
  {
    value: "stale-registered",
    label: "Stale registration (past completion)",
  },
  { value: "upcoming", label: "Estimated start is future" },
  { value: "underway", label: "Within estimated dates" },
];

export const SQFT_OPTIONS = [
  { value: "", label: "Any square footage" },
  { value: "min-10000", label: "10,000+ sq ft" },
  { value: "min-25000", label: "25,000+ sq ft" },
  { value: "min-50000", label: "50,000+ sq ft" },
  { value: "min-100000", label: "100,000+ sq ft" },
];

export type CompanyRoleTab = "all" | "owner" | "tenant" | "architect";

export const ROLE_TABS: { key: CompanyRoleTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owner", label: "Owners" },
  { key: "tenant", label: "Tenants" },
  { key: "architect", label: "Architects" },
];
