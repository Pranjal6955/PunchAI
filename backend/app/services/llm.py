"""
LLM Service for PunchAI with OpenRouter and Groq fallback.
Builds the RAG prompt and generates a response based on retrieved context.
"""

import re
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
    history: Optional[List] = None,
) -> dict:
    """
    Constructs a structured prompt (System + User) for the RAG response.
    Optimized for instruction adherence and context utilization.
    """

    # 1. Format Context with numbering for better LLM grounding
    if context:
        context_parts = []
        for i, chunk in enumerate(context, 1):
            context_parts.append(f"[Document Chunk {i}]\n{chunk}")
        context_text = "\n\n".join(context_parts)
        context_section = f"### RELEVANT KNOWLEDGE\n{context_text}"
    else:
        context_section = (
            "### RELEVANT KNOWLEDGE\n"
            "[No internal documents found. Answer using general knowledge but notify the user.]"
        )

    # 2. Build Chat History Summary (last 10 messages)
    history_text = ""
    if history:
        history_text = "### RECENT CONVERSATION\n"
        for msg in history:
            role = "User" if (msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'USER')) == "USER" else "Assistant"
            content = msg.get('content', '') if isinstance(msg, dict) else getattr(msg, 'content', '')
            history_text += f"{role}: {content}\n"
        history_text += "\n"

    # 3. System Prompt (The Brain/Rules)
    base_persona = persona if persona else "You are a helpful and professional AI assistant."
    system_prompt = f"""{base_persona}

CORE INSTRUCTIONS:
1. **Source Grounding**: Answer using ONLY the provided 'RELEVANT KNOWLEDGE'. If information is missing, admit it politely.
2. **Markdown Priority**: Use bold text, bullet points, and clean spacing to make your answer readable.
3. **Tone**: Be professional, warm, and concise. Avoid yapping or repetitive filler phrases.
4. **Context Loop**: Use the 'RECENT CONVERSATION' to understand pronouns (it, they, that) or follow-up requests.
5. **No Hallucinations**: Do NOT invent features, dates, or facts not present in the context.
"""

    # 4. User Prompt (The specific task)
    user_prompt = f"""{history_text}{context_section}

---

USER QUESTION: {question}

FINAL ANSWER:"""

    return {
        "system": system_prompt.strip(),
        "user": user_prompt.strip()
    }


async def get_search_query(question: str, history: List[dict] = None) -> str:
    """
    Search Prompt Engineering:
    Strips conversational noise to generate a standalone keyword/semantic search query.
    Example: "Thanks for that! So what is the pricing?" -> "Pricing"
    """
    if not history or len(question.split()) < 4:
        return question

    history_snippet = ""
    for msg in history[-3:]:
        role = "User" if (msg.get('role') if isinstance(msg, dict) else getattr(msg, 'role', 'USER')) == "USER" else "Assistant"
        content = msg.get('content', '') if isinstance(msg, dict) else getattr(msg, 'content', '')
        history_snippet += f"{role}: {content}\n"

    query_refiner_prompt = f"""### TASK
Analyze the conversation and the user's latest message. Generate a single, concise search query for a knowledge base.

Guidelines:
- Strip "thanks", "hello", or conversational filler.
- If it's a follow-up, resolve pronouns (e.g., "How do I fix it?" -> "How to fix [Topic]").
- Return ONLY the search terms. Do NOT explain your reasoning.

### CONVERSATION
{history_snippet}
User: {question}

### SEARCH QUERY
"""
    try:
        # P1 Enhancement: Use Groq for faster query refinement (0.5s vs 1.8s)
        refined = await generate_groq_response(query_refiner_prompt)
        
        # Take the most likely line and strip prefixes
        lines = [l.strip() for l in refined.split('\n') if l.strip()]
        if not lines:
            return question
            
        final_query = lines[-1].strip().strip('"').strip("'")
        final_query = re.sub(r'^(Query|Search Query|Standalone Query):\s*', '', final_query, flags=re.IGNORECASE)
        
        return final_query if final_query else question
    except Exception:
        return question
async def generate_expanded_queries(query: str, n: int = 2) -> List[str]:
    """
    Query Expansion (P2 Feature):
    Generates N additional varied queries to improve retrieval recall.
    """
    if len(query.split()) < 2:
        return [query]

    prompt = f"""### TASK
Generate {n} different search variations for the user query below. 
These variations should help retrieve different but related knowledge base search terms.

User Query: {query}

Guidelines:
- Return ONLY the queries, one per line.
- Do NOT provide numbering, bullets, or extra text.
- Variations should use synonyms or explore related sub-topics.

### VARIATIONS
"""
    try:
        # Use Groq for speed
        from app.services.llm import generate_groq_response
        response = await generate_groq_response(prompt)
        queries = [l.strip() for l in response.split('\n') if l.strip()]
        
        cleaned_queries = [query] # Always start with original
        for q in queries:
            # Remove leading numbers/bullets if any
            q = re.sub(r'^[\d\.\-\*\)\s]+', '', q).strip()
            if q and q.lower() != query.lower():
                cleaned_queries.append(q)
        
        return cleaned_queries[:n+1]
    except Exception as e:
        logger.warning(f"Query expansion failed: {e}")
        return [query]


async def generate_openrouter_response(prompt: str | dict) -> str:
    """Calls OpenRouter asynchronously. Supports both raw strings and System/User dicts."""
    try:
        messages = []
        if isinstance(prompt, dict):
            messages = [
                {"role": "system", "content": prompt["system"]},
                {"role": "user", "content": prompt["user"]},
            ]
        else:
            messages = [{"role": "user", "content": prompt}]

        response = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=messages,
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


async def generate_groq_response(prompt: str | dict) -> str:
    """Calls Groq asynchronously as a fallback. Supports System/User dicts."""
    try:
        messages = []
        if isinstance(prompt, dict):
            messages = [
                {"role": "system", "content": prompt["system"]},
                {"role": "user", "content": prompt["user"]},
            ]
        else:
            messages = [{"role": "user", "content": prompt}]

        response = await groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=messages,
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


async def generate_llm_stream(prompt: str | dict):
    """
    Real-time Message Streaming (f):
    Generates chunks of text as they come from the AI.
    """
    messages = []
    if isinstance(prompt, dict):
        messages = [
            {"role": "system", "content": prompt["system"]},
            {"role": "user", "content": prompt["user"]},
        ]
    else:
        messages = [{"role": "user", "content": prompt}]

    try:
        # Try OpenRouter streaming first
        stream = await openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=messages,
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
                messages=messages,
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
        # P1 Enhancement: Use Groq for faster background analysis
        raw_response = await generate_groq_response(prompt)

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

