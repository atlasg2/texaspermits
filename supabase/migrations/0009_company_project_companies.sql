-- 0009_company_project_companies.sql
-- Include project-company relationships in the paginated company history RPC,
-- removing a second API round trip for every company profile load.

drop function if exists company_project_rows(
  bigint, text, text, text, text, integer, text, integer, integer
);

create function company_project_rows(
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
  companies jsonb,
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
  ),
  paged as (
    select f.*, count(*) over () as total_count
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
    limit least(greatest(p_limit, 1), 100)
  )
  select
    p.project_number,
    p.project_name,
    p.facility_name,
    p.location_city,
    p.location_state,
    p.current_status,
    p.type_of_work,
    p.square_footage,
    p.estimated_cost,
    p.scope_of_work,
    p.start_date,
    p.completion_date,
    p.registration_date,
    p.last_changed_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', co.id,
            'name', co.canonical_name,
            'role', pc.role
          )
          order by pc.role, co.canonical_name
        )
        from project_companies pc
        join companies co on co.id = pc.company_id
        where pc.project_number = p.project_number
          and pc.role in ('owner', 'tenant', 'architect')
      ),
      '[]'::jsonb
    ) as companies,
    p.total_count
  from paged p;
$$;
