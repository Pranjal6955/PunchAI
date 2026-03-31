"""
Local LLM Service for PunchAI using Ollama.
Builds the RAG prompt and generates a response based on retrieved context.
"""

import requests
import json
from typing import List, Optional

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3"  # or 'mistral', 'phi3', etc.


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


def generate_ollama_response(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Calls a local Ollama instance to generate an AI response."""
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False  # We want the full response back for simplicity initially
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        return data.get("response", "No response generated.")
        
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama: {e}")
        return f"I'm sorry, I'm having trouble reaching my local AI engine (Ollama). Error: {e}"
