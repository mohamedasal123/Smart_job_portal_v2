from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Security
from fastapi.security.api_key import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, conlist, constr
from typing import List
import logging
import tempfile
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from models.cv_parser import parse_cv
from models.skill_extractor import SkillExtractor
from models.matcher import MatchingEngine

API_KEY_NAME = "X-API-Key"
# Prefer AI_ENGINE_KEY (matches the Laravel side); accept AI_API_KEY for backward compat.
API_KEY = os.environ.get("AI_ENGINE_KEY") or os.environ.get("AI_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "AI_ENGINE_KEY (or AI_API_KEY) environment variable must be set. "
        "Generate a strong random value and set it in both the AI service and Laravel backend .env."
    )
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    raise HTTPException(status_code=403, detail="Could not validate credentials")

app = FastAPI()

# Restrict CORS to known callers. Override via AI_ALLOWED_ORIGINS=comma,separated.
_default_origins = "http://127.0.0.1:8000,http://localhost:8000,http://127.0.0.1:5173,http://localhost:5173"
_allowed_origins = [o.strip() for o in os.environ.get("AI_ALLOWED_ORIGINS", _default_origins).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type", "Accept"],
)

skill_extractor = SkillExtractor()
matcher = MatchingEngine()

logger = logging.getLogger("smart_job.ai")
if not logger.handlers:
    logging.basicConfig(level=os.environ.get("AI_LOG_LEVEL", "INFO"))

# Upload safety limits — override via env vars if needed.
MAX_UPLOAD_BYTES = int(os.environ.get("AI_MAX_UPLOAD_BYTES", 10 * 1024 * 1024))  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# Magic-byte signatures we trust for the extensions we accept.
# .txt has no magic — we accept any bytes that decode as UTF-8 / Latin-1.
_MAGIC_PDF = b"%PDF-"
_MAGIC_ZIP = b"PK\x03\x04"  # .docx is a ZIP container


def _looks_like_text(blob: bytes) -> bool:
    if not blob:
        return False
    try:
        blob.decode("utf-8")
        return True
    except UnicodeDecodeError:
        try:
            blob.decode("latin-1")
            return True
        except UnicodeDecodeError:
            return False


def _validate_magic(ext: str, head: bytes) -> bool:
    if ext == ".pdf":
        return head.startswith(_MAGIC_PDF)
    if ext == ".docx":
        return head.startswith(_MAGIC_ZIP)
    if ext == ".txt":
        return _looks_like_text(head)
    return False


class MatchRequest(BaseModel):
    # Cap list / string sizes so a malicious caller can't OOM the worker or
    # trigger pathological backtracking in the regex split.
    candidate_skills: conlist(constr(strip_whitespace=True, min_length=1, max_length=100), max_length=500) = Field(default_factory=list)
    job_skills_str: constr(max_length=20_000) = ""


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/parse-cv")
async def parse_cv_endpoint(file: UploadFile = File(...), api_key: str = Depends(get_api_key)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    # Stream the upload in chunks, enforcing the size cap as we go so we
    # never load a multi-GB file into memory.
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp_path = tmp.name
            total = 0
            head = b""
            chunk_size = 64 * 1024
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds {MAX_UPLOAD_BYTES} bytes limit.",
                    )
                if len(head) < 8:
                    head = (head + chunk)[:8]
                tmp.write(chunk)

        if total == 0:
            raise HTTPException(status_code=400, detail="Empty upload.")

        # Re-read first bytes from disk if we never accumulated enough above
        # (very small files smaller than the first chunk).
        if len(head) < 5:
            with open(tmp_path, "rb") as fh:
                head = fh.read(8)

        if not _validate_magic(ext, head):
            raise HTTPException(
                status_code=400,
                detail="File contents do not match the declared type.",
            )

        parsed = parse_cv(tmp_path)
        skills = skill_extractor.extract_from_cv(parsed)

        return {
            "success": True,
            "data": {
                "name": parsed.get("name"),
                "email": parsed.get("email"),
                "phone": parsed.get("phone"),
                "location": parsed.get("location"),
                "technical_skills": skills.get("technical", []),
                "soft_skills": skills.get("soft", []),
                "all_skills": skills.get("all", []),
                "education": parsed.get("education", ""),
                "experience": parsed.get("experience", ""),
            },
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("parse-cv failed")
        raise HTTPException(status_code=500, detail="CV parsing failed.")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                logger.warning("Failed to delete temp file %s", tmp_path)


@app.post("/match-skills")
async def match_skills_endpoint(request: MatchRequest, api_key: str = Depends(get_api_key)):
    try:
        gap_analysis = matcher.compute_skill_gap(request.candidate_skills, request.job_skills_str)
        score = 0
        if gap_analysis['total_required'] > 0:
            score = (gap_analysis['matched_count'] / gap_analysis['total_required']) * 100

        return {
            "success": True,
            "data": {
                "ai_score": round(score, 2),
                "missing_skills": gap_analysis['missing'],
                "matched_skills": gap_analysis['matched'],
            },
        }
    except Exception:
        logger.exception("match-skills failed")
        raise HTTPException(status_code=500, detail="Skill matching failed.")