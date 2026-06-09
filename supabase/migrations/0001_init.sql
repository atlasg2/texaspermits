-- 0001_init.sql — TABS lead engine core schema
-- Idempotent: safe to re-run. Applied via scripts/migrate.py (tracked in schema_migrations).

-- ============================================================
-- projects : one row per TABS project (latest scraped state)
-- Scraped facts only. User/CRM state lives in user_project_state.
-- ============================================================
create table if not exists projects (
  project_number        text primary key,
  registration_date     date,
  project_name          text,
  facility_name         text,
  location_full         text,
  location_city         text,
  location_state        text,
  location_zip          text,
  location_county       text,
  start_date            date,
  completion_date       date,
  estimated_cost        numeric,
  type_of_work          text,
  type_of_funds         text,
  scope_of_work         text,
  square_footage        integer,
  tenant_private_funds  boolean,
  current_status        text,
  filer_contact_name    text,
  ras_name              text,
  ras_number            text,
  ras_address           text,
  ras_phone             text,
  owner_name            text,
  owner_address         text,
  owner_phone           text,
  owner_contact_name    text,
  tenant_name           text,
  tenant_phone          text,
  design_firm_name      text,
  design_firm_address   text,
  design_firm_phone     text,
  raw_hash              text,
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  last_changed_at       timestamptz not null default now()
);

create index if not exists ix_projects_status     on projects (current_status);
create index if not exists ix_projects_county      on projects (location_county);
create index if not exists ix_projects_city        on projects (location_city);
create index if not exists ix_projects_reg_date    on projects (registration_date);
create index if not exists ix_projects_cost        on projects (estimated_cost);
create index if not exists ix_projects_work        on projects (type_of_work);
create index if not exists ix_projects_changed     on projects (last_changed_at);

-- ============================================================
-- status_history : append-only lifecycle log we build ourselves
-- (TABS only shows current status — no history on the page)
-- ============================================================
create table if not exists status_history (
  id              bigint generated always as identity primary key,
  project_number  text not null references projects(project_number) on delete cascade,
  old_status      text,
  new_status      text,
  changed_at      timestamptz not null default now()
);
create index if not exists ix_status_hist_project on status_history (project_number);
create index if not exists ix_status_hist_time    on status_history (changed_at);

-- ============================================================
-- user_project_state : CRM layer, kept SEPARATE from scraped facts so
-- re-scrapes never clobber user decisions. "Delete" = is_hidden = true.
-- ============================================================
create table if not exists user_project_state (
  project_number  text primary key references projects(project_number) on delete cascade,
  is_hidden       boolean not null default false,
  is_saved        boolean not null default false,
  lead_stage      text,
  assigned_to     text,
  notes           text,
  updated_at      timestamptz not null default now()
);
create index if not exists ix_ups_stage on user_project_state (lead_stage);

-- ============================================================
-- Security: lock tables down by default (RLS on, no public policies).
-- The scraper/sync uses the service-role key, which bypasses RLS.
-- App-facing read/write policies get added in a later migration with auth.
-- ============================================================
alter table projects            enable row level security;
alter table status_history      enable row level security;
alter table user_project_state  enable row level security;
