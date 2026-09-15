# Define here the models for your spider middleware
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/spider-middleware.html

import os
from scrapy import signals

# useful for handling different item types with a single interface
from itemadapter import is_item, ItemAdapter

from naukri_scraper.utils import random_user_agent, random_proxy, load_proxy_list


class NaukriScraperSpiderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the spider middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_spider_input(self, response, spider):
        # Called for each response that goes through the spider
        # middleware and into the spider.

        # Should return None or raise an exception.
        return None

    def process_spider_output(self, response, result, spider):
        # Called with the results returned from the Spider, after
        # it has processed the response.

        # Must return an iterable of Request, or item objects.
        for i in result:
            yield i

    def process_spider_exception(self, response, exception, spider):
        # Called when a spider or process_spider_input() method
        # (from other spider middleware) raises an exception.

        # Should return either None or an iterable of Request or item objects.
        pass

    def process_start_requests(self, start_requests, spider):
        # Called with the start requests of the spider, and works
        # similarly to the process_spider_output() method, except
        # that it doesn’t have a response associated.

        # Must return only requests (not items).
        for r in start_requests:
            yield r

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)


class RotatingUserAgentMiddleware:
    """
    Sets the User-Agent on every request that isn't already going through
    scrapy-playwright (playwright requests get theirs set per-context in the
    spider itself, via utils.playwright_context_kwargs, since Playwright
    ignores plain header overrides on a launched browser).

    Despite the class name, utils.random_user_agent() no longer rotates —
    per-request UA rotation combined with free rotating proxies is what got
    Naukri to start returning 403s, so both were reverted to a single,
    stable UA / no proxy. Kept as a class (rather than inlined) so
    re-enabling real rotation later, with a properly vetted proxy pool, is a
    one-line change back in utils.py.
    """

    def process_request(self, request, spider):
        if request.meta.get("playwright"):
            return None
        request.headers["User-Agent"] = random_user_agent()
        return None


class RotatingProxyMiddleware:
    """
    Rotates outbound IP for plain (non-playwright) requests using PROXY_LIST.
    Playwright requests get their proxy set per-context in the spider itself
    (see utils.playwright_context_kwargs) since Playwright's proxy is a
    browser-context launch option, not a request header.

    PROXY_LIST env var: comma-separated proxy URLs, e.g.
        PROXY_LIST="http://user:pass@1.2.3.4:8000,http://user:pass@5.6.7.8:8000"
    Left unset, requests simply go out on the runner's own IP.
    """

    def __init__(self, proxy_list):
        self.proxy_list = proxy_list

    @classmethod
    def from_crawler(cls, crawler):
        proxy_list = load_proxy_list(crawler.settings.get("PROXY_LIST") or os.getenv("PROXY_LIST"))
        return cls(proxy_list)

    def process_request(self, request, spider):
        if request.meta.get("playwright") or not self.proxy_list:
            return None
        proxy = random_proxy(self.proxy_list)
        if proxy:
            scheme = "https" if proxy["server"].startswith("https://") else "http"
            server = proxy["server"].split("://", 1)[-1]
            if proxy.get("username") and proxy.get("password"):
                request.meta["proxy"] = f"{scheme}://{proxy['username']}:{proxy['password']}@{server}"
            else:
                request.meta["proxy"] = f"{scheme}://{server}"
        return None


class NaukriScraperDownloaderMiddleware:
    # Not all methods need to be defined. If a method is not defined,
    # scrapy acts as if the downloader middleware does not modify the
    # passed objects.

    @classmethod
    def from_crawler(cls, crawler):
        # This method is used by Scrapy to create your spiders.
        s = cls()
        crawler.signals.connect(s.spider_opened, signal=signals.spider_opened)
        return s

    def process_request(self, request, spider):
        # Called for each request that goes through the downloader
        # middleware.

        # Must either:
        # - return None: continue processing this request
        # - or return a Response object
        # - or return a Request object
        # - or raise IgnoreRequest: process_exception() methods of
        #   installed downloader middleware will be called
        return None

    def process_response(self, request, response, spider):
        # Called with the response returned from the downloader.

        # Must either;
        # - return a Response object
        # - return a Request object
        # - or raise IgnoreRequest
        return response

    def process_exception(self, request, exception, spider):
        # Called when a download handler or a process_request()
        # (from other downloader middleware) raises an exception.

        # Must either:
        # - return None: continue processing this exception
        # - return a Response object: stops process_exception() chain
        # - return a Request object: stops process_exception() chain
        pass

    def spider_opened(self, spider):
        spider.logger.info("Spider opened: %s" % spider.name)
