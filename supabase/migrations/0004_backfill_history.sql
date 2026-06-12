-- 0004_backfill_history.sql — populate project_versions + project_changes from data
-- we already have (no re-scrape). Idempotent via NOT EXISTS guards so re-running is safe.
-- The daily engine takes over from here, appending new versions/changes going forward.

-- 1) Baseline snapshot per project (content_hash = the scraper's raw_hash).
insert into project_versions (project_number, content_hash, snapshot, captured_at)
select p.project_number,
       coalesce(p.raw_hash, md5(p.project_number)),
       to_jsonb(p.*),
       p.first_seen_at
from projects p
where not exists (
  select 1 from project_versions v where v.project_number = p.project_number
);

-- 2) One "new_project" change per project (first time we saw it).
insert into project_changes (project_number, kind, changed_at)
select p.project_number, 'new_project', p.first_seen_at
from projects p
where not exists (
  select 1 from project_changes c
  where c.project_number = p.project_number and c.kind = 'new_project'
);

-- 3) Status changes copied from the status_history we built during the backfill.
insert into project_changes (project_number, field, old_value, new_value, kind, changed_at)
select sh.project_number, 'current_status', sh.old_status, sh.new_status, 'status', sh.changed_at
from status_history sh
where not exists (
  select 1 from project_changes c
  where c.project_number = sh.project_number
    and c.kind = 'status'
    and c.changed_at = sh.changed_at
    and coalesce(c.new_value, '') = coalesce(sh.new_status, '')
);
