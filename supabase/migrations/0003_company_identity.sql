-- 0003_company_identity.sql — a company is identified by its normalized name alone.
-- Roles live on project_companies, so one company can be owner on project A and tenant on
-- project B (Codex acceptance test: "one company can have different roles on different
-- projects"). companies.kind becomes an informational "primary/most-common role" label,
-- not part of the identity key.
drop index if exists ux_companies_norm_kind;
create unique index if not exists ux_companies_norm on companies (norm_name);
