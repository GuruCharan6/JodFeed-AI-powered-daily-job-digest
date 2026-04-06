"""
app/routers/resume.py

POST /profile/resume
  — Accepts PDF upload (multipart/form-data, field: "resume")
  — Extracts text from PDF with pypdf
  — Parses skills / roles / locations / name with Groq (llama3-8b-8192)
  — Uploads PDF to Supabase Storage bucket "resumes"
  — Saves resume_url + resume_filename to profiles table
  — Returns parsed JSON → frontend shows review screen before saving

New pip deps needed:
  pip install pypdf groq python-multipart
"""

import json
import re
import uuid
import traceback
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from groq import Groq
from pypdf import PdfReader

from app.config import get_settings
from app.database import admin
from app.dependencies import get_current_user

router = APIRouter()
settings = get_settings()

# CHANGED: lazy-init Groq client to avoid crash at import time if key is missing
_groq_client = None

def _get_groq() -> Groq:
    """Get or create Groq client (lazy initialization)."""
    global _groq_client
    if _groq_client is None:
        _groq_client = Groq(api_key=settings.groq_api_key)
    return _groq_client

# ── Groq prompt ──────────────────────────────────────────────────
RESUME_PARSE_PROMPT = """\
You are an expert resume parser. Extract structured information from the resume text below.

Return ONLY a valid JSON object — no markdown, no code blocks, no explanation.
Use EXACTLY this schema:

{{
  "full_name": "string or null",
  "skills": ["technical skill", "..."],
  "target_roles": ["job title", "..."],
  "locations": ["city name", "..."],
  "summary": "one sentence about the candidate"
}}

Rules:
- skills     : every technical skill found — languages, frameworks, tools, databases, cloud, etc.
- target_roles: 2–5 specific job titles this person is best suited for (e.g. "Senior React Developer")
- locations  : only real city/country names that appear in the resume (home city, cities they worked in)
- If a field has nothing, use [] or null — never omit the key.
- No nested objects inside arrays, plain strings only.

Resume text:
---
{resume_text}
---
"""


# ── Helpers ──────────────────────────────────────────────────────

def extract_pdf_text(file_bytes: bytes) -> str:
    """Pull all text out of a PDF. Trims to 6 000 chars for Groq context."""
    try:
        reader = PdfReader(BytesIO(file_bytes))

        # Check if PDF is encrypted
        if reader.is_encrypted:
            try:
                reader.decrypt("")  # Try empty password
            except Exception:
                raise HTTPException(
                    status_code=422,
                    detail="PDF is password protected. Please upload an unprotected PDF."
                )

        pages = []
        for i, page in enumerate(reader.pages):
            try:
                text = page.extract_text()
                if text:
                    pages.append(text.strip())
            except Exception as e:
                print(f"[resume] Warning: Failed to extract text from page {i}: {e}")
                continue

        if not pages:
            # Try to detect if it's an image-based PDF
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from PDF. The file may be a scanned image or image-based PDF without text layer. Please try a text-based PDF or fill manually."
            )

        text = "\n\n".join(pages)

        # Additional check for meaningful content
        cleaned_text = re.sub(r'\s+', '', text)
        if len(cleaned_text) < 50:  # Less than 50 non-whitespace chars is probably not a real resume
            raise HTTPException(
                status_code=422,
                detail="PDF contains too little text to be a valid resume. The file may be image-based or corrupted. Please try a different PDF or fill manually."
            )

        return text[:6000]

    except HTTPException:
        raise
    except Exception as e:
        print(f"[resume] PDF extraction error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=422,
            detail=f"Could not read PDF: {str(e)}. Ensure the file is a valid, non-corrupted PDF."
        )


def clean_groq_response(raw: str) -> str:
    """Clean Groq response to extract valid JSON."""
    # CHANGED: removed unused 'original' variable

    # Remove markdown code blocks with various formats
    patterns = [
        r'^```json\s*',
        r'^```JSON\s*',
        r'^```\s*',
        r'\s*```$',
        r'^json\s*',
        r'^\s*',
        r'\s*$',
    ]

    for pattern in patterns:
        raw = re.sub(pattern, '', raw, flags=re.MULTILINE)

    # Try to find JSON object/array if wrapped in other text
    if not raw.strip().startswith(('{', '[')):
        # Look for JSON object
        json_match = re.search(r'(\{.*\})', raw, re.DOTALL)
        if json_match:
            raw = json_match.group(1)
        else:
            # Look for JSON array
            json_match = re.search(r'(\[.*\])', raw, re.DOTALL)
            if json_match:
                raw = json_match.group(1)

    return raw.strip()


def call_groq(resume_text: str) -> dict:
    """Send resume text to Groq and return parsed dict."""
    if not resume_text or not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="PDF appears to be empty or contains no extractable text. This often happens with scanned image PDFs. Please upload a text-based PDF or fill manually."
        )

    try:
        resp = _get_groq().chat.completions.create(  # CHANGED: lazy client
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise resume parser. "
                        "Always respond with valid JSON only. "
                        "No markdown, no explanation, no extra text."
                    ),
                },
                {
                    "role": "user",
                    "content": RESUME_PARSE_PROMPT.format(resume_text=resume_text),
                },
            ],
            temperature=0.1,
            max_tokens=1024,
        )

        raw = resp.choices[0].message.content.strip()

        # Clean the response
        cleaned = clean_groq_response(raw)

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as e:
            # CHANGED: 'original' now refers to 'raw' which is in scope
            try:
                # Extract anything that looks like JSON
                aggressive = re.sub(r'^[^{[]*', '', raw)
                aggressive = re.sub(r'[^}\]]*$', '', aggressive)
                parsed = json.loads(aggressive)
            except Exception:
                raise HTTPException(
                    status_code=500,
                    detail="AI returned malformed response. Please try again or fill manually."
                )

        # Validate required keys
        required_keys = ["full_name", "skills", "target_roles", "locations"]
        for key in required_keys:
            if key not in parsed:
                parsed[key] = [] if key != "full_name" else None

        return parsed

    except HTTPException:
        raise
    except Exception as e:
        print(f"[resume] Groq error: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"AI parsing failed: {str(e)}. Please try again or fill manually.")


def upload_pdf(user_id: str, file_bytes: bytes, original_name: str) -> str:
    """
    Upload PDF to Supabase Storage bucket 'resumes'.
    Path: resumes/{user_id}/{uuid}.pdf
    Returns the storage path, or "" on failure (non-fatal).
    """
    try:
        ext = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else "pdf"
        if ext not in ["pdf", "png", "jpg", "jpeg"]:
            ext = "pdf"
        path = f"{user_id}/{uuid.uuid4()}.{ext}"

        admin.storage.from_("resumes").upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
        return path
    except Exception as e:
        print(f"[resume] Storage upload failed (non-fatal): {e}")
        print(traceback.format_exc())
        return ""


def get_signed_url(storage_path: str, expires: int = 60 * 60 * 24 * 365) -> str:
    """Generate a 1-year signed URL for the uploaded file. Returns '' on error."""
    try:
        result = admin.storage.from_("resumes").create_signed_url(
            storage_path, expires_in=expires
        )
        return result.get("signedURL", "")
    except Exception as e:
        print(f"[resume] Signed URL generation failed (non-fatal): {e}")
        return ""


# ── Route ────────────────────────────────────────────────────────

@router.post("/resume")
async def upload_resume(
    resume: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """
    Upload a PDF resume.
    1. Validate file type + size.
    2. Extract text with pypdf.
    3. Parse with Groq AI → skills, roles, locations, name.
    4. Upload PDF to Supabase Storage.
    5. Save resume_url + filename to profiles table.
    6. Return parsed data — frontend shows review screen before saving to profile.
    """

    try:
        # ── 1. Validate ───────────────────────────────────────────────
        allowed_types = {"application/pdf", "application/octet-stream"}
        content_type = resume.content_type or "application/octet-stream"

        # Additional check by filename extension
        filename_lower = (resume.filename or "").lower()
        is_pdf_by_name = filename_lower.endswith('.pdf')

        if content_type not in allowed_types and not is_pdf_by_name:
            raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

        file_bytes = await resume.read()

        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File must be under 5 MB.")

        if len(file_bytes) < 512:
            raise HTTPException(status_code=400, detail="File is too small to be a valid resume.")

        # Check PDF magic bytes
        if not file_bytes.startswith(b'%PDF'):
            raise HTTPException(status_code=400, detail="File does not appear to be a valid PDF.")

        original_name = resume.filename or "resume.pdf"

        # ── 2. Extract text ───────────────────────────────────────────
        try:
            resume_text = extract_pdf_text(file_bytes)
        except HTTPException:
            raise
        except Exception as e:
            print(f"[resume] Unexpected extraction error: {e}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=422,
                detail="Failed to extract text from PDF. The file may be corrupted or image-based. Please try again or fill manually."
            )

        # ── 3. Parse with Groq ────────────────────────────────────────
        try:
            parsed = call_groq(resume_text)
        except HTTPException:
            raise
        except Exception as e:
            print(f"[resume] Unexpected Groq error: {e}")
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail="Failed to parse resume content. Please try again or fill manually."
            )

        # ── 4. Upload to Supabase Storage ─────────────────────────────
        storage_path = upload_pdf(user.id, file_bytes, original_name)
        resume_url = get_signed_url(storage_path) if storage_path else ""

        # ── 5. Persist resume metadata to profiles row ────────────────
        if storage_path:
            try:
                admin.table("profiles").update({
                    "resume_url": resume_url,
                    "resume_filename": original_name,
                }).eq("id", user.id).execute()
            except Exception as e:
                print(f"[resume] Failed to persist resume metadata (non-fatal): {e}")
                print(traceback.format_exc())

        # ── 6. Return parsed data for frontend review ─────────────────
        return {
            "full_name": parsed.get("full_name"),
            "skills": parsed.get("skills", []),
            "target_roles": parsed.get("target_roles", []),
            "locations": parsed.get("locations", []),
            "summary": parsed.get("summary", ""),
            "resume_url": resume_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[resume] Unexpected error in upload_resume: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred. Please try again or fill manually."
        )
