"""
REST API routes for Data Source management (PDF, URL, FAQ).
Handles file uploads, URL scraping, and granular FAQ management with specialized text cleaning.
"""

import os
import shutil
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query
from prisma import Json
from app.core.database import db
from app.schemas.datasource import (
    DataSourceResponse,
    DataSourceListResponse,
    URLSourceCreate,
    FAQSourceCreate,
    FAQResponse,
    FAQUpdate,
    ChunkResponse,
    ChunkUpdate,
)
from app.api.deps import get_current_user
from app.utils.extractor import extract_text_from_pdf, extract_text_from_url, clean_faq_text, format_faqs_to_text
from app.services.processor import process_and_store

router = APIRouter(prefix="/datasources", tags=["Data Sources"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=DataSourceResponse)
async def upload_pdf(
    botId: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload PDF -> Specialized Content Cleaning -> RAG Preprocessing."""
    bot = await db.bot.find_unique(where={"id": botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    file_path = os.path.join(UPLOAD_DIR, f"{botId}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ds = await db.datasource.create(
        data={
            "name": file.filename, "type": "FILE", "status": "PROCESSING",
            "fileUrl": file_path, "bot": {"connect": {"id": botId}},
        }
    )

    # 1. Specialized PDF Extraction & Cleaning (handles page numbers/artifacts)
    content = extract_text_from_pdf(file_path)
    if content:
        await db.documentchunk.create(
            data={
                "content": content,
                "source": {"connect": {"id": ds.id}},
                "bot": {"connect": {"id": botId}}
            }
        )
        process_and_store(
            bot_id=botId, source_id=ds.id, raw_text=content, 
            metadata={"source_name": file.filename, "type": "PDF"}
        )
        await db.datasource.update(where={"id": ds.id}, data={"status": "COMPLETED"})
    else:
        await db.datasource.update(where={"id": ds.id}, data={"status": "FAILED"})

    return ds


@router.post("/url", response_model=DataSourceResponse)
async def add_url(payload: URLSourceCreate, current_user=Depends(get_current_user)):
    """Add URL -> Specialized Scraping (strips nav/ads) -> RAG Preprocessing."""
    bot = await db.bot.find_unique(where={"id": payload.botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ds = await db.datasource.create(
        data={
            "name": str(payload.url), "type": "URL", "status": "PROCESSING",
            "bot": {"connect": {"id": payload.botId}},
        }
    )

    # 1. Specialized URL Extraction & Cleaning (filters nav/footer/ads)
    content = extract_text_from_url(str(payload.url))
    if content:
        await db.documentchunk.create(
            data={
                "content": content,
                "source": {"connect": {"id": ds.id}},
                "bot": {"connect": {"id": payload.botId}}
            }
        )
        process_and_store(
            bot_id=payload.botId, source_id=ds.id, raw_text=content, 
            metadata={"url": str(payload.url), "type": "URL"}
        )
        await db.datasource.update(where={"id": ds.id}, data={"status": "COMPLETED"})
    else:
        await db.datasource.update(where={"id": ds.id}, data={"status": "FAILED"})

    return ds


@router.post("/faq", response_model=DataSourceResponse)
async def add_faq_batch(payload: FAQSourceCreate, current_user=Depends(get_current_user)):
    """Add FAQs -> Specialized Q&A Formatting -> RAG Preprocessing."""
    bot = await db.bot.find_unique(where={"id": payload.botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ds = await db.datasource.create(
        data={"name": payload.name, "type": "TEXT", "status": "COMPLETED", "bot": {"connect": {"id": payload.botId}}}
    )

    full_faq_text = ""
    for item in payload.faqs:
        # 1. Create FAQ record
        faq_record = await db.faq.create(
            data={
                "question": item.question,
                "answer": item.answer,
                "source": {"connect": {"id": ds.id}},
                "bot": {"connect": {"id": payload.botId}}
            }
        )
        
        # 2. Specialized FAQ Cleaning & Formatting (standardized Q: / A: prefix)
        faq_text = clean_faq_text(item.question, item.answer)
        full_faq_text += faq_text + "\n\n"

        await db.documentchunk.create(
            data={
                "content": faq_text,
                "source": {"connect": {"id": ds.id}},
                "bot": {"connect": {"id": payload.botId}},
                "metadata": Json({"faqId": faq_record.id})
            }
        )

    process_and_store(
        bot_id=payload.botId, source_id=ds.id, raw_text=full_faq_text, 
        metadata={"source_name": payload.name, "type": "FAQ"}
    )

    return ds


# ── Granular FAQ Updates ──

@router.get("/faqs", response_model=List[FAQResponse])
async def list_faqs(botId: str = Query(...), current_user=Depends(get_current_user)):
    return await db.faq.find_many(where={"botId": botId}, order={"createdAt": "desc"})


@router.patch("/faqs/{faq_id}", response_model=FAQResponse)
async def update_faq(faq_id: str, payload: FAQUpdate, current_user=Depends(get_current_user)):
    faq = await db.faq.find_unique(where={"id": faq_id}, include={"bot": True})
    if not faq or faq.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return await db.faq.update(where={"id": faq_id}, data=payload.model_dump(exclude_unset=True))


@router.delete("/faqs/{faq_id}", status_code=204)
async def delete_faq(faq_id: str, current_user=Depends(get_current_user)):
    faq = await db.faq.find_unique(where={"id": faq_id}, include={"bot": True})
    if not faq or faq.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.faq.delete(where={"id": faq_id})
    return None


@router.get("/", response_model=DataSourceListResponse)
async def list_bot_sources(botId: str = Query(...), current_user=Depends(get_current_user)):
    sources = await db.datasource.find_many(where={"botId": botId}, order={"createdAt": "desc"})
    return {"data": sources, "total": len(sources)}


@router.delete("/{ds_id}", status_code=204)
async def delete_datasource(ds_id: str, current_user=Depends(get_current_user)):
    ds = await db.datasource.find_unique(where={"id": ds_id}, include={"bot": True})
    if not ds or ds.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if ds.type == "FILE" and ds.fileUrl and os.path.exists(ds.fileUrl):
        os.remove(ds.fileUrl)

    await db.datasource.delete(where={"id": ds_id})
    return None


@router.get("/chunks/{ds_id}", response_model=List[ChunkResponse])
async def list_source_chunks(ds_id: str, current_user=Depends(get_current_user)):
    ds = await db.datasource.find_unique(where={"id": ds_id}, include={"bot": True})
    if not ds or ds.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    return await db.documentchunk.find_many(where={"sourceId": ds_id}, order={"createdAt": "asc"})


@router.patch("/chunks/{chunk_id}", response_model=ChunkResponse)
async def update_chunk(chunk_id: str, payload: ChunkUpdate, current_user=Depends(get_current_user)):
    chunk = await db.documentchunk.find_unique(where={"id": chunk_id}, include={"bot": True})
    if not chunk or chunk.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # update in DB
    updated = await db.documentchunk.update(where={"id": chunk_id}, data={"content": payload.content})
    
    # Ideally, we should re-sync with Chroma here. 
    # For now, we'll just update the SQL record which is used for keyword search.
    # To re-sync Chroma properly, we'd need to re-index the whole source since one chunk update 
    # affects the text splitter's output for the whole raw text.
    
    return updated


@router.delete("/chunks/{chunk_id}", status_code=204)
async def delete_chunk(chunk_id: str, current_user=Depends(get_current_user)):
    chunk = await db.documentchunk.find_unique(where={"id": chunk_id}, include={"bot": True})
    if not chunk or chunk.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    await db.documentchunk.delete(where={"id": chunk_id})
    return None
