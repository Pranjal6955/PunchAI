import os
from dotenv import load_dotenv
from openai import OpenAI
from groq import Groq

# Load .env from the parent directory
load_dotenv(".env")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

print("--- Testing OpenRouter ---")
if not OPENROUTER_API_KEY or "sk-or-v1-..." in OPENROUTER_API_KEY:
    print("❌ OPENROUTER_API_KEY is not set correctly in .env")
else:
    try:
        client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=OPENROUTER_API_KEY,
        )
        response = client.chat.completions.create(
            model=OPENROUTER_MODEL,
            messages=[{"role": "user", "content": "Say 'OpenRouter is working!'"}]
        )
        print(f"✅ OpenRouter Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ OpenRouter Failed: {e}")

print("\n--- Testing Groq ---")
if not GROQ_API_KEY or "gsk_..." in GROQ_API_KEY:
    print("❌ GROQ_API_KEY is not set correctly in .env")
else:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": "Say 'Groq is working!'"}]
        )
        print(f"✅ Groq Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Groq Failed: {e}")
