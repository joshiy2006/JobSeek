# Shared item schema across all three sources (naukri / indeed / glassdoor).
#
# Every spider yields a plain dict with exactly these keys (see
# naukri_scraper/utils.py for the parsing helpers that fill them in). Keeping
# one schema means one Supabase table and one set of downstream queries,
# instead of three tables with slightly-different column names.
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class JobItem(scrapy.Item):
    # ── identity / provenance ────────────────────────────────────────────
    source = scrapy.Field()             # "naukri" | "indeed" | "glassdoor"
    job_id = scrapy.Field()             # stable per-source id
    scrape_run_id = scrapy.Field()      # one id per crawl process
    scrape_timestamp = scrapy.Field()   # real UTC datetime, ISO 8601

    # ── core listing fields ──────────────────────────────────────────────
    title = scrapy.Field()
    company = scrapy.Field()
    role_category = scrapy.Field()      # facet value, not keyword-guessed
    functional_area = scrapy.Field()
    industry = scrapy.Field()           # kept separate from role_category

    location_raw = scrapy.Field()
    location_city_normalized = scrapy.Field()
    location_tier = scrapy.Field()      # Tier-1 / Tier-2 / Tier-3 / Unknown

    experience_raw = scrapy.Field()
    experience_min_years = scrapy.Field()
    experience_max_years = scrapy.Field()

    skills_list = scrapy.Field()        # raw discrete tags, list[str]
    skills_canonical = scrapy.Field()   # canonicalized taxonomy, list[str]

    salary_raw = scrapy.Field()
    salary_min = scrapy.Field()
    salary_max = scrapy.Field()
    currency = scrapy.Field()
    salary_disclosed = scrapy.Field()   # bool

    job_description_clean = scrapy.Field()  # HTML stripped at scrape time

    work_mode = scrapy.Field()          # Remote / Hybrid / Onsite / Unknown
    employment_type = scrapy.Field()    # Full-time / Part-time / Contract / Internship

    job_url = scrapy.Field()            # actual listing permalink

    posted_text_raw = scrapy.Field()    # "2 Days Ago" etc, kept for audit
    posted_date_computed = scrapy.Field()  # real ISO date, anchored to scrape time
    listing_status = scrapy.Field()     # active / expired / unknown

    company_size = scrapy.Field()
    company_rating = scrapy.Field()
    review_count = scrapy.Field()

    # ── Tab C: AI Vulnerability Index inputs ─────────────────────────────
    ai_mentions = scrapy.Field()        # list[str] of matched keywords
    ai_mention_count = scrapy.Field()

    # ── search metadata (how this row was found) ─────────────────────────
    search_query = scrapy.Field()
    search_location = scrapy.Field()
