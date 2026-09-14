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


class GlassdoorSpider(scrapy.Spider):
    """
    Glassdoor India (glassdoor.co.in) list-page + detail-page crawl.

    NOTE on fragility: Glassdoor is one of the more defended job boards
    (login walls appearing mid-scroll, PerimeterX-style bot checks, class
    names that rotate across builds). The selectors here are a best-effort,
    multi-fallback attempt, same spirit as the naukri/indeed spiders, and
    should be expected to need re-checking against the live DOM. Glassdoor
    also does not expose a role-category/industry search facet, so — same
    as Indeed — those fields fall back to the search query bucket rather
    than a fragile keyword guess from the title.
    """

    name = "glassdoor"
    allowed_domains = ["glassdoor.co.in", "glassdoor.com"]

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
        base = (
            "https://www.glassdoor.co.in/Job/jobs.htm"
            f"?sc.keyword={query.replace(' ', '+')}&locKeyword={location.replace(' ', '+')}"
        )
        return base if page == 1 else f"{base}&p={page}"

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
                                # Glassdoor likes to interrupt scroll with a
                                # sign-in modal; best-effort dismiss it.
                                PageMethod(
                                    "evaluate",
                                    "() => { const b = document.querySelector("
                                    "'button[alt=\"Close\"], .modal_closeIcon-svg'); "
                                    "if (b) b.click(); }",
                                ),
                                PageMethod("wait_for_timeout", 1500),
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

        cards = selector.css("li.react-job-listing, li[data-test='jobListing'], div.JobCard_jobCardContainer__")
        if not cards:
            self.logger.warning(f"No cards found on {response.url}")
            return

        proxy_list = load_proxy_list(self.settings.get("PROXY_LIST"))

        for card in cards:
            if self.jobs_scheduled >= self.max_jobs:
                self.logger.info(f"max_jobs={self.max_jobs} reached, stopping detail scheduling.")
                return

            title = card.css(
                "a.jobLink::text, a[data-test='job-link']::text, a[data-test='job-title']::text"
            ).get("").strip()
            if not title:
                continue

            href = card.css(
                "a.jobLink::attr(href), a[data-test='job-link']::attr(href), a[data-test='job-title']::attr(href)"
            ).get("")
            if not href:
                continue
            job_url = response.urljoin(href)

            job_id = card.attrib.get("data-id") or card.attrib.get("data-jobid")
            if not job_id:
                id_match = re.search(r"jobListingId=(\d+)", href)
                job_id = id_match.group(1) if id_match else None
            if not job_id:
                fallback = re.search(r"JV_[A-Za-z0-9_]+|jl_[A-Za-z0-9]+", href)
                job_id = fallback.group(0) if fallback else href.split("/")[-1][:40]

            company = card.css(
                "[data-test='employer-name']::text, .EmployerProfile_compactEmployerName__::text"
            ).get("").strip()
            location_raw = card.css(
                "[data-test='emp-location']::text, .JobCard_location__::text"
            ).get("").strip()
            salary_raw = " ".join(
                t.strip() for t in card.css(
                    "[data-test='detailSalary'] ::text, .JobCard_salaryEstimate__ ::text"
                ).getall() if t.strip()
            )
            posted_text_raw = card.css(
                "[data-test='job-age'] ::text, .JobCard_listingAge__ ::text"
            ).get("").strip()

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
                    "job_id": str(job_id),
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

        description_html = sel.css(
            "#JobDescriptionContainer, [class*='JobDetails_jobDescription']"
        ).get("") or ""
        job_description_clean = clean_html(description_html)

        # Glassdoor doesn't render discrete skill-tag chips the way Naukri
        # does; leave the array empty rather than splitting the JD blob.
        skills_list = [
            s.strip() for s in sel.css(
                "[data-test='skill-chip'] ::text, [class*='SkillsList'] li ::text"
            ).getall() if s.strip()
        ]

        location_raw = response.meta.get("location_raw") or ""
        location_normalized = normalize_city(location_raw)

        salary_text = " ".join(
            t.strip() for t in sel.css(
                "[data-test='detailSalary'] ::text, [class*='SalaryEstimate'] ::text"
            ).getall() if t.strip()
        ) or response.meta.get("salary_raw", "")
        salary_parsed = parse_salary(salary_text)

        work_mode = infer_work_mode(job_description_clean, location_raw)
        employment_type = infer_employment_type(job_description_clean)

        company_rating = sel.css(
            "[data-test='detailRating'] ::text, [class*='rating'] ::text"
        ).re_first(r"[\d.]+")
        review_count = sel.css(
            "[data-test='employer-review-count'] ::text"
        ).re_first(r"[\d,]+")
        company_size = sel.xpath(
            "//span[contains(text(),'Size')]/following-sibling::span[1]/text()"
        ).get()

        posted_text_raw = response.meta.get("posted_text_raw") or ""

        role_category = response.meta.get("query")

        item = {
            "source": "glassdoor",
            "job_id": response.meta["job_id"],
            "scrape_run_id": self.scrape_run_id,
            "scrape_timestamp": utc_now_iso(),

            "title": response.meta.get("title"),
            "company": response.meta.get("company"),
            "role_category": role_category,
            "functional_area": role_category,
            "industry": None,  # not exposed by Glassdoor's search/detail markup

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

            "company_size": company_size.strip() if company_size else None,
            "company_rating": float(company_rating) if company_rating else None,
            "review_count": int(review_count.replace(",", "")) if review_count else None,

            "ai_mentions": scan_ai_mentions(job_description_clean),
            "ai_mention_count": len(scan_ai_mentions(job_description_clean)),

            "search_query": response.meta.get("query"),
            "search_location": response.meta.get("location"),
        }
        yield item
