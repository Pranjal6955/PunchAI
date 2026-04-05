"""
LLM Service for PunchAI with OpenRouter and Groq fallback.
Builds the RAG prompt and generates a response based on retrieved context.
"""

import json
from typing import List, Optional
from openai import OpenAI
from groq import Groq
from app.core.config import settings

# Initialize OpenAI client for OpenRouter
openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

# Initialize Groq client
groq_client = Groq(
    api_key=settings.GROQ_API_KEY,
)


def build_rag_prompt(persona: Optional[str], context: List[str], question: str) -> str:
    """Constructs a prompt template for the RAG response."""
    
    context_text = "\n---\n".join(context)
    
    # Use the bot's custom persona or a default base prompt
    base_persona = persona if persona else "You are a helpful and professional AI assistant."
    
    prompt = f"""
System/Persona:
{base_persona}

Role: 
Answer the following User Question based ONLY on the provided Context. 
If the context doesn't contain the answer, politely state that you don't know based on the provided information. 
Keep your answer concise and accurate.

Context:
{context_text}

---
User Question: {question}
Answer:
"""
    return prompt.strip()


def generate_openrouter_response(prompt: str) -> str:
    """Calls OpenRouter to generate an AI response."""
    try:
        response = openrouter_client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[{"role": "user", "content": prompt}],
            extra_headers={
                "HTTP-Referer": "https://punchai.app",
                "X-Title": "PunchAI",
            }
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        raise Exception("OpenRouter returned no response choices.")
    except Exception as e:
        print(f"OpenRouter Error: {e}")
        raise e


def generate_groq_response(prompt: str) -> str:
    """Calls Groq as a fallback LLM."""
    try:
        response = groq_client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content
        return "Groq returned no response choices."
    except Exception as e:
        print(f"Groq Error: {e}")
        return f"I'm sorry, I'm having trouble reaching my AI engines (both OpenRouter and Groq). Error: {str(e)}"


def generate_llm_response(prompt: str) -> str:
    """Main entry point with fallback: OpenRouter -> Groq."""
    try:
        # Try OpenRouter first
        return generate_openrouter_response(prompt)
    except Exception:
        # Fallback to Groq
        print("Switching to Groq fallback...")
        return generate_groq_response(prompt)
