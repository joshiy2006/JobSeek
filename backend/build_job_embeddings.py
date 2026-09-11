"""
Offline embedding script for new_jobs_data -> job_embeddings.

Run this on its own:
    python build_job_embeddings.py

Safe to re-run: it only embeds rows whose jobId isn't already present
in job_embeddings, so incremental new postings are cheap to pick up.
"""

import os
import sys
import time
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing SUPABASE_URL / SUPABASE_KEY in the environment.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

SOURCE_TABLE = "new_jobs_data"
TARGET_TABLE = "job_embeddings"

FETCH_PAGE_SIZE = 1000
EMBED_BATCH_SIZE = 200
UPSERT_CHUNK_SIZE = 15

def safe_upsert(supabase_client, table_name, records):
    """Attempts batch upsert, falling back to 1-by-1 if a timeout occurs."""
    try:
        supabase_client.table(table_name).upsert(records, on_conflict="jobId").execute()
    except Exception as err:
        # If a batch times out or fails, process rows individually
        if len(records) > 1:
            print(f"    Batch of {len(records)} failed ({err}). Retrying individually...")
            for single_record in records:
                try:
                    supabase_client.table(table_name).upsert([single_record], on_conflict="jobId").execute()
                except Exception as single_err:
                    print(f"    Skipping jobId {single_record.get('jobId')} due to error: {single_err}")
        else:
            print(f"    Skipping single record due to error: {err}")


def to_lakhs(rupees: float) -> str:
    lakhs = rupees / 100000
    if lakhs == int(lakhs):
        return str(int(lakhs))
    return f"{lakhs:.2f}".rstrip("0").rstrip(".")


def format_salary(min_raw, max_raw, currency=None) -> str:
    try:
        min_val = float(min_raw)
        max_val = float(max_raw)
    except (TypeError, ValueError):
        return "Not disclosed"
    if min_val <= 0 or max_val <= 0:
        return "Not disclosed"
    cur = currency or "₹"
    return f"{cur}{to_lakhs(min_val)}–{to_lakhs(max_val)} LPA"


def load_embedding_model():
    from langchain_community.embeddings import HuggingFaceEmbeddings
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
    )


def fetch_existing_embedded_ids(page_size=1000):
    """Fetches IDs already present in job_embeddings using keyset pagination."""
    existing_ids = set()
    last_id = 0

    while True:
        query = (
            supabase.table(TARGET_TABLE)
            .select("jobId")
            .order("jobId")
            .limit(page_size)
        )
        if last_id > 0:
            query = query.gt("jobId", last_id)

        res = query.execute()
        batch = res.data or []
        if not batch:
            break

        existing_ids.update(row["jobId"] for row in batch)
        last_id = batch[-1]["jobId"]

        if len(batch) < page_size:
            break

    return existing_ids


def fetch_source_jobs(page_size=1000):
    """Fetches jobs from source table using keyset pagination."""
    all_jobs = []
    last_id = 0

    while True:
        query = (
            supabase.table(SOURCE_TABLE)
            .select(
                "jobId, title, companyName, location, tagsAndSkills, experience, "
                "minimumSalary, maximumSalary, currency, AggregateRating"
            )
            .order("jobId")
            .limit(page_size)
        )

        if last_id > 0:
            query = query.gt("jobId", last_id)

        res = query.execute()
        batch = res.data or []
        if not batch:
            break

        all_jobs.extend(batch)
        last_id = batch[-1]["jobId"]
        print(f"  Fetched {len(all_jobs)} rows so far (last jobId: {last_id})...")

        if len(batch) < page_size:
            break

    return all_jobs


def build_page_content(job, salary_display):
    return f"""Job Title: {job.get('title', 'N/A')}
Company: {job.get('companyName', 'N/A')}
Location: {job.get('location', 'N/A')}
Experience: {job.get('experience', 'N/A')}
Skills: {job.get('tagsAndSkills', 'N/A')}
Salary: {salary_display}
Rating: {job.get('AggregateRating', 'N/A')}""".strip()


def main():
    print("Loading embedding model...")
    embedding_model = load_embedding_model()

    print("Fetching already-embedded job IDs...")
    existing_ids = fetch_existing_embedded_ids()
    print(f"  {len(existing_ids)} jobs already embedded.")

    print(f"Fetching jobs from {SOURCE_TABLE}...")
    all_jobs = fetch_source_jobs()
    print(f"  {len(all_jobs)} total jobs in source table.")

    new_jobs = [j for j in all_jobs if j.get("jobId") not in existing_ids]
    if not new_jobs:
        print("Nothing new to embed. Done.")
        return

    print(f"Embedding and saving {len(new_jobs)} new jobs in batches...")
    start_time = time.time()
    total_saved = 0

    for batch_start in range(0, len(new_jobs), EMBED_BATCH_SIZE):
        batch_jobs = new_jobs[batch_start: batch_start + EMBED_BATCH_SIZE]
        
        page_contents = []
        salary_displays = []
        for job in batch_jobs:
            sal = format_salary(job.get("minimumSalary"), job.get("maximumSalary"), job.get("currency"))
            salary_displays.append(sal)
            page_contents.append(build_page_content(job, sal))

        embeddings = embedding_model.embed_documents(page_contents)

        # Build payload matching exact job_embeddings schema
        records = []
        for job, content, embedding, sal in zip(batch_jobs, page_contents, embeddings, salary_displays):
            records.append({
                "jobId": job.get("jobId"),
                "title": job.get("title", ""),
                "companyName": job.get("companyName", ""),
                "location": job.get("location", ""),
                "tagsAndSkills": job.get("tagsAndSkills", ""),
                "experience": job.get("experience", ""),
                "rating": str(job.get("AggregateRating") or ""),
                "salary_display": sal,
                "page_content": content,
                "embedding": embedding,
            })

        # Upsert in smaller chunks
        for i in range(0, len(records), UPSERT_CHUNK_SIZE):
            chunk = records[i:i + UPSERT_CHUNK_SIZE]
            supabase.table(TARGET_TABLE).upsert(chunk, on_conflict="jobId").execute()
            total_saved += len(chunk)

        done = min(batch_start + EMBED_BATCH_SIZE, len(new_jobs))
        elapsed = time.time() - start_time
        print(f"  Embedded & saved {done}/{len(new_jobs)} ({total_saved} total saved, {elapsed:.0f}s elapsed)")

    print(f"\nDone! {total_saved} jobs embedded and saved.")


if __name__ == "__main__":
    main()