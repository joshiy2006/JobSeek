-- ============================================================================
-- get_job_data_domain_hiring_trends
-- ----------------------------------------------------------------------------
-- Fixes: the Personal Career "Real Demand Snapshot" (backend/routes/
-- skillgap.py::_get_demand_snapshot) was calling get_job_data_hiring_trends
-- with a param shape that function has never had — p_start_date/p_end_date/
-- p_bucket_unit/p_skill_domains — which PostgREST correctly rejected with
-- PGRST202. The real, deployed get_job_data_hiring_trends only takes
-- p_max_days_ago / p_bucket_size / p_city / p_work_mode / p_company_size,
-- and critically has NO skill-domain filter at all — so a straight
-- "call it with the right params instead" fix would have made the demand
-- snapshot city-wide instead of scoped to the user's matched role/skill
-- domain, which is the whole point of that panel.
--
-- This is a sibling function, not a patch to the existing one: it mirrors
-- get_job_data_hiring_trends's bucketing/column logic exactly (same
-- `job_data` table, same normalize_city() helper, same output shape:
-- bucket_index / days_ago_start / days_ago_end / listings) and adds a
-- single-value p_skill_domain filter. get_job_data_hiring_trends itself is
-- untouched — the main Hiring Trends tab keeps working exactly as it does
-- today.
--
-- Assumes `job_data.skill_domain` is a plain column (the same one
-- get_job_data_domain_trends / get_skill_trends / get_nearest_role_domain
-- already read from) — adjust the WHERE clause below if your schema
-- resolves skill_domain differently (e.g. via a join).
-- ============================================================================

create or replace function public.get_job_data_domain_hiring_trends(
    p_max_days_ago integer,
    p_bucket_size integer,
    p_city text default null,
    p_skill_domain text default null
)
returns table (
    bucket_index integer,
    days_ago_start integer,
    days_ago_end integer,
    listings bigint
)
language sql
stable
as $$
  SELECT
    (days_since_posted / p_bucket_size)::integer AS bucket_index,
    (days_since_posted / p_bucket_size) * p_bucket_size AS days_ago_start,
    LEAST(
      ((days_since_posted / p_bucket_size) * p_bucket_size) + p_bucket_size - 1,
      p_max_days_ago
    ) AS days_ago_end,
    COUNT(*)::bigint AS listings
  FROM job_data
  WHERE days_since_posted IS NOT NULL
    AND days_since_posted >= 0
    AND days_since_posted <= p_max_days_ago
    AND (p_city IS NULL OR normalize_city(primary_city) = p_city)
    AND (p_skill_domain IS NULL OR skill_domain = p_skill_domain)
  GROUP BY (days_since_posted / p_bucket_size)
  ORDER BY (days_since_posted / p_bucket_size) DESC;
$$;

-- PostgREST caches the function catalog (that cache is exactly what
-- PGRST202 was complaining about) — this makes the new function visible
-- immediately instead of waiting for the next automatic reload.
NOTIFY pgrst, 'reload schema';
