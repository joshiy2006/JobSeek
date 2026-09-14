# Define your item pipelines here
#
# Don't forget to add your pipeline to the ITEM_PIPELINES setting
# See: https://docs.scrapy.org/en/latest/topics/item-pipeline.html




# ─────────────────────────────── PIPELINE ──────────────────────────────────
# naukri_scraper/pipelines.py

import os
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)


class SupabasePipeline:
    def __init__(self, supabase_url: str, supabase_key: str, table_name: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.table_name = table_name
        self.client: Client = None
        self.batch: list = []
        self.BATCH_SIZE = 50

    @classmethod
    def from_crawler(cls, crawler):
        return cls(
            supabase_url=crawler.settings.get("SUPABASE_URL"),
            supabase_key=crawler.settings.get("SUPABASE_KEY"),
            # This dataset is meant to live in a separate Supabase project
            # from the original scraped_jobs table — see sql/create_job_listings_table.sql.
            table_name=crawler.settings.get("SUPABASE_TABLE", os.getenv("SUPABASE_TABLE", "job_listings")),
        )

    def open_spider(self, spider):
        self.client = create_client(self.supabase_url, self.supabase_key)
        logger.info("Supabase client initialised.")

    def process_item(self, item, spider):
        self.batch.append(dict(item))
        if len(self.batch) >= self.BATCH_SIZE:
            self._flush()
        return item

    def close_spider(self, spider):
        if self.batch:
            self._flush()
        logger.info("Supabase pipeline closed.")

    def _flush(self):
        if not self.batch:
            return
        try:
            # upsert on (source, job_id); duplicate scrapes update existing rows.
            # job_id alone isn't safe now that three sources feed this table —
            # numeric ids can collide across naukri/indeed/glassdoor.
            resp = (
                self.client.table(self.table_name)
                .upsert(self.batch, on_conflict="source,job_id")
                .execute()
            )
            logger.info(f"Upserted {len(self.batch)} rows → Supabase ({self.table_name}).")
        except Exception as e:
            logger.error(f"Supabase upsert failed: {e}")
        finally:
            self.batch.clear()
