-- 0008_company_directory.sql
-- Fast company directory metrics and paginated project history.

create extension if not exists pg_trgm;

drop materialized view if exists company_stats;

create materialized view company_stats as
select
  co.id                                                     as company_id,
  co.canonical_name,
  co.kind,
  array_agg(distinct pc.role)                               as roles,
  count(distinct pc.project_number)                         as project_count,
  count(distinct pc.project_number)
    filter (where p.current_status in
      ('Project Registered', 'Review Complete'))             as open_count,
  count(distinct pc.project_number)
    filter (where p.current_status = 'Review Complete'
      and p.completion_date < current_date)                  as behind_count,
  count(distinct pc.project_number)
    filter (where p.registration_date >= current_date - 90)  as recent_90d_count,
  max(p.square_footage)                                     as largest_project_sqft,
  array_remove(array_agg(distinct p.location_city), null)   as cities,
  string_agg(distinct p.location_city, ', ')
    filter (where p.location_city is not null)               as markets_text,
  max(p.registration_date)                                  as last_filed
from companies co
join project_companies pc on pc.company_id = co.id
join projects p on p.project_number = pc.project_number
where pc.role in ('owner', 'tenant', 'architect')
group by co.id, co.canonical_name, co.kind;

create unique index ux_company_stats_id on company_stats (company_id);
create index ix_company_stats_roles on company_stats using gin (roles);
create index ix_company_stats_count on company_stats (project_count desc);
create index ix_company_stats_open on company_stats (open_count desc);
create index ix_company_stats_behind on company_stats (behind_count desc);
create index ix_company_stats_recent on company_stats (last_filed desc);
create index ix_company_stats_largest on company_stats (largest_project_sqft desc);
create index ix_company_stats_name_trgm
  on company_stats using gin (lower(canonical_name) gin_trgm_ops);
create index ix_company_stats_markets_trgm
  on company_stats using gin (lower(markets_text) gin_trgm_ops);

create or replace function company_project_rows(
  p_company_id bigint,
  p_search text default null,
  p_stage text default 'all',
  p_timing text default null,
  p_work text default null,
  p_min_sqft integer default null,
  p_sort text default 'changed',
  p_offset integer default 0,
  p_limit integer default 50
)
returns table (
  project_number text,
  project_name text,
  facility_name text,
  location_city text,
  location_state text,
  current_status text,
  type_of_work text,
  square_footage integer,
  estimated_cost numeric,
  scope_of_work text,
  start_date date,
  completion_date date,
  registration_date date,
  last_changed_at timestamptz,
  total_count bigint
)
language sql
stable
as $$
  with filtered as (
    select p.*
    from projects p
    where exists (
      select 1
      from project_companies target
      where target.project_number = p.project_number
        and target.company_id = p_company_id
        and target.role in ('owner', 'tenant', 'architect')
    )
    and (
      nullif(trim(p_search), '') is null
      or p.project_name ilike '%' || trim(p_search) || '%'
      or p.facility_name ilike '%' || trim(p_search) || '%'
      or p.location_city ilike '%' || trim(p_search) || '%'
      or p.scope_of_work ilike '%' || trim(p_search) || '%'
      or exists (
        select 1
        from project_companies pc
        join companies co on co.id = pc.company_id
        where pc.project_number = p.project_number
          and co.canonical_name ilike '%' || trim(p_search) || '%'
      )
    )
    and (
      p_stage is null
      or p_stage = 'all'
      or (p_stage = 'open'
        and p.current_status in ('Project Registered', 'Review Complete'))
      or (p_stage = 'behind'
        and p.current_status = 'Review Complete'
        and p.completion_date < current_date)
      or (p_stage = 'registered'
        and p.current_status = 'Project Registered')
      or (p_stage in ('review-complete', 'approved')
        and p.current_status = 'Review Complete')
      or (p_stage = 'inspection-complete'
        and p.current_status = 'Inspection Complete')
      or (p_stage = 'closed'
        and p.current_status = 'Project Closed')
      or (p_stage = 'complete'
        and p.current_status in ('Inspection Complete', 'Project Closed'))
    )
    and (
      p_timing is null
      or p_timing = ''
      or (p_timing = 'stale-registered'
        and p.current_status = 'Project Registered'
        and p.completion_date < current_date)
      or (p_timing = 'upcoming' and p.start_date > current_date)
      or (p_timing = 'underway'
        and p.start_date <= current_date
        and p.completion_date >= current_date)
    )
    and (p_work is null or p_work = '' or p.type_of_work = p_work)
    and (p_min_sqft is null or p.square_footage >= p_min_sqft)
  )
  select
    f.project_number,
    f.project_name,
    f.facility_name,
    f.location_city,
    f.location_state,
    f.current_status,
    f.type_of_work,
    f.square_footage,
    f.estimated_cost,
    f.scope_of_work,
    f.start_date,
    f.completion_date,
    f.registration_date,
    f.last_changed_at,
    count(*) over () as total_count
  from filtered f
  order by
    case when p_sort = 'sqft' then f.square_footage end desc nulls last,
    case when p_sort = 'cost' then f.estimated_cost end desc nulls last,
    case when p_sort = 'filed' then f.registration_date end desc nulls last,
    case when p_sort = 'start' then f.start_date end desc nulls last,
    case when p_sort = 'completion' then f.completion_date end desc nulls last,
    case when p_sort = 'changed' then f.last_changed_at end desc nulls last,
    f.project_number desc
  offset greatest(p_offset, 0)
  limit least(greatest(p_limit, 1), 100);
$$;
