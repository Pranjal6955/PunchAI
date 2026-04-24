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
    has_context = bool(context)
    if context:
        context_parts = []
        for i, chunk in enumerate(context, 1):
            context_parts.append(f"[Document Chunk {i}]\n{chunk}")
        context_text = "\n\n".join(context_parts)
        context_section = f"### RELEVANT KNOWLEDGE\n{context_text}"
    else:
        context_section = (
            "### RELEVANT KNOWLEDGE\n"
            "[No trusted internal knowledge snippets are available for this query.]"
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
    context_rule = (
        "Use only the provided RELEVANT KNOWLEDGE as the source of truth. "
        "If details are missing, say you don't have enough information and ask a brief follow-up question."
        if has_context else
        "No internal knowledge is available for this turn. Answer naturally using general knowledge without claiming access to internal docs. "
        "If the user asks account/product-specific details, clearly say you need more details."
    )

    system_prompt = f"""{base_persona}

CORE INSTRUCTIONS:
1. **Source Grounding**: {context_rule}
2. **Tone**: Be professional, warm, and concise.
3. **Style**: Reply in normal conversational prose by default (no section headings like "Introduction" / "Next Steps" unless the user explicitly asks for a structured format).
4. **Context Loop**: Use the 'RECENT CONVERSATION' to resolve pronouns and follow-up requests.
5. **No Hallucinations**: Do NOT invent features, dates, policies, or facts.
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
        refined, _ = await generate_groq_response(query_refiner_prompt)
        
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
        response, _ = await generate_groq_response(prompt)
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


async def generate_openrouter_response(prompt: str | dict, model: str = None) -> tuple[str, dict]:
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
            model=model or settings.OPENROUTER_MODEL,
            messages=messages,
            extra_headers={
                "HTTP-Referer": "https://punchai.app",
                "X-Title": "PunchAI",
            }
        )
        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0
        }
        if response.choices:
            return response.choices[0].message.content, usage
        raise Exception("OpenRouter returned no response choices.")
    except Exception as e:
        logger.error(f"OpenRouter Error: {e}")
        raise e


async def generate_groq_response(prompt: str | dict, model: str = None) -> tuple[str, dict]:
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
            model=model or settings.GROQ_MODEL,
            messages=messages,
        )
        usage = {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0
        }
        if response.choices:
            return response.choices[0].message.content, usage
        return "Groq returned no response choices.", usage
    except Exception as e:
        logger.error(f"Groq Error: {e}")
        return f"I'm sorry, I'm having trouble reaching my AI engines. Error: {str(e)}", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}


async def generate_llm_response(prompt: str, model: str = None) -> tuple[str, dict]:
    """Main entry point with async fallback: OpenRouter -> Groq."""
    try:
        return await generate_openrouter_response(prompt, model=model)
    except Exception:
        logger.warning("Switching to Groq fallback...")
        return await generate_groq_response(prompt, model=model)


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



async def generate_suggested_questions(context_snippets) -> List[str]:
    """Generates up to 3 relevant starter questions based on document context."""
    normalized_snippets: List[str] = []

    if isinstance(context_snippets, dict):
        chunks = context_snippets.get("chunks", [])
        if isinstance(chunks, list):
            normalized_snippets = [str(chunk) for chunk in chunks if chunk]
    elif isinstance(context_snippets, list):
        normalized_snippets = [str(chunk) for chunk in context_snippets if chunk]
    elif isinstance(context_snippets, str) and context_snippets.strip():
        normalized_snippets = [context_snippets]

    if not normalized_snippets:
        return ["Who are you?", "What can you do?", "Tell me about yourself."]

    snippets_text = "\n---\n".join(normalized_snippets[:5])
    prompt = {
        "system": "You are a helpful AI assistant. Based on the provided snippets from a knowledge base, generate exactly 3 short, engaging, and professional 'starter questions' that a user might want to ask this AI. Return ONLY the questions, one per line. No numbers, no extra text.",
        "user": f"Document Snippets:\n{snippets_text}\n\nGenerate 3 questions:"
    }
    
    try:
        response, _ = await generate_llm_response(prompt)
        questions = [q.strip() for q in response.split("\n") if q.strip()]
        return questions[:3] or ["Who are you?", "What can you do?", "Tell me about yourself."]
    except Exception:
        return ["Who are you?", "What can you do?", "Tell me about yourself."]
