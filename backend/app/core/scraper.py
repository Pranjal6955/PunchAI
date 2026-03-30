import httpx
from typing import Dict, Optional

async def scrape_website(url: str) -> Dict[str, Optional[str]]:
    """
    Robust asynchronous scraper that uses Jina AI Reader API to handle JavaScript-heavy 
    websites (Next.js, React, Vue, Angular) and return clean markdown.
    """
    try:
        # We use Jina Reader API which renders the page and returns clean markdown.
        # This handles SPA/JS-rendered content perfectly without needing local playwright.
        jina_url = f"https://r.jina.ai/{url}"
        
        headers = {
            'X-Return-Format': 'markdown',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(jina_url, headers=headers, timeout=30.0)
            response.raise_for_status()
            
            # Jina returns the markdown directly.
            content = response.text
            title = "No Title"
            
            # Try to extract title from the first line if it's a markdown header
            lines = content.strip().split('\n')
            if lines and lines[0].startswith('# '):
                title = lines[0].replace('# ', '').strip()
            
            return {
                "title": title,
                "content": content
            }
    except Exception as e:
        print(f"Error scraping {url} via Jina: {e}")
        # Fallback to simple requests (synchronous but wrapped if needed, though for a fallback it's fine)
        try:
            import requests
            from bs4 import BeautifulSoup
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            for script_or_style in soup(["script", "style"]):
                script_or_style.decompose()
                
            title = soup.title.string if soup.title else url
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            content = '\n'.join(chunk for chunk in chunks if chunk)
            
            return {
                "title": str(title).strip(),
                "content": content
            }
        except Exception as e_fallback:
            print(f"Fallback scraping also failed: {e_fallback}")
            return {
                "title": "Error fetching page",
                "content": "We were unable to scrape this website. It might be blocking automated access or use complex anti-bot measures."
            }
