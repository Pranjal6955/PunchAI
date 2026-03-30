import requests
import json
from app.core.config import settings
from typing import Optional

import time

def extract_structured_data(content: str, user_prompt: str) -> Optional[str]:
    """
    Use Gemini AI to extract structured data from raw content based on a user prompt.
    Includes retry logic for rate limits (429).
    """
    max_retries = 3
    base_delay = 2
    
    try:
        if not settings.GEMINI_API_KEY:
            return "Gemini API key not configured. Extraction skipped."
            
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Build prompt: instruction + raw content
        system_instruction = (
            "You are an expert at extracting clear and structured information from raw web content. "
            f"Based on the following instruction: '{user_prompt}', extract information accurately. "
            "Respond ONLY with the extracted structured information. If it should be JSON, format it as clean JSON."
        )
        
        data = {
            "contents": [{
                "parts": [{
                    "text": f"{system_instruction}\n\nRAW CONTENT:\n{content[:30000]}" # Truncate content to avoid token limits
                }]
            }]
        }
        
        for attempt in range(max_retries):
            response = requests.post(url, headers=headers, data=json.dumps(data), timeout=30)
            
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limited (429). Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    return "Extraction failed: Rate limit exceeded after retries. Please try again later."
            
            response.raise_for_status()
            result = response.json()
            
            if "candidates" in result and result["candidates"]:
                extracted_text = result["candidates"][0]["content"]["parts"][0]["text"]
                return extracted_text.strip()
                
            return "No extraction candidates found in API response."
            
        return "Extraction failed: Maximum retries reached."
        
    except Exception as e:
        print(f"Error calling AI Service: {e}")
        return "Extraction failed due to an internal error. Please try again."
