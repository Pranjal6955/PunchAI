"""
Utilities for extracting and cleaning text from different data sources (PDF, URL, FAQ).
Includes specialized cleaning logic for each source type.
"""

import httpx
import re
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader
import docx
import pandas as pd
from pptx import Presentation
from unstructured.partition.auto import partition


def clean_pdf_text(text: str) -> str:
    """Clean text extracted from PDF: removes headers/footers placeholders, fixes ligatures."""
    # Remove multiple newlines and normalize whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove common PDF artifacts like "Page 1 of 10" or similar patterns
    text = re.sub(r'Page \d+ of \d+', '', text, flags=re.IGNORECASE)
    
    # Fix common character issues (e.g., "fi" or "fl" ligatures if unparsed)
    # This is a basic pass; more complex PDFs might need specialized libraries.
    
    return text.strip()


def clean_url_text(soup: BeautifulSoup) -> str:
    """Clean text extracted from a URL: removes nav, footer, ads, and boilerplate."""
    # 1. Removal of non-content elements
    for element in soup(["script", "style", "nav", "footer", "header", "aside", "form", "iframe"]):
        element.decompose()
        
    # 2. Extract text from primary containers if they exist (common selectors for actual content)
    main_content = soup.select_one(
        "main, article, [role='main'], #content, .content, .post-content, .entry-content"
    )
    if main_content:
        text = main_content.get_text(separator="\n")
    else:
        fallback_nodes = soup.select("h1, h2, h3, p, li")
        if fallback_nodes:
            text = "\n".join(node.get_text(" ", strip=True) for node in fallback_nodes)
        else:
            text = soup.get_text(separator="\n")
        
    # 3. Clean up whitespace and empty lines
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = "\n".join(chunk for chunk in chunks if chunk)
    
    return text.strip()


def clean_faq_text(question: str, answer: str) -> str:
    """Clean and format individual FAQ entries."""
    q = question.strip().rstrip('?') + '?'
    a = answer.strip()
    return f"Q: {q}\nA: {a}"


# ── Extraction Entry Points ──

def extract_text_from_pdf(file_path: str) -> str:
    """Extract and specifically clean text from a local PDF."""
    raw_text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            content = page.extract_text()
            if content:
                raw_text += content + "\n"
        return clean_pdf_text(raw_text)
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from a Word document."""
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""


def extract_text_from_xlsx(file_path: str) -> str:
    """Extract text from an Excel spreadsheet."""
    try:
        # Read all sheets
        df_dict = pd.read_excel(file_path, sheet_name=None)
        text = ""
        for sheet_name, df in df_dict.items():
            text += f"Sheet: {sheet_name}\n"
            # Replace NaNs with empty string
            df = df.fillna("")
            text += df.to_csv(index=False, sep='\t') + "\n\n"
        return text
    except Exception as e:
        print(f"Error extracting XLSX: {e}")
        return ""


def extract_text_from_pptx(file_path: str) -> str:
    """Extract text from a PowerPoint presentation."""
    try:
        prs = Presentation(file_path)
        text = ""
        for i, slide in enumerate(prs.slides):
            text += f"Slide {i+1}:\n"
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
            text += "\n"
        return text
    except Exception as e:
        print(f"Error extracting PPTX: {e}")
        return ""


def extract_text_universal(file_path: str) -> str:
    """Extract text using unstructured library as a robust fallback."""
    try:
        elements = partition(filename=file_path)
        return "\n\n".join([str(el) for el in elements])
    except Exception as e:
        print(f"Error using unstructured extractor: {e}")
        return ""


async def extract_text_from_url(url: str) -> str:
    """Scrape, extract, and specifically clean main content from a URL asynchronously."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }
        async with httpx.AsyncClient(
            headers=headers,
            timeout=httpx.Timeout(20.0, connect=10.0),
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        if "text/plain" in content_type:
            return response.text.strip()
        
        soup = BeautifulSoup(response.text, "html.parser")
        return clean_url_text(soup)
    except Exception as e:
        print(f"Error scraping URL: {e}")
        return ""


def format_faqs_to_text(faqs: list) -> str:
    """Clean and format a list of FAQs into a unified text block."""
    entries = []
    for faq in faqs:
        cleaned = clean_faq_text(faq.get("question", ""), faq.get("answer", ""))
        entries.append(cleaned)
    return "\n\n".join(entries)
