"""
job_data-backed API
--------------------
Real queries against `job_data` (+ `courses` for the gap map).
See get_job_data_hiring_trends_fix.sql for the hiring-trends function.
skill-trends / skill-gap-map are unchanged and rely on the existing
get_job_data_max_date / get_skill_trends / get_skill_gap_map functions
already in the database.

    from routers.job_data_router import router as job_data_router
    app.include_router(job_data_router)
"""

import os
from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client, create_client

router = APIRouter(prefix="/api", tags=["job-data"])

_SUPABASE_URL = os.environ["SUPABASE_URL"]
_SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]


def get_supabase() -> Client:
    return create_client(_SUPABASE_URL, _SUPABASE_SERVICE_KEY)


def _get_anchor_date(supabase: Client) -> date:
    """Still used by /skill-trends below — unchanged."""
    try:
        result = supabase.rpc("get_job_data_max_date", {}).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"could not resolve dataset date range: {exc}")

    raw = result.data
    if isinstance(raw, list):
        raw = raw[0] if raw else None
    if not raw:
        raise HTTPException(status_code=500, detail="job_data has no resolvable post dates")
    return date.fromisoformat(raw)


# ------------------------------------------------------------------
# Hiring Trends — UPDATED
# ------------------------------------------------------------------
# job_data is a one-time scraped snapshot, not a live feed — bucketing
# by absolute calendar date (the old approach) clusters almost every
# row onto the scrape day, which is what produced the single-day spike
# in the chart. days_since_posted is already a precomputed real
# column, so bucketing on that directly avoids the date-anchor step
# entirely and reflects the actual age distribution of postings.
TIMEFRAME_CONFIG = {
    "7d":  {"max_days_ago": 6,   "bucket_size": 1},
    "30d": {"max_days_ago": 29,  "bucket_size": 1},
    "90d": {"max_days_ago": 89,  "bucket_size": 7},
    "1yr": {"max_days_ago": 364, "bucket_size": 30},
}


def _bucket_label(start: int, end: int) -> str:
    if start == end:
        return "Today" if start == 0 else f"{start}d ago"
    return f"{start}-{end}d ago"


@router.get("/hiring-trends")
def get_hiring_trends(
    timeframe: str = Query("30d", pattern="^(7d|30d|90d|1yr)$"),
    city: Optional[str] = Query(None, description="Matched against primary_city. Omit/'all' for no filter."),
    supabase: Client = Depends(get_supabase),
):
    if timeframe not in TIMEFRAME_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe '{timeframe}'")

    cfg = TIMEFRAME_CONFIG[timeframe]
    city_filter = city if city and city.lower() != "all" else None

    params = {
        "p_max_days_ago": cfg["max_days_ago"],
        "p_bucket_size": cfg["bucket_size"],
        "p_city": city_filter,
    }

    try:
        result = supabase.rpc("get_job_data_hiring_trends", params).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"hiring trends query failed: {exc}")

    rows = result.data or []
    chart_data = [
        {
            "name": _bucket_label(row["days_ago_start"], row["days_ago_end"]),
            "Listings": row["listings"],
            "SalaryDisclosed": row["salary_disclosed"],
        }
        for row in rows
    ]
    return {"timeframe": timeframe, "city": city_filter, "data": chart_data}


# ------------------------------------------------------------------
# Skill Trends (rising / declining) — UNCHANGED
# ------------------------------------------------------------------
@router.get("/skill-trends")
def get_skill_trends(
    window_days: int = Query(7, ge=1, le=14, description="Size of each comparison window in days."),
    limit: int = Query(20, ge=1, le=50),
    supabase: Client = Depends(get_supabase),
):
    anchor = _get_anchor_date(supabase)
    recent_end = anchor
    recent_start = anchor - timedelta(days=window_days - 1)
    prior_end = recent_start - timedelta(days=1)
    prior_start = prior_end - timedelta(days=window_days - 1)

    try:
        result = supabase.rpc(
            "get_skill_trends",
            {
                "p_recent_start": recent_start.isoformat(),
                "p_recent_end": recent_end.isoformat(),
                "p_prior_start": prior_start.isoformat(),
                "p_prior_end": prior_end.isoformat(),
            },
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"skill trends query failed: {exc}")

    rows = result.data or []
    # rows already ordered by pct_change desc nulls last (brand-new skills first)
    rising = rows[:limit]
    declining = sorted(
        [r for r in rows if r["pct_change"] is not None],
        key=lambda r: r["pct_change"],
    )[:limit]

    def _format(r, rank):
        return {
            "rank": rank,
            "name": r["skill"],
            "category": r.get("top_domain") or "Uncategorized",
            "change_pct": r["pct_change"],
            "recent_count": r["recent_count"],
            "prior_count": r["prior_count"],
        }

    return {
        "window_days": window_days,
        "recent_range": [recent_start.isoformat(), recent_end.isoformat()],
        "prior_range": [prior_start.isoformat(), prior_end.isoformat()],
        "rising": [_format(r, i + 1) for i, r in enumerate(rising)],
        "declining": [_format(r, i + 1) for i, r in enumerate(declining)],
    }


# ------------------------------------------------------------------
# Skill Gap Map (NPTEL-only) — UNCHANGED
# ------------------------------------------------------------------
@router.get("/skill-gap-map")
def get_skill_gap_map(
    skills: List[str] = Query(..., description="Skill names to check against the NPTEL course catalog."),
    supabase: Client = Depends(get_supabase),
):
    try:
        result = supabase.rpc(
            "get_skill_gap_map",
            {"p_skills": skills, "p_similarity_threshold": 0.15},
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"skill gap map query failed: {exc}")

    return {"data": result.data or []}