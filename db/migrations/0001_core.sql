-- 0001_core.sql — TABS lead engine, clean core schema (Neon Postgres).
-- Idempotent + forward-only. Applied via scripts/migrate.py (tracked in schema_migrations).
--
-- Just two tables: the scraped facts (projects) and the lifecycle timeline we
-- build ourselves (status_history). Everything else (lens/gym filter, lists,
-- inbox, companies) is a layer added later, on top of these.

-- ============================================================
-- projects : one row per TABS project = latest scraped facts.
-- Column set matches the scraper's output (scripts/sync_to_supabase.py COLNAMES);
-- a mismatch here would break the upsert.
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
  -- daily-engine bookkeeping
  index_status_code     integer,        -- status code from the cheap index scan; the daily diff compares against this
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  last_changed_at       timestamptz not null default now()
);

create index if not exists ix_projects_status   on projects (current_status);
create index if not exists ix_projects_county    on projects (location_county);
create index if not exists ix_projects_city      on projects (location_city);
create index if not exists ix_projects_reg_date  on projects (registration_date);
create index if not exists ix_projects_cost      on projects (estimated_cost);
create index if not exists ix_projects_work      on projects (type_of_work);
create index if not exists ix_projects_changed   on projects (last_changed_at);

-- ============================================================
-- status_history : append-only lifecycle log we build ourselves.
-- TABS only shows the CURRENT status — there is no history on the page, so the
-- timeline only exists if we snapshot daily and record every move. This is the moat.
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
