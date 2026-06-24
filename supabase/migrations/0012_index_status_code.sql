-- Index-based daily engine (V1_BUILD.md §5).
-- Remember the ProjectStatus *code* we last saw for each project from the TABS
-- /Search/SearchProjects index (see scripts/tabs_index.py STATUS map). The daily
-- diff then compares index-code vs stored-code — apples to apples — instead of
-- mapping codes to detail-page strings or re-fetching 60k detail pages. Only
-- projects whose code changed (or brand-new project numbers) get a detail fetch.
-- Maintained by scripts/daily_update.py.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS index_status_code integer;

COMMENT ON COLUMN projects.index_status_code IS
  'Last ProjectStatus code from TABS SearchProjects index; drives the daily change diff (scripts/daily_update.py).';
