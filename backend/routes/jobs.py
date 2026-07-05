from fastapi import APIRouter, HTTPException, Query
from database.supabase import supabase

router=APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/")
async def search_jobs(
    title: str | None = Query(None),
    location: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    try:
        query=supabase.table("naukri_jobs").select("*", count="exact")
        if title:
            query = query.ilike(
                "jobtitle",
                f"%{title}%"
            )

        # Filter by location
        if location:
            query = query.ilike(
                "location",
                f"%{location}%"
            )

        start=(page-1)*page_size
        end=start+page_size-1
        response = query.range(start, end).execute()

        return {
            "count": response.count,
            "page": page,
            "page_size": page_size,
            "jobs": response.data
        }
    except Exception as e:
        print(e)
        raise