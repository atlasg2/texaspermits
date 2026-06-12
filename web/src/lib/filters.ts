// Plain filter constants — safe to import from client components. Must NOT import
// anything that pulls in the server-only Supabase admin client.

export const STATUS_OPTIONS = [
  "Project Registered",
  "Review Complete",
  "Inspection Complete",
  "Project Closed",
];

export const WORK_OPTIONS = [
  "Renovation/Alteration",
  "New Construction",
  "Additions to Existing Building",
];

export type CompanyRoleTab = "all" | "owner" | "tenant" | "architect" | "gc";

export const ROLE_TABS: { key: CompanyRoleTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "owner", label: "Owners" },
  { key: "tenant", label: "Tenants" },
  { key: "architect", label: "Architects" },
  { key: "gc", label: "GCs" },
];
