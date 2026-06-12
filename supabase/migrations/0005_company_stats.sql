-- 0005_company_stats.sql — precomputed per-company rollups for the Companies tab.
-- Materialized so the directory (73,490 companies) lists/sorts/filters fast. The
-- daily engine refreshes it; for now 0005 builds it and we refresh once after.
--
-- roles[] lets the sub-tabs (Owners/Tenants/Architects/GCs) filter by membership;
-- counts span ALL of a company's projects (a company keeps one identity across roles).

drop materialized view if exists company_stats;

create materialized view company_stats as
select
  co.id                                                   as company_id,
  co.canonical_name,
  co.kind,
  array_agg(distinct pc.role)                             as roles,
  count(distinct pc.project_number)                       as project_count,
  count(distinct pc.project_number)
    filter (where p.current_status <> 'Project Closed')   as active_count,
  array_remove(array_agg(distinct p.location_city), null) as cities,
  max(p.registration_date)                                as last_filed
from companies co
join project_companies pc on pc.company_id = co.id
join projects p          on p.project_number = pc.project_number
group by co.id, co.canonical_name, co.kind;

create unique index ux_company_stats_id   on company_stats (company_id);
create index ix_company_stats_roles       on company_stats using gin (roles);
create index ix_company_stats_count       on company_stats (project_count desc);
create index ix_company_stats_active      on company_stats (active_count desc);
create index ix_company_stats_name        on company_stats (canonical_name);
