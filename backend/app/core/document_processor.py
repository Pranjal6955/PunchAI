import os
from io import BytesIO
from typing import Optional
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes."""
    try:
        reader = PdfReader(BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes."""
    try:
        doc = Document(BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""

def extract_text_from_file(params: bytes, file_extension: str) -> Optional[str]:
    """Route file extraction based on extension."""
    ext = file_extension.lower().lstrip('.')
    
    if ext == 'pdf':
        return extract_text_from_pdf(params)
    elif ext in ['docx', 'doc']:
        return extract_text_from_docx(params)
    elif ext == 'txt':
        try:
            return params.decode('utf-8')
        except UnicodeDecodeError:
            return params.decode('latin-1')
            
    return None
