from fastapi import APIRouter, HTTPException, Query
from database.supabase import supabase

router = APIRouter(prefix="/jobs", tags=["Jobs"])

# Hard ceiling: regardless of query, never show more than 5 pages of
# 10 jobs each (most recent 50 postings overall).
PAGE_SIZE = 10
MAX_PAGES = 5
MAX_RESULTS = PAGE_SIZE * MAX_PAGES  # 50


@router.get("/")
async def search_jobs(
    title: str | None = Query(None),
    location: str | None = Query(None),
    page: int = Query(1, ge=1, le=MAX_PAGES),
):
    try:
        query = supabase.table("new_jobs_data").select("*", count="exact")

        if title:
            query = query.ilike("title", f"%{title}%")
        if location:
            query = query.ilike("location", f"%{location}%")

        # Most recent postings first.
        query = query.order("days_ago", desc=False)

        start = (page - 1) * PAGE_SIZE
        end = start + PAGE_SIZE - 1  # end is inclusive, and start/end
        # are already bounded to at most MAX_RESULTS-1 by page<=MAX_PAGES
        response = query.range(start, end).execute()

        # Cap the reported count too — this is what the frontend uses
        # to compute totalPages, so without capping it here "Page 1 of
        # 3,256" comes right back even though we never serve past 50.
        capped_count = min(response.count or 0, MAX_RESULTS)

        return {
            "count": capped_count,
            "page": page,
            "page_size": PAGE_SIZE,
            "jobs": response.data,
        }
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))