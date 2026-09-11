from fastapi import APIRouter

from .jobs import router as jobs_router
from .skills_intelligence import router as skills_intelligence_router
from .skillgap import router as skillgap_router

api_router = APIRouter()

api_router.include_router(jobs_router)
api_router.include_router(skills_intelligence_router)
api_router.include_router(skillgap_router)