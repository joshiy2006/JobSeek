import re
from datetime import datetime, timezone

import scrapy
from scrapy_playwright.page import PageMethod
from scrapy.selector import Selector
import lxml.html

from naukri_scraper.utils import (
    new_scrape_run_id,
    utc_now_iso,
    playwright_context_kwargs,
    load_proxy_list,
    normalize_city,
    classify_tier,
    parse_posted_date,
    parse_salary,
    clean_html,
    canonicalize_skills,
    infer_work_mode,
    infer_employment_type,
    scan_ai_mentions,
)


class IndeedSpider(scrapy.Spider):
    """
    Indeed India (in.indeed.com) list-page + detail-page crawl.

    NOTE on fragility: Indeed sits behind aggressive bot-detection
    (Cloudflare-style challenges, class names that get re-hashed across
    deploys). The selectors below are a best-effort, multi-fallback attempt
    and *will* need re-checking against the live DOM periodically — same as
    the naukri spider already has to. Unlike Naukri, Indeed does not expose
    a role-category/industry facet in search results, so those two fields
    fall back to the search query bucket rather than a scraped facet; that
    limitation is intentional and documented rather than papered over with a
    fragile keyword guess.
    """

    name = "indeed"
    allowed_domains = ["indeed.com"]

    QUERIES = [
        "python developer",
        "java developer",
        "data analyst",
        "machine learning engineer",
        "ui ux designer",
    ]

    LOCATIONS = [
        "bangalore",
        "mumbai",
        "delhi",
        "chennai",
    ]

    RESULTS_PER_PAGE = 10

    custom_settings = {
        "CLOSESPIDER_ITEMCOUNT": 1500,
    }

    def __init__(self, pages=1, max_jobs=300, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.total_pages = int(pages)
        self.max_jobs = int(max_jobs)
        self.jobs_scheduled = 0
        self.scrape_run_id = new_scrape_run_id()
        self.scrape_dt = datetime.now(timezone.utc)

    def _build_url(self, query: str, location: str, page: int) -> str:
        start = (page - 1) * self.RESULTS_PER_PAGE
        return f"https://in.indeed.com/jobs?q={query.replace(' ', '+')}&l={location.replace(' ', '+')}&start={start}"

    async def start_requests(self):
        self.logger.info(f"Scrape run {self.scrape_run_id} starting (max_jobs={self.max_jobs}).")
        proxy_list = load_proxy_list(self.settings.get("PROXY_LIST"))

        for query in self.QUERIES:
            if self.jobs_scheduled >= self.max_jobs:
                break
            for location in self.LOCATIONS:
                if self.jobs_scheduled >= self.max_jobs:
                    break
                for page in range(1, self.total_pages + 1):
                    url = self._build_url(query, location, page)
                    self.logger.info(f"Scheduling: {url}")
                    yield scrapy.Request(
                        url,
                        meta={
                            "playwright": True,
                            "playwright_include_page": True,
                            "playwright_context_kwargs": playwright_context_kwargs(proxy_list),
                            "playwright_page_methods": [
                                PageMethod("wait_for_load_state", "domcontentloaded"),
                                PageMethod("wait_for_timeout", 3000),
                            ],
                            "query": query,
                            "location": location,
                            "page_number": page,
                        },
                        callback=self.parse,
                        errback=self.errback,
                    )

    async def errback(self, failure):
        request = failure.request
        page = request.meta.get("playwright_page")
        if page:
            try:
                await page.close()
            except Exception:
                pass

        retries = request.meta.get("retry_count", 0)
        if retries < 2:
            self.logger.warning(f"Retrying {request.url} (retry {retries + 1})")
            yield request.replace(
                meta={**request.meta, "retry_count": retries + 1},
                dont_filter=True,
            )
            return

        self.logger.error(f"Failed completely: {request.url}")

    async def parse(self, response):
        page = response.meta.get("playwright_page")
        if page:
            await page.close()

        try:
            html_text = response.body.decode('utf-8', errors='ignore')
            parser = lxml.html.HTMLParser(recover=True)
            root_node = lxml.html.fromstring(html_text, parser=parser)
            selector = Selector(root=root_node)
        except Exception as e:
            self.logger.error(f"Fallback triggered: {e}")
            selector = response

        cards = selector.css("div.job_seen_beacon, td.resultContent, div.jobsearch-SerpJobCard")
        if not cards:
            self.logger.warning(f"No cards found on {response.url}")
            return

        proxy_list = load_proxy_list(self.settings.get("PROXY_LIST"))

        for card in cards:
            if self.jobs_scheduled >= self.max_jobs:
                self.logger.info(f"max_jobs={self.max_jobs} reached, stopping detail scheduling.")
                return

            title = card.css("h2.jobTitle span::text, h2.jobTitle a::text, a.jcs-JobTitle span::text").get("").strip()
            if not title:
                continue

            job_id = (
                card.css("a::attr(data-jk)").get("")
                or card.attrib.get("data-jk", "")
                or card.css("[data-jk]::attr(data-jk)").get("")
            ).strip()
            if not job_id:
                continue

            job_url = f"https://in.indeed.com/viewjob?jk={job_id}"
            company = card.css(
                "span.companyName::text, [data-testid='company-name']::text"
            ).get("").strip()
            location_raw = " ".join(
                t.strip() for t in card.css(
                    "div.companyLocation ::text, [data-testid='text-location'] ::text"
                ).getall() if t.strip()
            )
            salary_raw = " ".join(
                t.strip() for t in card.css(
                    "div.salary-snippet-container ::text, "
                    "div.metadata.salary-snippet-container ::text, "
                    "[data-testid='attribute_snippet_testid'] ::text"
                ).getall() if t.strip()
            )
            posted_text_raw = " ".join(
                t.strip() for t in card.css("span.date ::text, [data-testid='myJobsStateDate'] ::text").getall() if t.strip()
            )

            self.jobs_scheduled += 1

            yield scrapy.Request(
                job_url,
                meta={
                    "playwright": True,
                    "playwright_include_page": True,
                    "playwright_context_kwargs": playwright_context_kwargs(proxy_list),
                    "playwright_page_methods": [
                        PageMethod("wait_for_load_state", "domcontentloaded"),
                        PageMethod("wait_for_timeout", 2000),
                    ],
                    "job_id": job_id,
                    "title": title,
                    "company": company,
                    "location_raw": location_raw,
                    "salary_raw": salary_raw,
                    "posted_text_raw": posted_text_raw,
                    "job_url": job_url,
                    "query": response.meta.get("query"),
                    "location": response.meta.get("location"),
                },
                callback=self.parse_job_detail,
                errback=self.errback,
                dont_filter=True,
            )

    async def parse_job_detail(self, response):
        page = response.meta.get("playwright_page")
        if page:
            await page.close()

        try:
            html_text = response.body.decode('utf-8', errors='ignore')
            parser = lxml.html.HTMLParser(recover=True)
            root_node = lxml.html.fromstring(html_text, parser=parser)
            sel = Selector(root=root_node)
        except Exception as e:
            self.logger.error(f"Detail-page parse fallback triggered: {e}")
            sel = response

        description_html = sel.css("#jobDescriptionText").get("") or ""
        job_description_clean = clean_html(description_html)

        # Indeed occasionally renders a discrete "skills" chip list on the
        # detail page ("Profile insights" panel). Scrape those DOM nodes
        # directly when present; otherwise leave the list empty rather than
        # ever falling back to splitting the JD blob on commas.
        skills_list = [
            s.strip() for s in sel.css(
                "[data-testid='skills'] li ::text, "
                "[data-testid*='skill'] ::text, "
                ".js-match-insights-provider-tvvxwd li ::text"
            ).getall() if s.strip()
        ]

        location_raw = response.meta.get("location_raw") or ""
        location_normalized = normalize_city(location_raw)

        salary_text = " ".join(
            t.strip() for t in sel.css(
                "#salaryInfoAndJobType ::text, .jobsearch-JobMetadataHeader-item ::text"
            ).getall() if t.strip()
        ) or response.meta.get("salary_raw", "")
        salary_parsed = parse_salary(salary_text)

        job_type_text = " ".join(
            t.strip() for t in sel.css(
                "#salaryInfoAndJobType ::text, .jobsearch-JobMetadataHeader-item ::text"
            ).getall() if t.strip()
        )

        work_mode = infer_work_mode(job_type_text, job_description_clean, location_raw)
        employment_type = infer_employment_type(job_type_text, job_description_clean)

        company_rating = sel.css(
            "[data-testid='companyInfo-rating'] ::text, .icl-Ratings-starsCountWrapper ::text"
        ).re_first(r"[\d.]+")
        review_count = sel.css(
            "[data-testid='companyInfo-reviewCount'] ::text"
        ).re_first(r"[\d,]+")

        posted_text_raw = response.meta.get("posted_text_raw") or ""

        # Indeed's search UI has no role-category/industry facet the way
        # Naukri does — the search query is the closest honest proxy we have,
        # so we use it rather than guessing from keywords in the title.
        role_category = response.meta.get("query")

        item = {
            "source": "indeed",
            "job_id": response.meta["job_id"],
            "scrape_run_id": self.scrape_run_id,
            "scrape_timestamp": utc_now_iso(),

            "title": response.meta.get("title"),
            "company": response.meta.get("company"),
            "role_category": role_category,
            "functional_area": role_category,
            "industry": None,  # not exposed by Indeed's search/detail markup

            "location_raw": location_raw,
            "location_city_normalized": location_normalized,
            "location_tier": classify_tier(location_normalized),

            "experience_raw": None,
            "experience_min_years": None,
            "experience_max_years": None,

            "skills_list": skills_list,
            "skills_canonical": canonicalize_skills(skills_list),

            "salary_raw": salary_text,
            **salary_parsed,

            "job_description_clean": job_description_clean,

            "work_mode": work_mode,
            "employment_type": employment_type,

            "job_url": response.meta.get("job_url") or response.url,

            "posted_text_raw": posted_text_raw,
            "posted_date_computed": parse_posted_date(posted_text_raw, self.scrape_dt),
            "listing_status": "active",

            "company_size": None,  # not exposed by Indeed's search/detail markup
            "company_rating": float(company_rating) if company_rating else None,
            "review_count": int(review_count.replace(",", "")) if review_count else None,

            "ai_mentions": scan_ai_mentions(job_description_clean),
            "ai_mention_count": len(scan_ai_mentions(job_description_clean)),

            "search_query": response.meta.get("query"),
            "search_location": response.meta.get("location"),
        }
        yield item
