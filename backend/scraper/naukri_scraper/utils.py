"""
Shared parsing / normalization helpers used by all spiders (naukri, indeed, glassdoor).

Centralising this logic here is deliberate: the whole point of this rewrite is to
stop doing this work reactively, downstream, in three different places. Every
spider calls into this module so a fix here fixes every source at once.
"""
import re
import random
import uuid
from datetime import datetime, timedelta, timezone

try:
    from dateutil import parser as dateutil_parser
except ImportError:  # pragma: no cover - dateutil ships with scrapy's deps normally
    dateutil_parser = None

from bs4 import BeautifulSoup


# ──────────────────────────────────────────────────────────────────────────
# Scrape run identity
# ──────────────────────────────────────────────────────────────────────────

def new_scrape_run_id() -> str:
    """One id per crawl process, shared by every item that crawl yields."""
    return str(uuid.uuid4())


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ──────────────────────────────────────────────────────────────────────────
# User-Agent
# ──────────────────────────────────────────────────────────────────────────
# Rotation was tried and reverted: rotating a fresh UA per request (on top of
# free rotating proxies) made Naukri's bot-detection *more* suspicious, not
# less, and it started returning 403s. Back to a single, stable, current
# desktop Chrome UA — the same one the scraper originally shipped with.

INITIAL_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def random_user_agent() -> str:
    """Name kept for compatibility with existing callers (spiders,
    middlewares) — it now always returns the one stable UA rather than
    rotating, per the Naukri 403s rotation was causing."""
    return INITIAL_USER_AGENT


# ──────────────────────────────────────────────────────────────────────────
# Proxies (opt-in, off by default)
# ──────────────────────────────────────────────────────────────────────────
# PROXY_LIST env var: comma-separated list of proxy URLs, e.g.
#   PROXY_LIST="http://user:pass@1.2.3.4:8000,http://user:pass@5.6.7.8:8000"
# Leave unset to disable proxying (requests go out on the runner's own IP).
# NOTE: there is deliberately no bundled default list here anymore — the
# free public proxies previously used got Naukri to return 403 Forbidden.
# Point this at a paid rotating-proxy endpoint if you need one; don't
# reintroduce a free-proxy list.

def _parse_proxy_url(proxy_url: str) -> dict:
    """[http(s)|socks4|socks5]://[user:pass@]host:port -> playwright proxy dict.
    Chromium (and therefore Playwright) accepts all four schemes directly as
    its --proxy-server value, so a plain IP:port list mixing http/socks4/socks5
    entries (e.g. from a free-proxy checker) works without extra handling."""
    m = re.match(
        r"^((?:https?|socks4|socks5)://)?(?:([^:@]+):([^@]+)@)?([^/:]+):(\d+)/?$",
        proxy_url.strip(),
    )
    if not m:
        return {"server": proxy_url}
    scheme, user, pwd, host, port = m.groups()
    scheme = scheme or "http://"
    proxy = {"server": f"{scheme}{host}:{port}"}
    if user and pwd:
        proxy["username"] = user
        proxy["password"] = pwd
    return proxy


def load_proxy_list(env_value: str | None) -> list:
    if not env_value:
        return []
    return [p for p in (x.strip() for x in env_value.split(",")) if p]


def random_proxy(proxy_list: list) -> dict | None:
    if not proxy_list:
        return None
    return _parse_proxy_url(random.choice(proxy_list))


def playwright_context_kwargs(proxy_list: list, user_agent: str | None = None) -> dict:
    """Build the per-request scrapy-playwright context kwargs: the stable UA,
    plus a proxy only when PROXY_LIST is actually configured (empty by default)."""
    kwargs = {"user_agent": user_agent or random_user_agent()}
    proxy = random_proxy(proxy_list)
    if proxy:
        kwargs["proxy"] = proxy
    return kwargs


# ──────────────────────────────────────────────────────────────────────────
# City normalization + tier classification
# ──────────────────────────────────────────────────────────────────────────

CITY_ALIASES = {
    "bengaluru": "Bangalore",
    "bangalore": "Bangalore",
    "blr": "Bangalore",
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "navi mumbai": "Mumbai",
    "thane": "Mumbai",
    "new delhi": "Delhi",
    "delhi ncr": "Delhi",
    "delhi": "Delhi",
    "ncr": "Delhi",
    "gurugram": "Gurgaon",
    "gurgaon": "Gurgaon",
    "noida": "Noida",
    "greater noida": "Noida",
    "madras": "Chennai",
    "chennai": "Chennai",
    "calcutta": "Kolkata",
    "kolkata": "Kolkata",
    "hyderabad": "Hyderabad",
    "secunderabad": "Hyderabad",
    "pune": "Pune",
    "ahmedabad": "Ahmedabad",
    "gandhinagar": "Ahmedabad",
    "cochin": "Kochi",
    "kochi": "Kochi",
    "ernakulam": "Kochi",
    "trivandrum": "Thiruvananthapuram",
    "thiruvananthapuram": "Thiruvananthapuram",
    "mysuru": "Mysore",
    "mysore": "Mysore",
    "vizag": "Visakhapatnam",
    "visakhapatnam": "Visakhapatnam",
    "vadodara": "Vadodara",
    "baroda": "Vadodara",
}

# Every value on the right of CITY_ALIASES is the canonical spelling. Tiering
# is a static bucket list rather than a population threshold — good enough for
# demo trend cuts, cheap to extend.
TIER_1_CITIES = {
    "Bangalore", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Pune",
    "Kolkata", "Ahmedabad", "Gurgaon", "Noida",
}

TIER_2_CITIES = {
    "Jaipur", "Lucknow", "Chandigarh", "Kochi", "Coimbatore", "Indore",
    "Nagpur", "Bhopal", "Vadodara", "Nashik", "Surat", "Visakhapatnam",
    "Vijayawada", "Mysore", "Mangalore", "Thiruvananthapuram", "Guwahati",
    "Bhubaneswar", "Ranchi", "Raipur", "Dehradun", "Jodhpur", "Amritsar",
    "Kanpur", "Patna", "Ludhiana", "Agra", "Varanasi", "Madurai",
    "Thane", "Faridabad",
}


def normalize_city(raw: str) -> str:
    if not raw:
        return "Unknown"
    # location strings are often comma/pipe separated ("Bangalore, Karnataka" or
    # "Bangalore/Pune/Hybrid") — take the first token as the primary city.
    first = re.split(r"[,/|]", raw.strip())[0].strip().lower()
    first = re.sub(r"\s+", " ", first)
    return CITY_ALIASES.get(first, first.title() if first else "Unknown")


def classify_tier(city_normalized: str) -> str:
    if city_normalized in TIER_1_CITIES:
        return "Tier-1"
    if city_normalized in TIER_2_CITIES:
        return "Tier-2"
    if city_normalized == "Unknown":
        return "Unknown"
    return "Tier-3"


# ──────────────────────────────────────────────────────────────────────────
# "Posted X days/hours ago" -> real computed date
# ──────────────────────────────────────────────────────────────────────────

_RELATIVE_RE = re.compile(
    r"(?P<num>\d+)\s*\+?\s*(?P<unit>second|minute|hour|day|week|month)s?\s*ago",
    re.IGNORECASE,
)

_UNIT_TO_TIMEDELTA = {
    "second": lambda n: timedelta(seconds=n),
    "minute": lambda n: timedelta(minutes=n),
    "hour": lambda n: timedelta(hours=n),
    "day": lambda n: timedelta(days=n),
    "week": lambda n: timedelta(weeks=n),
    "month": lambda n: timedelta(days=n * 30),
}


def parse_posted_date(raw_text: str, scrape_dt: datetime = None) -> str | None:
    """
    Turn "2 Days Ago" / "Just Now" / "Today" / "30+ Days Ago" / an absolute
    date string into a real ISO date, anchored to the moment of scraping
    (not "now" when this row is queried later).
    Returns None if nothing parseable was found (never fabricate a date).
    """
    if not raw_text:
        return None
    scrape_dt = scrape_dt or datetime.now(timezone.utc)
    text = raw_text.strip().lower()

    if text in ("just now", "today", "few hours ago", "few minutes ago"):
        return scrape_dt.date().isoformat()
    if text == "yesterday":
        return (scrape_dt - timedelta(days=1)).date().isoformat()

    m = _RELATIVE_RE.search(text)
    if m:
        n = int(m.group("num"))
        unit = m.group("unit")
        delta = _UNIT_TO_TIMEDELTA[unit](n)
        return (scrape_dt - delta).date().isoformat()

    # Absolute date strings (e.g. "12 Sep 2026", "2026-09-12")
    if dateutil_parser is not None:
        try:
            dt = dateutil_parser.parse(raw_text, fuzzy=True, default=scrape_dt)
            return dt.date().isoformat()
        except (ValueError, OverflowError):
            pass

    return None


# ──────────────────────────────────────────────────────────────────────────
# Salary parsing -> clean numbers, never raw text
# ──────────────────────────────────────────────────────────────────────────

_LAKH = 100_000
_CRORE = 10_000_000


def _to_number(token: str) -> float:
    return float(token.replace(",", ""))


def parse_salary(raw_text: str) -> dict:
    """
    Returns {"salary_min": float|None, "salary_max": float|None,
             "currency": str|None, "salary_disclosed": bool}
    Handles Naukri-style "₹ 5,00,000 - 8,00,000 P.A." / "12-16 Lacs P.A.",
    Indeed-style "₹4,00,000 - ₹6,00,000 a year" / "$60,000 - $90,000 a year",
    and explicit "not disclosed" text.
    """
    out = {"salary_min": None, "salary_max": None, "currency": None, "salary_disclosed": False}
    if not raw_text:
        return out

    text = raw_text.strip()
    lower = text.lower()
    if "not disclosed" in lower or "undisclosed" in lower or lower in ("", "n/a", "-"):
        return out

    currency = None
    if "₹" in text or re.search(r"\binr\b", lower):
        currency = "INR"
    elif "$" in text:
        currency = "USD"
    elif "£" in text:
        currency = "GBP"

    multiplier = 1
    if re.search(r"\blac|\blakh", lower):
        multiplier = _LAKH
    elif re.search(r"\bcrore", lower):
        multiplier = _CRORE
    elif re.search(r"\bk\b", lower) and currency in ("USD", "GBP", None):
        multiplier = 1_000

    numbers = re.findall(r"[\d,]+(?:\.\d+)?", text)
    numbers = [n for n in numbers if n.replace(",", "").strip(".")]
    if not numbers:
        return out

    values = [_to_number(n) * multiplier for n in numbers]
    if len(values) == 1:
        out["salary_min"] = out["salary_max"] = values[0]
    else:
        out["salary_min"], out["salary_max"] = min(values[:2]), max(values[:2])

    out["currency"] = currency or "INR"
    out["salary_disclosed"] = True
    return out


# ──────────────────────────────────────────────────────────────────────────
# HTML -> clean description text
# ──────────────────────────────────────────────────────────────────────────

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    soup = BeautifulSoup(raw_html, "lxml")
    text = soup.get_text(separator=" ")
    return re.sub(r"\s+", " ", text).strip()


# ──────────────────────────────────────────────────────────────────────────
# Canonical skill taxonomy — collapse spelling variants to one token
# ──────────────────────────────────────────────────────────────────────────

_SKILL_ALIASES = {
    "react": "React", "reactjs": "React", "react.js": "React", "react js": "React",
    "node": "Node.js", "nodejs": "Node.js", "node.js": "Node.js", "node js": "Node.js",
    "js": "JavaScript", "javascript": "JavaScript", "java script": "JavaScript",
    "ts": "TypeScript", "typescript": "TypeScript",
    "py": "Python", "python": "Python", "python3": "Python",
    "ml": "Machine Learning", "machine learning": "Machine Learning",
    "ai": "Artificial Intelligence", "artificial intelligence": "Artificial Intelligence",
    "nlp": "NLP", "natural language processing": "NLP",
    "sql": "SQL", "mysql": "MySQL", "postgres": "PostgreSQL", "postgresql": "PostgreSQL",
    "aws": "AWS", "amazon web services": "AWS",
    "gcp": "GCP", "google cloud": "GCP", "google cloud platform": "GCP",
    "azure": "Azure", "microsoft azure": "Azure",
    "k8s": "Kubernetes", "kubernetes": "Kubernetes",
    "docker": "Docker",
    "excel": "Excel", "ms excel": "Excel", "microsoft excel": "Excel",
    "powerbi": "Power BI", "power bi": "Power BI",
    "tableau": "Tableau",
    "django": "Django", "flask": "Flask", "fastapi": "FastAPI",
    "angular": "Angular", "angularjs": "Angular",
    "vue": "Vue.js", "vuejs": "Vue.js", "vue.js": "Vue.js",
    "html": "HTML", "html5": "HTML", "css": "CSS", "css3": "CSS",
    "c++": "C++", "cpp": "C++", "c#": "C#", "csharp": "C#",
    ".net": ".NET", "dotnet": ".NET",
    "spring boot": "Spring Boot", "springboot": "Spring Boot", "spring": "Spring",
    "rest api": "REST API", "restful api": "REST API", "rest": "REST API",
    "git": "Git", "github": "Git",
    "linux": "Linux",
    "selenium": "Selenium",
    "pandas": "Pandas", "numpy": "NumPy",
    "tensorflow": "TensorFlow", "pytorch": "PyTorch",
    "hadoop": "Hadoop", "spark": "Apache Spark", "pyspark": "Apache Spark",
}

# Obvious junk that shows up when a "skills" blob gets comma-split blindly
# elsewhere in the pipeline (kept here as a guard even though we scrape
# discrete DOM tags, not a blob — belt and suspenders).
_JUNK_SKILL_RE = re.compile(r"^\d+$")


def canonicalize_skill(raw_skill: str) -> str | None:
    if not raw_skill:
        return None
    cleaned = raw_skill.strip()
    if not cleaned or _JUNK_SKILL_RE.match(cleaned):
        return None
    key = cleaned.lower()
    return _SKILL_ALIASES.get(key, cleaned)


def canonicalize_skills(raw_skills: list) -> list:
    seen = []
    for s in raw_skills or []:
        canon = canonicalize_skill(s)
        if canon and canon not in seen:
            seen.append(canon)
    return seen


# ──────────────────────────────────────────────────────────────────────────
# Work mode / employment type inference (used as a fallback when a source
# doesn't expose these as an explicit facet)
# ──────────────────────────────────────────────────────────────────────────

def infer_work_mode(*texts: str) -> str:
    blob = " ".join(t for t in texts if t).lower()
    if "hybrid" in blob:
        return "Hybrid"
    if "remote" in blob or "work from home" in blob or "wfh" in blob:
        return "Remote"
    if "on-site" in blob or "onsite" in blob or "work from office" in blob:
        return "Onsite"
    return "Unknown"


def infer_employment_type(*texts: str) -> str:
    blob = " ".join(t for t in texts if t).lower()
    if "intern" in blob:
        return "Internship"
    if "contract" in blob or "temporary" in blob:
        return "Contract"
    if "part-time" in blob or "part time" in blob:
        return "Part-time"
    if "full-time" in blob or "full time" in blob or "permanent" in blob:
        return "Full-time"
    return "Unknown"


# ──────────────────────────────────────────────────────────────────────────
# "No black boxes": documented AI-exposure keyword list for Tab C.
# This is the methodology-panel artifact — keep it human-readable and
# additions/removals should be a one-line diff, not a retrain.
# ──────────────────────────────────────────────────────────────────────────

AI_TOOL_KEYWORDS = [
    "chatgpt", "gpt-4", "gpt-3", "gpt4", "openai", "github copilot", "copilot",
    "generative ai", "genai", "gen ai", "large language model", "llm", "llms",
    "rpa", "robotic process automation", "automation tool", "automation tools",
    "ai-powered", "ai powered", "artificial intelligence tool", "machine learning automation",
    "auto-gpt", "autogpt", "claude ai", "anthropic claude", "gemini ai", "google gemini",
    "bard ai", "midjourney", "stable diffusion", "prompt engineering",
    "no-code", "low-code", "intelligent automation", "cognitive automation",
    "ai chatbot", "ai assistant", "conversational ai", "computer vision", "deep learning",
]


def scan_ai_mentions(text: str) -> list:
    if not text:
        return []
    lower = text.lower()
    return [kw for kw in AI_TOOL_KEYWORDS if kw in lower]
