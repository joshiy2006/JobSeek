import scrapy
from scrapy_playwright.page import PageMethod
from scrapy.selector import Selector
import lxml.html
import re



class NaukriSpider(scrapy.Spider):
    name = "naukri"
    allowed_domains = ["naukri.com"]

    QUERIES = [
       ## "software developer",
        "python developer",
        "java developer",
        ##"frontend developer",
        ##"backend developer",
        ##"full stack developer",
        "data analyst",
        ##"data scientist",
        "machine learning engineer",
        ##"devops engineer",
        ##"cloud engineer",
        "ui ux designer",
        ##"business analyst"
    ]

    LOCATIONS = [
        "bangalore",
        "mumbai",
        "delhi",
        ##"hyderabad",
        "chennai",
        ##"pune",
        ##"kolkata",
        ##"gurgaon"
    ]

    JS_SCROLL = """
        async () => {
            await new Promise(resolve => {
                let total = 0;
                const step = 600;
                const timer = setInterval(() => {
                    window.scrollBy(0, step);
                    total += step;
                    if (total >= document.body.scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 300);
            });
        }
    """

    def __init__(self, pages=1, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.total_pages = int(pages)

    def get_location(self, card):
    # Strategy 1: data-automation attribute
        location = card.css('[data-automation*="location"] ::text').getall()
        location = ", ".join(t.strip() for t in location if t.strip())
        if location:
            return location

        # Strategy 2: any class containing "loc"
        location = card.css('[class*="loc"] ::text').getall()
        location = ", ".join(t.strip() for t in location if t.strip())
        if location:
            return location

        # Strategy 3: aria-label
        location = card.css('[aria-label*="location"] ::text').getall()
        location = ", ".join(t.strip() for t in location if t.strip())
        if location:
            return location

        return ""

    def _build_url(self, query: str, location: str, page: int) -> str:
        slug = query.lower().replace(" ", "-")
        loc_slug = location.lower().replace(" ", "-")
        base = f"https://www.naukri.com/{slug}-jobs-in-{loc_slug}"
        return base if page == 1 else f"{base}-{page}"

    def start_requests(self):
        self.logger.info("Entered start requests")
        for query in self.QUERIES:
            for location in self.LOCATIONS:
                for page in range(1, self.total_pages + 1):
                    
                    url = self._build_url(query, location, page)
                    self.logger.info(f"scheduling {url}")
                    yield scrapy.Request(
                        url,
                        meta={
                                "playwright": True,
                    "playwright_include_page": True,
                    "playwright_page_methods": [
                            PageMethod("wait_for_load_state", "domcontentloaded"),
                            PageMethod("wait_for_timeout", 3000),
                            PageMethod("evaluate", self.JS_SCROLL),
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
        request=failure.request

        retries=request.meta.get("retry_count", 0)
        if retries < 2:
            self.logger.warning(f"Retrying {request.url} (retry {retries + 1}) due to {failure.value}")
            request.meta["retry_count"]=retries+1

            yield request.replace(
                meta={
                    **request.meta,
                    "retry_count": retries + 1,
                },
                dont_filter=True,
            )
            return
        
        self.logger.error(f"Request failed after 3 retries: {request.url} — {failure.value}")
        with open("failed_urls.txt", "a") as f:
            f.write(f"{request.url}\n")

    async def parse(self, response):
        page = response.meta.get("playwright_page")
        if page:
            await page.close()

        # ─── DECISIVE WINDOWS/ANACONDA ENCODING BYPASS ───
        try:
            html_text = response.body.decode('utf-8', errors='ignore')
            parser = lxml.html.HTMLParser(recover=True)
            root_node = lxml.html.fromstring(html_text, parser=parser)
            selector = Selector(root=root_node)
            with open("debug.html", "w", encoding="utf-8") as f:
                f.write(html_text)
        except Exception as e:
            self.logger.error(f"Insulated extraction failed, falling back: {e}")
            selector = response

        # Target the main outer container shown in your screenshot
        cards = selector.css("div.srp-jobtuple-wrapper")
        if not cards:
            filename=f"debug_{response.meta['page_number']}.html"

            with open(filename, "w", encoding="utf-8") as f:
                f.write(response.text)
            
            self.logger.warning(f"No cards found on page {response.meta['page_number']}: {response.url}")
            return

        for card in cards:
            # Selectors explicitly matched against your image_6c5437.png layout
            title = card.css("a.title::text").get("").strip()
            job_url = card.css("a.title::attr(href)").get("").strip()
            company = card.css("a.comp-name::text").get("").strip()
            
            # Target elements nested within row3 .job-details wrapper
            experience = " ".join(
                t.strip()
                for t in card.css(
                    "span.expwdth ::text, span.exp-wrap ::text"
                ).getall()
                if t.strip()
            )
            salary = " ".join(
                    t.strip()
                    for t in card.css("i.ni-icon-salary + span::text").getall()
                    if t.strip()
                )
            
            # Handle locations (extracting multiple strings if it's a multi-location listing)
            location = self.get_location(card)

            # Target the tags list item layouts inside row5
            skills = card.css("li.dot-gt ::text").getall()
            skills = [s.strip() for s in skills if s.strip()]
            
            # Target the posted date tag inside row6
            posted = " ".join(
                t.strip()
                for t in card.css(".job-post-day ::text").getall()
                if t.strip()
            )
            
            job_id = self._extract_job_id(job_url)

            if not title:
                continue

            yield {
                "job_id": job_id,
                "title": title,
                "company": company,
                "experience": experience,
                "salary": salary,
                "location": location,
                "skills": skills,
                "job_url": job_url,
                "posted": posted,
                "search_query": response.meta.get("query"),
                "search_location": response.meta.get("location"),
            }

    @staticmethod
    def _extract_job_id(url: str) -> str:
        match = re.search(r"-(\d{6,12})(?:\?|$)", url)
        return match.group(1) if match else url.split("/")[-1][:20]

    