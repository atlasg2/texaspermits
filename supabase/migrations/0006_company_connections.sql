-- 0006_company_connections.sql — "connected companies" for a company profile:
-- other companies that appear on the same projects, with their role and the count
-- of shared projects. Powers the relationship table (no graph) on the detail page.

create or replace function company_connections(cid bigint)
returns table (
  company_id     bigint,
  canonical_name text,
  role           text,
  shared         int
)
language sql
stable
as $$
  select co2.id, co2.canonical_name, pc2.role,
         count(distinct pc2.project_number)::int as shared
  from project_companies pc1
  join project_companies pc2
    on pc2.project_number = pc1.project_number
   and pc2.company_id <> pc1.company_id
  join companies co2 on co2.id = pc2.company_id
  where pc1.company_id = cid
  group by co2.id, co2.canonical_name, pc2.role
  order by shared desc, co2.canonical_name
  limit 60;
$$;
