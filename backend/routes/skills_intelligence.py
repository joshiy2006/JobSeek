"""
job_data-backed API
--------------------
See job_data_hiring_trends_v2.sql for the hiring-trends / domain-trends
/ filter-options functions. skill-trends and skill-gap-map are
unchanged and rely on the existing get_job_data_max_date /
get_skill_trends / get_skill_gap_map functions already in the database.

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
# Filter options — real distinct values for the dropdowns, instead of
# a hardcoded city list
# ------------------------------------------------------------------
@router.get("/job-data/filter-options")
def get_filter_options(supabase: Client = Depends(get_supabase)):
    try:
        result = supabase.rpc("get_job_data_filter_options", {}).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"filter options query failed: {exc}")

    rows = result.data or []
    row = rows[0] if rows else {}
    return {
        "cities": row.get("cities") or [],
        "work_modes": row.get("work_modes") or [],
        "company_sizes": row.get("company_sizes") or [],
    }


# ------------------------------------------------------------------
# Hiring Trends — overall totals (KPI cards) + per-domain breakdown
# (chart lines). Bucketed by days_since_posted, not absolute calendar
# date — job_data is a one-time scraped snapshot, not a live feed, so
# calendar-date bucketing clusters everything onto the scrape day.
# ------------------------------------------------------------------
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


def _normalize_filter(value: Optional[str]) -> Optional[str]:
    return value if value and value.lower() != "all" else None


@router.get("/hiring-trends")
def get_hiring_trends(
    timeframe: str = Query("30d", pattern="^(7d|30d|90d|1yr)$"),
    city: Optional[str] = Query(None, description="Exact primary_city value. Omit/'all' for no filter."),
    work_mode: Optional[str] = Query(None, description="Exact work_mode value. Omit/'all' for no filter."),
    company_size: Optional[str] = Query(None, description="Exact company_size_bucket value. Omit/'all' for no filter."),
    supabase: Client = Depends(get_supabase),
):
    if timeframe not in TIMEFRAME_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe '{timeframe}'")

    cfg = TIMEFRAME_CONFIG[timeframe]
    city_filter = _normalize_filter(city)
    work_mode_filter = _normalize_filter(work_mode)
    company_size_filter = _normalize_filter(company_size)

    params = {
        "p_max_days_ago": cfg["max_days_ago"],
        "p_bucket_size": cfg["bucket_size"],
        "p_city": city_filter,
        "p_work_mode": work_mode_filter,
        "p_company_size": company_size_filter,
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
        }
        for row in rows
    ]
    return {
        "timeframe": timeframe,
        "city": city_filter,
        "work_mode": work_mode_filter,
        "company_size": company_size_filter,
        "data": chart_data,
    }


@router.get("/hiring-trends/by-domain")
def get_hiring_trends_by_domain(
    timeframe: str = Query("30d", pattern="^(7d|30d|90d|1yr)$"),
    city: Optional[str] = Query(None),
    work_mode: Optional[str] = Query(None),
    company_size: Optional[str] = Query(None),
    top_n: int = Query(5, ge=1, le=8, description="Number of top skill domains to chart as separate lines."),
    supabase: Client = Depends(get_supabase),
):
    if timeframe not in TIMEFRAME_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe '{timeframe}'")

    cfg = TIMEFRAME_CONFIG[timeframe]
    city_filter = _normalize_filter(city)
    work_mode_filter = _normalize_filter(work_mode)
    company_size_filter = _normalize_filter(company_size)

    params = {
        "p_max_days_ago": cfg["max_days_ago"],
        "p_bucket_size": cfg["bucket_size"],
        "p_city": city_filter,
        "p_work_mode": work_mode_filter,
        "p_company_size": company_size_filter,
        "p_top_n": top_n,
    }

    try:
        result = supabase.rpc("get_job_data_domain_trends", params).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"domain trends query failed: {exc}")

    rows = result.data or []

    # Pivot the long-format rows (bucket, skill_domain, listings) into
    # wide-format points Recharts can plot directly: one object per
    # bucket, one key per domain.
    buckets: dict = {}
    domains_seen: set = set()
    for r in rows:
        b = buckets.setdefault(
            r["bucket_index"],
            {"start": r["days_ago_start"], "end": r["days_ago_end"], "values": {}},
        )
        b["values"][r["skill_domain"]] = r["listings"]
        domains_seen.add(r["skill_domain"])

    domains = sorted(domains_seen)
    chart_data = []
    for bucket_index in sorted(buckets.keys(), reverse=True):
        info = buckets[bucket_index]
        point = {"name": _bucket_label(info["start"], info["end"])}
        for d in domains:
            point[d] = info["values"].get(d, 0)
        chart_data.append(point)

    return {
        "timeframe": timeframe,
        "city": city_filter,
        "work_mode": work_mode_filter,
        "company_size": company_size_filter,
        "domains": domains,
        "data": chart_data,
    }


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