-- 0007_workspace_matches.sql — which projects a workspace's lens considers relevant.
-- Populated by scripts/apply_lens.py (reads workspaces.lens from the DB — keywords live
-- in config, not code, so the core stays tenant-agnostic). The daily engine re-applies it.
-- Views (Active/New/Late/Completed Gym) and the Inbox both read from this.

create table if not exists workspace_matches (
  workspace_id    bigint not null references workspaces(id) on delete cascade,
  project_number  text   not null references projects(project_number) on delete cascade,
  matched_keyword text,
  created_at      timestamptz not null default now(),
  primary key (workspace_id, project_number)
);
create index if not exists ix_wsmatch_project on workspace_matches (project_number);

alter table workspace_matches enable row level security;
drop policy if exists workspace_matches_read on workspace_matches;
create policy workspace_matches_read on workspace_matches
  for select to authenticated using (true);
