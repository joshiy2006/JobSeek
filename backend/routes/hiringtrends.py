"""
Hiring Trends API
------------------
Replaces the mock `generateHiringTrend()` data with a real aggregation
of the `jobs` table, via the `get_hiring_trends` Postgres function
(see get_hiring_trends.sql).

Drop this into your existing routers/ package and include it in main.py:

    from routers.hiring_trends import router as hiring_trends_router
    app.include_router(hiring_trends_router)

Assumes you already have a Supabase client set up somewhere in your
service layer (e.g. app/db.py). If your existing pattern differs,
just swap `get_supabase` for however you already inject the client
elsewhere in the app — the query/shape logic below doesn't change.
"""

from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client, create_client

router = APIRouter(prefix="/api", tags=["hiring-trends"])

# ------------------------------------------------------------------
# Supabase client — replace with your existing dependency if you
# already have one (e.g. `from app.db import get_supabase`)
# ------------------------------------------------------------------
import os

_SUPABASE_URL = os.environ["SUPABASE_URL"]
_SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # server-side only, never expose to frontend


def get_supabase() -> Client:
    return create_client(_SUPABASE_URL, _SUPABASE_SERVICE_KEY)


# ------------------------------------------------------------------
# Timeframe -> (lookback window, bucket granularity)
# ------------------------------------------------------------------
TIMEFRAME_CONFIG = {
    "7d":  {"days": 7,   "bucket": "day"},
    "30d": {"days": 30,  "bucket": "day"},
    "90d": {"days": 90,  "bucket": "week"},
    "1yr": {"days": 365, "bucket": "month"},
}

LABEL_FORMAT = {
    "day": "%d %b",
    "week": "%d %b",
    "month": "%b %Y",
}


@router.get("/hiring-trends")
def get_hiring_trends(
    timeframe: str = Query("30d", pattern="^(7d|30d|90d|1yr)$"),
    city: Optional[str] = Query(
        None, description="City name to match against joblocation_address, e.g. 'Indore'. Omit or pass 'all' for no filter."
    ),
    industries: Optional[List[str]] = Query(
        None, description="Exact `industry` values for the selected sector, e.g. ['Banking / Financial Services / Broking']. Omit for no filter."
    ),
    supabase: Client = Depends(get_supabase),
):
    if timeframe not in TIMEFRAME_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid timeframe '{timeframe}'")

    cfg = TIMEFRAME_CONFIG[timeframe]

    # This dataset is a static historical snapshot (rows from 2015-2017,
    # not a live feed), so "last 30 days" has to be relative to the most
    # recent posting IN THE DATA, not the real calendar date — otherwise
    # every relative window queries a range with zero rows in it.
    try:
        anchor_result = supabase.rpc("get_jobs_max_postdate", {}).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"could not resolve dataset date range: {exc}")

    anchor_raw = anchor_result.data
    if isinstance(anchor_raw, list):  # some supabase-py versions wrap scalars in a list
        anchor_raw = anchor_raw[0] if anchor_raw else None
    if not anchor_raw:
        raise HTTPException(status_code=500, detail="jobs table has no postdate values to anchor on")

    end_date = date.fromisoformat(anchor_raw)
    start_date = end_date - timedelta(days=cfg["days"])

    city_filter = city if city and city.lower() != "all" else None
    industries_filter = industries if industries else None

    params = {
        "p_start_date": start_date.isoformat(),
        "p_end_date": end_date.isoformat(),
        "p_bucket_unit": cfg["bucket"],
        "p_city": city_filter,
        "p_industries": industries_filter,
    }

    try:
        result = supabase.rpc("get_hiring_trends", params).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"hiring trends query failed: {exc}")

    rows = result.data or []
    fmt = LABEL_FORMAT[cfg["bucket"]]

    chart_data = [
        {
            "name": date.fromisoformat(row["bucket_date"]).strftime(fmt),
            "Listings": row["listings"],
            "Openings": row["openings"],
        }
        for row in rows
    ]

    return {
        "timeframe": timeframe,
        "city": city_filter,
        "industries": industries_filter,
        "data": chart_data,
    }