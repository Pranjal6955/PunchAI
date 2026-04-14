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


def build_rag_prompt(persona: Optional[str], context: List[str], question: str, history: List[dict] = None) -> str:
    """Constructs a prompt template for the RAG response with a focus on politeness and simplicity."""
    
    context_text = "\n---\n".join(context)
    
    # Use the bot's custom persona or a default base prompt
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
You are replying to a user in a chat conversation. Your goal is to answer the user's question accurately using the provided context and considering the recent conversation history. Follow these strict guidelines:
1. **Be Polite & Conversational**: Always maintain a warm, respectful, and helpful tone. Speak like a friendly professional.
2. **Simple Language**: Explain concepts in simple, layman terms. Avoid complex jargon or technical speak unless absolutely necessary to explain the data.
3. **Accuracy**: Use the information in the context provided below. Do not use outside knowledge.
4. **Contextual Awareness**: If the user refers to previous parts of the conversation, use the RECENT CHAT HISTORY to understand their request.
5. **Uncertainty**: If the information is not present in the context, politely explain that you don't have that specific information in your records and offer to help with something else.

{history_text}
### CONTEXT
{context_text}

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
