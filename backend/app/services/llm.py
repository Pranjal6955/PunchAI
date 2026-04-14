"""
LLM Service for PunchAI with OpenRouter and Groq fallback.
Builds the RAG prompt and generates a response based on retrieved context.
"""

from typing import List, Optional
from openai import AsyncOpenAI
from groq import AsyncGroq
from app.core.config import settings
from app.core.logging import logger

# Initialize Async OpenAI client for OpenRouter
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

# Initialize Async Groq client
groq_client = AsyncGroq(
    api_key=settings.GROQ_API_KEY,
)


def build_rag_prompt(
    persona: Optional[str],
    context: List[str],
    question: str,
    history: Optional[List] = None,  # Bug 7 fix: was `= None` with List[dict] hint which is fine, but clarified
) -> str:
    """Constructs a prompt template for the RAG response."""

    # Bug 6 fix: distinguish empty context from populated context
    if context:
        context_text = "\n---\n".join(context)
        context_section = f"### CONTEXT\n{context_text}"
    else:
        context_section = (
            "### CONTEXT\n"
            "[No relevant documents found in the knowledge base for this question.\n"
            "Do NOT invent information. Politely tell the user you don't have that "
            "information and suggest they ask something else or add more data sources.]"
        )

    base_persona = persona if persona else "You are a helpful and professional AI assistant."

    history_text = ""
    if history:
        history_text = "### RECENT CHAT HISTORY\n"
        for msg in history:
            if isinstance(msg, dict):
                role = msg.get('role', 'USER')
                content = msg.get('content', '')
            else:
                role = getattr(msg, 'role', 'USER')
                content = getattr(msg, 'content', '')
            history_text += f"{role}: {content}\n"
        history_text += "\n---\n"

    prompt = f"""
### PERSONA
{base_persona}

### TASK
You are replying to a user in a chat conversation. Answer accurately using the provided context and conversation history. Follow these strict guidelines:
1. **Be Polite & Conversational**: Always maintain a warm, respectful, and helpful tone.
2. **Simple Language**: Explain concepts clearly. Avoid jargon unless necessary.
3. **Accuracy**: Use ONLY the information in the CONTEXT section below. Do not use outside knowledge.
4. **Contextual Awareness**: Use RECENT CHAT HISTORY to maintain conversational flow.
5. **Uncertainty**: If the context is empty or doesn't cover the question, say so honestly and offer to help with something else.

{history_text}{context_section}

---

### USER QUESTION
{question}

### FINAL ANSWER (Simple & Polite)
"""
    return prompt.strip()


async def generate_openrouter_response(prompt: str) -> str:
    """Calls OpenRouter asynchronously to generate an AI response."""
    try:
        response = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "HTTP-Referer": "https://punchai.app",
                "X-Title": "PunchAI",
            }
        )
        if response.choices:
            return response.choices[0].message.content
        raise Exception("OpenRouter returned no response choices.")
    except Exception as e:
        logger.error(f"OpenRouter Error: {e}")
        raise e


async def generate_groq_response(prompt: str) -> str:
    """Calls Groq asynchronously as a fallback LLM."""
    try:
        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        if response.choices:
            return response.choices[0].message.content
        return "Groq returned no response choices."
    except Exception as e:
        logger.error(f"Groq Error: {e}")
        return f"I'm sorry, I'm having trouble reaching my AI engines. Error: {str(e)}"


async def generate_llm_response(prompt: str) -> str:
    """Main entry point with async fallback: OpenRouter -> Groq."""
    try:
        return await generate_openrouter_response(prompt)
    except Exception:
        logger.warning("Switching to Groq fallback...")
        return await generate_groq_response(prompt)


async def generate_llm_stream(prompt: str):
    """
    Real-time Message Streaming (f):
    Generates chunks of text as they come from the AI.
    """
    try:
        # Try OpenRouter streaming first
        stream = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            extra_headers={
                "HTTP-Referer": "https://punchai.app",
                "X-Title": "PunchAI",
            }
        )
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        logger.error(f"Streaming Error (swapping to Groq fallback): {e}")
        # Fallback to Groq streaming
        try:
            stream = await groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e2:
            yield f"Error: {str(e2)}"


async def generate_conversation_insights(history: List[dict]) -> dict:
    """
    Analytics & Sentiment Analysis.
    Uses LLM to summarize the conversation and detect sentiment.

    Returns a dict with:
      - summary: str   — one-sentence conversation summary
      - sentiment: str — one of Happy | Neutral | Frustrated | Curious
    """
    if not history:
        return {"summary": "No history to summarize.", "sentiment": "Neutral"}

    history_text = ""
    for msg in history:
        if isinstance(msg, dict):
            role = msg.get('role', 'USER')
            content = msg.get('content', '')
        else:
            role = getattr(msg, 'role', 'USER')
            content = getattr(msg, 'content', '')
        history_text += f"{role}: {content}\n"

    prompt = f"""### TASK
Analyze the conversation history below and return a JSON object.

You MUST:
1. Write a one-sentence **summary** that captures the main topic and outcome.
2. Classify the overall **user sentiment** using EXACTLY one of these values (case-sensitive):
   - Happy      → user is satisfied, pleased, or grateful
   - Neutral    → user is informational, balanced, or has no strong emotion
   - Frustrated → user is upset, annoyed, or dissatisfied
   - Curious    → user is exploring, asking many questions, or fact-finding

### CONVERSATION HISTORY
{history_text}

### RESPONSE FORMAT
Return ONLY a raw JSON object — no markdown, no code fences, no extra text:
{{"summary": "...", "sentiment": "Happy|Neutral|Frustrated|Curious"}}
"""

    # Canonical set
    VALID_SENTIMENTS = {"Happy", "Neutral", "Frustrated", "Curious"}

    # Synonym map — normalises unexpected LLM outputs to our canonical labels
    SYNONYM_MAP = {
        "happy": "Happy",
        "positive": "Happy",
        "satisfied": "Happy",
        "grateful": "Happy",
        "pleased": "Happy",
        "good": "Happy",
        "great": "Happy",
        "frustrated": "Frustrated",
        "negative": "Frustrated",
        "upset": "Frustrated",
        "angry": "Frustrated",
        "annoyed": "Frustrated",
        "bad": "Frustrated",
        "dissatisfied": "Frustrated",
        "neutral": "Neutral",
        "informational": "Neutral",
        "mixed": "Neutral",
        "balanced": "Neutral",
        "curious": "Curious",
        "inquisitive": "Curious",
        "exploring": "Curious",
        "interested": "Curious",
    }

    try:
        raw_response = await generate_llm_response(prompt)

        import json, re

        # Strip markdown code fences if the LLM wrapped the JSON
        cleaned = re.sub(r"```(?:json)?\s*", "", raw_response).strip().strip("`")

        # Extract the first JSON object
        match = re.search(r'\{.*?\}', cleaned, re.DOTALL)
        if not match:
            logger.warning(f"No JSON found in insight response: {raw_response[:200]}")
            return {"summary": "Summary unavailable.", "sentiment": "Neutral"}

        parsed = json.loads(match.group())
        summary = parsed.get("summary", "").strip() or "Summary unavailable."

        # Normalise sentiment — strip punctuation, then title-case match
        raw_sentiment = str(parsed.get("sentiment", "")).strip().rstrip(".,;!")
        raw_lower = raw_sentiment.lower()

        # Check exact match first (e.g. "Happy"), then synonym lookup
        matched = next((v for v in VALID_SENTIMENTS if v.lower() == raw_lower), None)
        if matched:
            sentiment = matched
        else:
            sentiment = SYNONYM_MAP.get(raw_lower, "Neutral")
            if sentiment == "Neutral" and raw_lower not in SYNONYM_MAP:
                logger.warning(
                    f"Unknown sentiment '{raw_sentiment}' — defaulting to Neutral"
                )

        logger.info(f"Sentiment resolved: '{raw_sentiment}' → '{sentiment}'")
        return {"summary": summary, "sentiment": sentiment}

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error in insight generation: {e} | raw: {raw_response[:300]}")
        return {"summary": "Summary unavailable.", "sentiment": "Neutral"}
    except Exception as e:
        logger.error(f"Insight Generation Error: {e}")
        return {"summary": "Analysis failed.", "sentiment": "Neutral"}

