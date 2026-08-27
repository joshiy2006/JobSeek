"""
job_data-backed API
--------------------
Replaces both the mock HiringTrends data and the mock SkillsIntelligence
data with real queries against `job_data` (+ `courses` for the gap map).
See job_data_functions.sql for the underlying Postgres functions.

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
# Hiring Trends
# ------------------------------------------------------------------
TIMEFRAME_CONFIG = {
    "7d":  {"days": 7,   "bucket": "day"},
    "30d": {"days": 30,  "bucket": "day"},
    "90d": {"days": 90,  "bucket": "week"},
    "1yr": {"days": 365, "bucket": "month"},
}

LABEL_FORMAT = {"day": "%d %b", "week": "%d %b", "month": "%b %Y"}


@router.get("/hiring-trends")
def get_hiring_trends(
    timeframe: str = Query("30d", pattern="^(7d|30d|90d|1yr)$"),
    city: Optional[str] = Query(None, description="Matched against primary_city. Omit/'all' for no filter."),
    skill_domains: Optional[List[str]] = Query(
        None, description="Exact skill_domain values, e.g. ['AI/ML/DL', 'Data Science']. Omit for no filter."
    ),
    supabase: Client = Depends(get_supabase),
):
    cfg = TIMEFRAME_CONFIG[timeframe]
    end_date = _get_anchor_date(supabase)
    start_date = end_date - timedelta(days=cfg["days"])

    city_filter = city if city and city.lower() != "all" else None
    domains_filter = skill_domains if skill_domains else None

    try:
        result = supabase.rpc(
            "get_job_data_hiring_trends",
            {
                "p_start_date": start_date.isoformat(),
                "p_end_date": end_date.isoformat(),
                "p_bucket_unit": cfg["bucket"],
                "p_city": city_filter,
                "p_skill_domains": domains_filter,
            },
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"hiring trends query failed: {exc}")

    fmt = LABEL_FORMAT[cfg["bucket"]]
    chart_data = [
        {
            "name": date.fromisoformat(row["bucket_date"]).strftime(fmt),
            "Listings": row["listings"],
            "FresherFriendly": row["fresher_friendly"],
        }
        for row in (result.data or [])
    ]
    return {"timeframe": timeframe, "city": city_filter, "skill_domains": domains_filter, "data": chart_data}


# ------------------------------------------------------------------
# Skill Trends (rising / declining)
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
# Skill Gap Map (NPTEL-only — courses table has no other portal's data)
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