-- 0010_project_view_state.sql -- durable, non-destructive triage for system views.
-- A hidden project stays out of one view until its source status changes.

create table if not exists project_view_state (
  workspace_id      bigint not null references workspaces(id) on delete cascade,
  project_number    text not null references projects(project_number) on delete cascade,
  view_key          text not null,
  status_at_hidden  text,
  reason            text,
  hidden_by         text,
  hidden_at         timestamptz not null default now(),
  primary key (workspace_id, project_number, view_key)
);

create index if not exists ix_project_view_state_view
  on project_view_state (workspace_id, view_key, hidden_at);

alter table project_view_state enable row level security;

drop policy if exists project_view_state_read on project_view_state;
create policy project_view_state_read
  on project_view_state for select to authenticated using (true);

drop policy if exists project_view_state_write on project_view_state;
create policy project_view_state_write
  on project_view_state for all to authenticated
  using (true) with check (true);
