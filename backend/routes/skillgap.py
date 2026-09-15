"""
Skills Gap Analyzer + grounded follow-up chat
-----------------------------------------------
Design principle throughout: Groq writes text/structure, it does NOT
invent facts. Every number and course reference given to Groq comes
from real queries against job_data/courses. Per the person's decision,
this intentionally does NOT include an "AI Vulnerability Score" or peer
comparison — no defined, honest methodology exists for that, so it's
left out rather than faked.

    from routers.skills_gap_router import router as skills_gap_router
    app.include_router(skills_gap_router)

Needs: pip install groq
Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
"""

import json
import os
from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, create_client
from groq import Groq

router = APIRouter(prefix="/api", tags=["skills-gap"])

_SUPABASE_URL = os.environ["SUPABASE_URL"]
_SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
_GROQ_API_KEY = os.environ["GROQ_API_KEY"]

# Groq deprecated llama-3.3-70b-versatile / llama-3.1-8b-instant as of
# June 2026. openai/gpt-oss-120b is the current recommended model for
# reasoning-heavy tasks. Verify against console.groq.com/docs/models
# if this has changed since.
GROQ_MODEL = "openai/gpt-oss-120b"

ROLE_MATCH_CONFIDENCE_THRESHOLD = 0.15  # tune once you see real match scores


def get_supabase() -> Client:
    return create_client(_SUPABASE_URL, _SUPABASE_SERVICE_KEY)


def get_groq() -> Groq:
    return Groq(api_key=_GROQ_API_KEY)


class WorkerProfile(BaseModel):
    job_title: str = Field(..., description="e.g. 'Senior Executive, BPO'")
    city: Optional[str] = None  # resolved city NAME (not the CITIES id) — resolve before calling
    years_experience: int = Field(..., ge=0, le=60)
    write_up: str = Field("", description="Free-text day-to-day work / tools / aspirations")


class ChatMessage(BaseModel):
    message: str
    context: Dict[str, Any] = Field(
        ..., description="The analysis result object returned by /skills-gap-analysis — sent back each turn since this endpoint is stateless."
    )


def _get_anchor_date(supabase: Client) -> date:
    result = supabase.rpc("get_job_data_max_date", {}).execute()
    raw = result.data
    if isinstance(raw, list):
        raw = raw[0] if raw else None
    if not raw:
        raise HTTPException(status_code=500, detail="job_data has no resolvable post dates")
    return date.fromisoformat(raw)


def _extract_known_skills(text: str, vocabulary: List[str]) -> List[str]:
    """Which real, known skill tokens does the user's own text mention?
    Simple substring match against the real vocabulary — deliberately
    NOT an LLM guess, so we know these are actually claimed, not inferred."""
    lowered = text.lower()
    return [skill for skill in vocabulary if skill and skill in lowered]


# 30-day window at daily granularity — the same "30d" convention
# TIMEFRAME_CONFIG uses in skills_intelligence.py (max_days_ago=29,
# bucket_size=1), so this snapshot lines up with what the Hiring Trends
# tab would show for the same filters.
_DEMAND_MAX_DAYS_AGO = 29
_DEMAND_BUCKET_SIZE = 1

# A role_category + city combo can easily have only a handful of
# postings in a 30-day window. Below this many postings in the OLDER
# half, a % change is measuring noise (1 -> 3 listings reads as
# "+200%") rather than a real trend, so momentum is reported as flat
# instead of a misleading swing. Total active_listings is unaffected —
# it's always the real count, just the derived percentage that's guarded.
_MIN_SAMPLE_FOR_MOMENTUM = 4


def _get_demand_snapshot(supabase: Client, city: Optional[str], skill_domain: str, anchor: date) -> Dict[str, Any]:
    """Real activeListings + momChange for this user's matched domain
    (+ city, if given), over the last 30 days — reuses the Hiring Trends
    machinery (get_job_data_domain_hiring_trends, a sibling of
    get_job_data_hiring_trends scoped to one skill_domain), not a
    separate invented metric. See sql/get_job_data_domain_hiring_trends.sql."""
    try:
        result = supabase.rpc(
            "get_job_data_domain_hiring_trends",
            {
                "p_max_days_ago": _DEMAND_MAX_DAYS_AGO,
                "p_bucket_size": _DEMAND_BUCKET_SIZE,
                "p_city": city,
                "p_skill_domain": skill_domain,
            },
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"demand snapshot query failed: {exc}")

    rows = result.data or []
    total_listings = sum(r["listings"] for r in rows)

    # Rows come back ordered by bucket_index DESC, i.e. oldest-days-ago
    # bucket first and "today" (bucket 0) last — so the first half of
    # the list is the older half of the window, the second half is the
    # more recent half.
    midpoint = len(rows) // 2
    older_half = sum(r["listings"] for r in rows[:midpoint])
    recent_half = sum(r["listings"] for r in rows[midpoint:])

    if older_half >= _MIN_SAMPLE_FOR_MOMENTUM:
        mom_change = round((recent_half - older_half) / older_half * 100, 1)
    else:
        mom_change = 0.0

    return {"active_listings": total_listings, "mom_change": mom_change}


@router.post("/skills-gap-analysis")
def skills_gap_analysis(
    profile: WorkerProfile,
    supabase: Client = Depends(get_supabase),
    groq: Groq = Depends(get_groq),
):
    # 1. Ground the profile in the real role/domain taxonomy
    profile_text = f"{profile.job_title}. {profile.write_up}".strip()
    try:
        role_result = supabase.rpc("get_nearest_role_domain", {"p_text": profile_text}).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"role matching failed: {exc}")

    role_rows = role_result.data or []
    if not role_rows:
        raise HTTPException(status_code=500, detail="no role categories found in job_data")

    matched = role_rows[0]
    role_category = matched["role_category"]
    skill_domain = matched["skill_domain"]
    match_similarity = matched["similarity"] or 0.0
    low_confidence = match_similarity < ROLE_MATCH_CONFIDENCE_THRESHOLD

    # 2. What does the user already claim to know?
    try:
        vocab_result = supabase.rpc("get_skill_vocabulary", {}).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"skill vocabulary lookup failed: {exc}")

    vocabulary = [row["skill"] for row in (vocab_result.data or [])]
    known_skills = set(_extract_known_skills(profile_text, vocabulary))

    # 3. Real trending skills for this domain (last 7 days vs prior 7)
    anchor = _get_anchor_date(supabase)
    recent_end, recent_start = anchor, anchor - timedelta(days=6)
    prior_end, prior_start = recent_start - timedelta(days=1), recent_start - timedelta(days=7)

    try:
        trend_result = supabase.rpc(
            "get_skill_trends",
            {
                "p_recent_start": recent_start.isoformat(),
                "p_recent_end": recent_end.isoformat(),
                "p_prior_start": prior_start.isoformat(),
                "p_prior_end": prior_end.isoformat(),
                "p_skill_domain": skill_domain,
            },
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"skill trend query failed: {exc}")

    trend_rows = trend_result.data or []

    # 4. Gap = trending in this domain AND not already claimed by the user
    gap_skills = [row for row in trend_rows if row["skill"].lower() not in known_skills][:10]

    # 5. Real NPTEL course matches for the gap skills
    course_recs = []
    if gap_skills:
        try:
            gap_map_result = supabase.rpc(
                "get_skill_gap_map",
                {"p_skills": [s["skill"] for s in gap_skills], "p_similarity_threshold": 0.15},
            ).execute()
            course_recs = gap_map_result.data or []
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"course matching failed: {exc}")

    course_by_skill = {c["skill"]: c for c in course_recs}

    # 6. Real demand snapshot (reuses Hiring Trends' bucketing machinery — not invented)
    demand = _get_demand_snapshot(supabase, profile.city, skill_domain, anchor)

    # 7. Groq builds the STRUCTURED roadmap — grounded only in what we retrieved.
    #    No score/severity/peer-comparison: no defined methodology exists for
    #    that, so it's left out rather than faked.
    system_prompt = (
        "You are a career reskilling advisor. You will be given a worker's profile "
        "and REAL, pre-computed facts: their matched job category, real trending "
        "skills in that category (with real listing counts and % change over the "
        "last two weeks), which skills they already have, and real NPTEL course "
        "matches for their skill gaps. "
        "Return ONLY a JSON object with this exact shape:\n"
        '{"roadmap": [{"weeks": "Week 1-2", "focus": "short title", '
        '"source": "NPTEL" or "Self-directed", "duration": "e.g. 8 weeks" or "Varies", '
        '"goals": "1-2 sentences", "justification": "1 sentence citing the real '
        'data point that justifies this, e.g. the % change or listing count"}]}\n'
        "One roadmap item per gap skill provided, ordered by highest % change first. "
        "If a skill has no matched NPTEL course, set source to 'Self-directed' and "
        "say so honestly in the justification — do not invent a course. "
        "Do not invent skills, statistics, or courses beyond what's given. "
        "If role_match_is_low_confidence is true, make the first roadmap item's "
        "justification note that this is a best-effort match to the closest "
        "available job category, not a precise fit."
    )

    user_prompt = {
        "profile": {
            "job_title": profile.job_title,
            "city": profile.city,
            "years_experience": profile.years_experience,
            "write_up": profile.write_up,
        },
        "matched_role_category": role_category,
        "matched_skill_domain": skill_domain,
        "role_match_confidence": round(match_similarity, 3),
        "role_match_is_low_confidence": low_confidence,
        "skills_user_already_has": sorted(known_skills),
        "gap_skills_real_data": [
            {
                "skill": s["skill"],
                "recent_listings": s["recent_count"],
                "prior_listings": s["prior_count"],
                "pct_change": s["pct_change"],
                "matched_course": course_by_skill.get(s["skill"], {}).get("course_title"),
                "matched_course_url": course_by_skill.get(s["skill"], {}).get("course_url"),
            }
            for s in gap_skills
        ],
    }

    try:
        completion = groq.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(user_prompt)},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        roadmap = json.loads(completion.choices[0].message.content).get("roadmap", [])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}")

    return {
        "city": profile.city,
        "submittedProfile": {
            "jobTitle": profile.job_title,
            "yearsExperience": profile.years_experience,
            "writeUp": profile.write_up,
        },
        "matched_role_category": role_category,
        "matched_skill_domain": skill_domain,
        "role_match_confidence": round(match_similarity, 3),
        "role_match_is_low_confidence": low_confidence,
        "skills_user_already_has": sorted(known_skills),
        "gap_skills": gap_skills,
        "course_recommendations": course_recs,
        "activeListings": demand["active_listings"],
        "momChange": demand["mom_change"],
        "roadmap": roadmap,
    }


# ------------------------------------------------------------------
# Grounded follow-up chat — replaces the fake chatbotSessions dict.
# Stateless: the frontend sends the analysis context back each turn.
# ------------------------------------------------------------------
@router.post("/career-chat")
def career_chat(payload: ChatMessage, groq: Groq = Depends(get_groq)):
    system_prompt = (
        "You are a career advisor chatbot. Answer ONLY using the facts in the "
        "provided context (matched job category, real trending skills, real "
        "course matches, real demand numbers, the user's profile). "
        "This data covers Data/AI/Analytics roles specifically (job categories: "
        "Data Scientist, Data Analyst, Business Analyst, Machine Learning Engineer, "
        "Data Engineer, Python Developer) — if asked about a field or city/role "
        "combination the context doesn't cover, say plainly that you don't have "
        "data for that rather than guessing. Do not invent statistics, job counts, "
        "or courses beyond what's in the context. Answer in the same language the "
        "question was asked in (the user may write in Hindi or English). Keep "
        "answers conversational and under 150 words unless more detail is asked for."
    )

    try:
        completion = groq.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context: {json.dumps(payload.context)}\n\nQuestion: {payload.message}"},
            ],
            temperature=0.4,
        )
        reply = completion.choices[0].message.content
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq request failed: {exc}")

    return {"reply": reply}