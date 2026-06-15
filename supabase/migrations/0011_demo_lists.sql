-- ============================================================
-- 0011_demo_lists.sql
-- Reset the seeded lists to the demo set: "Hot Leads" + "Watchlist".
-- Forward-only and idempotent. Drops the original "Follow-Up" seed and
-- adds "Hot Leads"; "Watchlist" (and any items on it) is left intact.
-- list_items cascade-delete with their list, so dropping Follow-Up is safe.
-- ============================================================

delete from lists l
using workspaces w
where l.workspace_id = w.id
  and w.slug = 'elite'
  and l.name = 'Follow-Up';

insert into lists (workspace_id, name, is_system)
  select w.id, 'Hot Leads', true
  from workspaces w
  where w.slug = 'elite'
on conflict (workspace_id, name) do nothing;
