"""
AI utility routes — powered by Groq.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from groq import Groq

from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])


# ── Request / Response schemas ──────────────────────────────────────────────

class AiFixRequest(BaseModel):
    text: str
    prompt: str


class AiFixResponse(BaseModel):
    result: str


# ── Groq client (lazy singleton) ─────────────────────────────────────────────
from groq import AsyncGroq

def _get_groq_client() -> AsyncGroq:
    return AsyncGroq(api_key=settings.GROQ_API_KEY)


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/fix", response_model=AiFixResponse)
async def ai_fix(
    body: AiFixRequest,
    _user=Depends(get_current_user),
):
    """
    Apply a user-defined instruction to a piece of text using the Groq LLM.

    - **text**: The original content extracted from a data source.
    - **prompt**: The user's instruction, e.g. "Remove all phone numbers".
    """

    if not body.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")

    if not body.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt must not be empty")

    system_message = (
        "You are a precise text editor. "
        "Apply the user's instruction to the provided text. "
        "Return ONLY the modified text — no explanations, no markdown, no preamble."
    )

    user_message = (
        f"Instruction: {body.prompt}\n\n"
        f"Text to edit:\n{body.text}"
    )

    try:
        client = _get_groq_client()
        completion = await client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message},
            ],
            temperature=0.3,
            max_tokens=4096,
        )
        result = completion.choices[0].message.content or ""
        return AiFixResponse(result=result.strip())

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Groq API error: {str(exc)}",
        ) from exc
