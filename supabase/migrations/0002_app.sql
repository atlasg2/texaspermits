-- 0002_app.sql — application layer: companies, versions, changes, workspace, inbox, lists, notes
-- Idempotent & forward-only. Applied via scripts/migrate.py (tracked in schema_migrations).
--
-- Design notes (see docs/V1_BUILD.md §3):
--  * Scraped facts stay in projects/status_history (0001). Everything here is the app layer.
--  * Companies are modeled as SOURCED RELATIONSHIPS, not fixed columns: one company can be
--    owner on one project and tenant on another. The link row carries role/source/confidence.
--  * project_versions stores a content-hashed snapshot per change; project_changes is the
--    derived field-level timeline that powers the UI + Inbox.
--  * Core stays tenant-agnostic: Elite is one workspace row; its lens (keywords) lives in DB.
--  * Enums are text + CHECK (not CREATE TYPE) so re-runs stay idempotent.
--  * User identity is the auth email (text), matching user_project_state.assigned_to in 0001.

-- ============================================================
-- companies : canonical, deduped organizations/people seen across projects
-- ============================================================
create table if not exists companies (
  id              bigint generated always as identity primary key,
  canonical_name  text not null,
  norm_name       text not null,                 -- trim+collapse+casefold, used for matching/dedupe
  name_variants   text[] not null default '{}',  -- every original spelling we've seen
  kind            text not null default 'owner'  -- primary role this company is usually seen in
                    check (kind in ('owner','tenant','architect','gc','filer')),
  phone           text,
  address         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists ux_companies_norm_kind on companies (norm_name, kind);
create index if not exists ix_companies_canonical on companies (canonical_name);

-- ============================================================
-- project_companies : the relationship. role lives here, not on the company.
-- research_state matters for GC (empty/unknown in V1); absence of a gc row = unknown.
-- ============================================================
create table if not exists project_companies (
  id              bigint generated always as identity primary key,
  project_number  text not null references projects(project_number) on delete cascade,
  company_id      bigint not null references companies(id) on delete cascade,
  role            text not null
                    check (role in ('owner','tenant','architect','gc','filer')),
  source          text not null default 'tabs',
  confidence      text not null default 'confirmed'
                    check (confidence in ('possible','confirmed','unknown')),
  research_state  text not null default 'confirmed'
                    check (research_state in ('unknown','researching','possible','confirmed','not_found')),
  is_primary      boolean not null default true,
  created_at      timestamptz not null default now()
);
create unique index if not exists ux_proj_company_role on project_companies (project_number, company_id, role);
create index if not exists ix_pc_company on project_companies (company_id);
create index if not exists ix_pc_role    on project_companies (role);

-- ============================================================
-- project_versions : content-hashed snapshot, one row per observed change.
-- project_changes is DERIVED from comparing consecutive versions.
-- ============================================================
create table if not exists project_versions (
  id              bigint generated always as identity primary key,
  project_number  text not null references projects(project_number) on delete cascade,
  content_hash    text not null,
  snapshot        jsonb not null,
  captured_at     timestamptz not null default now()
);
create unique index if not exists ux_proj_version_hash on project_versions (project_number, content_hash);
create index if not exists ix_pv_project on project_versions (project_number, captured_at);

create table if not exists project_changes (
  id              bigint generated always as identity primary key,
  project_number  text not null references projects(project_number) on delete cascade,
  field           text,
  old_value       text,
  new_value       text,
  kind            text not null
                    check (kind in ('new_project','status','start_date','completion_date',
                                    'cost','sqft','scope','company')),
  changed_at      timestamptz not null default now()
);
create index if not exists ix_pchg_project on project_changes (project_number, changed_at);
create index if not exists ix_pchg_kind    on project_changes (kind);

-- ============================================================
-- project_schedule : computed attention signal (NOT a scraped fact).
-- Recomputed by the daily engine. Drives the Projects "Schedule" column + Possibly-Late view.
-- ============================================================
create table if not exists project_schedule (
  project_number  text primary key references projects(project_number) on delete cascade,
  schedule_state  text not null default 'unknown'
                    check (schedule_state in ('upcoming','active','possibly_late','complete','unknown')),
  computed_at     timestamptz not null default now()
);
create index if not exists ix_psched_state on project_schedule (schedule_state);

-- ============================================================
-- workspaces : tenant config. lens (keywords) lives in jsonb so core stays generic.
-- ============================================================
create table if not exists workspaces (
  id              bigint generated always as identity primary key,
  slug            text not null unique,
  name            text not null,
  lens            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Seed the Elite workspace + its fitness lens (include/exclude keywords, min_sqft is a filter not a gate).
insert into workspaces (slug, name, lens) values (
  'elite',
  'Elite Installation Services',
  '{
    "include_keywords": ["fitness","gym","health club","athletic","crossfit","training",
      "club4","eos fitness","crunch","planet fitness","lifetime","life time","la fitness",
      "ufc gym","orangetheory","f45","anytime fitness","gold''s gym","esporta"],
    "exclude_keywords": ["sam''s club","school","isd","gymnasium","university","college",
      "apartment","hotel","physical therapy","rehabilitation","amenity"],
    "min_sqft": null
  }'::jsonb
) on conflict (slug) do nothing;

-- ============================================================
-- inbox_items : the daily queue. rule-decided; ai_summary is language-only (added last).
-- reason_bullets are the human-readable fact lines that always stay visible.
-- ============================================================
create table if not exists inbox_items (
  id              bigint generated always as identity primary key,
  workspace_id    bigint not null references workspaces(id) on delete cascade,
  project_number  text references projects(project_number) on delete cascade,
  reason          text not null,                 -- machine code: new_project|status|completion_date|mention|...
  reason_bullets  text[] not null default '{}',  -- human fact lines
  ai_summary      text,
  state           text not null default 'new'
                    check (state in ('new','reviewed','dismissed')),
  for_user        text,                          -- mention items target a specific user; null = whole workspace
  created_at      timestamptz not null default now(),
  acted_by        text,
  acted_at        timestamptz
);
create index if not exists ix_inbox_state   on inbox_items (workspace_id, state, created_at);
create index if not exists ix_inbox_project on inbox_items (project_number);

-- ============================================================
-- lists + list_items : intentional collections. Seed Watchlist + Follow-Up.
-- ============================================================
create table if not exists lists (
  id              bigint generated always as identity primary key,
  workspace_id    bigint not null references workspaces(id) on delete cascade,
  name            text not null,
  is_system       boolean not null default false,
  created_at      timestamptz not null default now()
);
create unique index if not exists ux_lists_ws_name on lists (workspace_id, name);

create table if not exists list_items (
  id              bigint generated always as identity primary key,
  list_id         bigint not null references lists(id) on delete cascade,
  project_number  text references projects(project_number) on delete cascade,
  company_id      bigint references companies(id) on delete cascade,
  note            text,
  added_by        text,
  assigned_to     text,
  due_date        date,
  resolved        boolean not null default false,
  created_at      timestamptz not null default now(),
  check (project_number is not null or company_id is not null)
);
create index if not exists ix_listitems_list on list_items (list_id);

insert into lists (workspace_id, name, is_system)
  select w.id, v.name, true
  from workspaces w
  cross join (values ('Watchlist'), ('Follow-Up')) as v(name)
  where w.slug = 'elite'
on conflict (workspace_id, name) do nothing;

-- ============================================================
-- notes : team comments on a project or company, with @mentions.
-- A mention also creates an inbox_item (reason 'mention') — handled in app/engine code.
-- ============================================================
create table if not exists notes (
  id              bigint generated always as identity primary key,
  entity_type     text not null check (entity_type in ('project','company')),
  entity_id       text not null,                 -- project_number or company_id (as text)
  author          text not null,
  body            text not null,
  mentions        text[] not null default '{}',
  resolved        boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists ix_notes_entity on notes (entity_type, entity_id, created_at);

-- ============================================================
-- Security: RLS on. service-role (sync/engine) bypasses. authenticated app users:
--  * read everything;
--  * write only the collaboration tables (notes, list_items, inbox_items, user_project_state).
-- Policies are dropped+recreated so this migration stays idempotent.
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array[
    'companies','project_companies','project_versions','project_changes','project_schedule',
    'workspaces','inbox_items','lists','list_items','notes'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t||'_read', t);
    execute format('create policy %I on %I for select to authenticated using (true)', t||'_read', t);
  end loop;

  -- write access on collaboration tables only
  foreach t in array array['notes','list_items','inbox_items'] loop
    execute format('drop policy if exists %I on %I', t||'_write', t);
    execute format('create policy %I on %I for all to authenticated using (true) with check (true)',
                   t||'_write', t);
  end loop;
end $$;
