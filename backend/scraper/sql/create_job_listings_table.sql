-- ============================================================================
-- job_listings — run this in the NEW Supabase project (a different project
-- from the one the original `scraped_jobs` table lives in).
--
-- One table, three sources (naukri / indeed / glassdoor), one schema. Every
-- field here is filled in at scrape time by naukri_scraper/utils.py — no
-- reconstructing dates, salaries, skills, or city names downstream.
-- ============================================================================

create table if not exists public.job_listings (
    id                          bigint generated always as identity primary key,

    -- identity / provenance ------------------------------------------------
    source                      text not null check (source in ('naukri', 'indeed', 'glassdoor')),
    job_id                      text not null,
    scrape_run_id               uuid not null,
    scrape_timestamp            timestamptz not null,

    -- core listing fields -----------------------------------------------
    title                       text,
    company                     text,
    role_category               text,              -- Naukri: real facet. Indeed/Glassdoor: search-query bucket (documented limitation, not a keyword guess).
    functional_area             text,
    industry                    text,               -- kept separate from role_category on purpose — do not conflate

    location_raw                text,
    location_city_normalized    text,               -- Bangalore/Bengaluru-style aliasing applied at scrape time
    location_tier               text check (location_tier in ('Tier-1', 'Tier-2', 'Tier-3', 'Unknown')),

    experience_raw              text,
    experience_min_years        smallint,
    experience_max_years        smallint,

    skills_list                 text[] default '{}',       -- raw discrete tags as scraped from the DOM
    skills_canonical            text[] default '{}',       -- collapsed to one canonical token per skill

    salary_raw                  text,
    salary_min                  numeric,
    salary_max                  numeric,
    currency                    text,
    salary_disclosed            boolean not null default false,

    job_description_clean       text,               -- HTML stripped at scrape time

    work_mode                   text check (work_mode in ('Remote', 'Hybrid', 'Onsite', 'Unknown')),
    employment_type             text check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship', 'Unknown')),

    job_url                     text,               -- actual listing permalink, not a search-page fallback

    posted_text_raw             text,               -- kept for audit ("2 Days Ago")
    posted_date_computed        date,               -- real date, anchored to scrape_timestamp — this is what trend buckets should use
    listing_status               text default 'active' check (listing_status in ('active', 'expired', 'unknown')),

    company_size                text,
    company_rating               numeric,
    review_count                 integer,

    -- Tab C: AI Vulnerability Index inputs ---------------------------------
    ai_mentions                  text[] default '{}',   -- matched keywords from the documented AI_TOOL_KEYWORDS list (see utils.py — this IS the methodology-panel artifact)
    ai_mention_count             integer default 0,

    -- search metadata -------------------------------------------------------
    search_query                 text,
    search_location              text,

    created_at                   timestamptz not null default now(),
    updated_at                   timestamptz not null default now(),

    unique (source, job_id)
);

-- Keep updated_at honest on every upsert.
create or replace function public.set_job_listings_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_job_listings_updated_at on public.job_listings;
create trigger trg_job_listings_updated_at
    before update on public.job_listings
    for each row
    execute function public.set_job_listings_updated_at();

-- Indexes matching the deck's actual query patterns -------------------------
create index if not exists idx_job_listings_posted_date on public.job_listings (posted_date_computed);
create index if not exists idx_job_listings_role_category on public.job_listings (role_category);
create index if not exists idx_job_listings_industry on public.job_listings (industry);
create index if not exists idx_job_listings_city on public.job_listings (location_city_normalized);
create index if not exists idx_job_listings_tier on public.job_listings (location_tier);
create index if not exists idx_job_listings_source on public.job_listings (source);
create index if not exists idx_job_listings_scrape_run on public.job_listings (scrape_run_id);
create index if not exists idx_job_listings_skills_gin on public.job_listings using gin (skills_canonical);
create index if not exists idx_job_listings_ai_mentions_gin on public.job_listings using gin (ai_mentions);

-- Row Level Security ----------------------------------------------------
-- Service-role key (used by the scraper pipeline) bypasses RLS automatically.
-- This policy just makes the table safely readable from the frontend via the anon key.
alter table public.job_listings enable row level security;

drop policy if exists "Public read access" on public.job_listings;
create policy "Public read access"
    on public.job_listings
    for select
    using (true);


-- ============================================================================
-- OPTIONAL companion tables — the deck names these explicitly for Tab B and
-- Tab C. They are NOT populated by the three job-board spiders above; they
-- need their own separate scrape/ingest (course catalogs, an external
-- automation-exposure dataset). Included here so the schema is ready when
-- you build those pipelines — comment out if you only want job_listings.
-- ============================================================================

-- Tab B skill-gap map needs PMKVY + SWAYAM catalogs (NPTEL alone isn't these).
create table if not exists public.course_catalog (
    id                bigint generated always as identity primary key,
    portal            text not null check (portal in ('PMKVY', 'SWAYAM', 'NPTEL')),
    title             text not null,
    sector            text,               -- sector / discipline tag
    skills_covered    text[] default '{}',
    duration          text,
    url               text,
    scrape_timestamp  timestamptz not null default now(),
    unique (portal, url)
);

-- Tab C intermediate component values per role/city/date, so the
-- methodology panel can show its work instead of asserting a formula.
create table if not exists public.ai_vulnerability_scores (
    id                        bigint generated always as identity primary key,
    role_category             text not null,
    location_city_normalized  text,
    score_date                date not null,

    hiring_decline_pct        numeric,        -- component 1: role/city posting volume trend
    ai_mention_ratio          numeric,        -- component 2: postings mentioning AI tools / total postings for role
    replacement_ratio         numeric,        -- component 3: see methodology notes below

    vulnerability_score       numeric,        -- final 0-100, computed from the three components above
    methodology_version       text,           -- bump this whenever the formula changes, so old scores stay explainable

    created_at                timestamptz not null default now(),
    unique (role_category, location_city_normalized, score_date, methodology_version)
);

comment on table public.ai_vulnerability_scores is
    'replacement_ratio: pick and document ONE approach — (a) automation-tool mention ratio for the role, '
    '(b) role growth rate relative to overall market growth (both derivable from job_listings), or '
    '(c) an external published occupation automation-exposure index joined on role_category (requires '
    'sourcing + attributing that dataset separately — not derivable from job-board scraping alone).';
