"""
REST API routes for Data Source management (PDF, URL, FAQ).
Handles file uploads, URL scraping, and granular FAQ management with specialized text cleaning.
"""

import os
import shutil
from typing import List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, BackgroundTasks
import uuid
from fastapi.responses import FileResponse
from fastapi.concurrency import run_in_threadpool
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
from app.utils.extractor import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_xlsx,
    extract_text_from_pptx,
    extract_text_universal,
    extract_text_from_url,
    clean_faq_text,
    format_faqs_to_text
)
from app.core.logging import logger
from app.services.processor import process_and_store

router = APIRouter(prefix="/datasources", tags=["Data Sources"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def process_file_background(bot_id: str, source_id: str, file_path: str, safe_filename: str):
    """Background task to extract text and store in RAG."""
    ext = os.path.splitext(safe_filename)[1].lower()
    try:
        if ext == ".pdf":
            content = await run_in_threadpool(extract_text_from_pdf, file_path)
            doc_type = "PDF"
        elif ext in [".docx", ".doc"]:
            content = await run_in_threadpool(extract_text_from_docx, file_path)
            doc_type = "DOC"
        elif ext in [".xlsx", ".xls"]:
            content = await run_in_threadpool(extract_text_from_xlsx, file_path)
            doc_type = "EXCEL"
        elif ext in [".pptx", ".ppt"]:
            content = await run_in_threadpool(extract_text_from_pptx, file_path)
            doc_type = "PPT"
        else:
            content = await run_in_threadpool(extract_text_universal, file_path)
            doc_type = "DOCUMENT"

        if content and content.strip():
            await process_and_store(
                bot_id=bot_id, source_id=source_id, raw_text=content, 
                metadata={"source_name": safe_filename, "type": doc_type}
            )
            await db.datasource.update(where={"id": source_id}, data={"status": "COMPLETED"})
        else:
            logger.error(f"Extraction failed for {safe_filename}: No content found")
            await db.datasource.update(where={"id": source_id}, data={"status": "FAILED"})
            
    except Exception as e:
        logger.error(f"Error during background file processing: {e}")
        await db.datasource.update(where={"id": source_id}, data={"status": "FAILED"})


@router.post("/upload", response_model=DataSourceResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    botId: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """Upload File -> Return immediately -> Process in background."""
    bot = await db.bot.find_unique(where={"id": botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Sanitize and unique-ify filename
    filename = file.filename
    safe_filename = os.path.basename(filename)
    unique_prefix = uuid.uuid4().hex[:8]
    file_path = os.path.join(UPLOAD_DIR, f"{botId}_{unique_prefix}_{safe_filename}")

    # Use run_in_threadpool to avoid blocking the event loop during file write
    def save_upload():
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    
    await run_in_threadpool(save_upload)

    ds = await db.datasource.create(
        data={
            "name": filename, "type": "FILE", "status": "PROCESSING",
            "fileUrl": file_path, "bot": {"connect": {"id": botId}},
        }
    )

    # Offload processing to background
    background_tasks.add_task(process_file_background, botId, ds.id, file_path, safe_filename)

    return ds


async def process_url_background(bot_id: str, source_id: str, url: str):
    """Background task to scrape URL and store in RAG."""
    try:
        content = await extract_text_from_url(url)
        if content:
            await process_and_store(
                bot_id=bot_id, source_id=source_id, raw_text=content, 
                metadata={"url": url, "type": "URL"}
            )
            await db.datasource.update(where={"id": source_id}, data={"status": "COMPLETED"})
        else:
            logger.warning(f"No content extracted for URL: {url}")
            await db.datasource.update(where={"id": source_id}, data={"status": "FAILED"})
    except Exception as e:
        logger.error(f"Error processing URL {url} in background: {e}")
        await db.datasource.update(where={"id": source_id}, data={"status": "FAILED"})


@router.post("/url", response_model=DataSourceResponse)
async def add_url(
    payload: URLSourceCreate, 
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Add URL -> Return immediately -> Scrape in background."""
    bot = await db.bot.find_unique(where={"id": payload.botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ds = await db.datasource.create(
        data={
            "name": payload.url, "type": "URL", "status": "PROCESSING",
            "bot": {"connect": {"id": payload.botId}},
        }
    )

    background_tasks.add_task(process_url_background, payload.botId, ds.id, payload.url)
    return ds


async def process_faq_background(bot_id: str, source_id: str, faqs: List, source_name: str):
    """Background task to format FAQs and store in RAG."""
    try:
        full_faq_text = ""
        for item in faqs:
            # Format FAQ for RAG context
            faq_text = clean_faq_text(item.question, item.answer)
            full_faq_text += faq_text + "\n\n"

        await process_and_store(
            bot_id=bot_id, source_id=source_id, raw_text=full_faq_text, 
            metadata={"source_name": source_name, "type": "FAQ"}
        )
        await db.datasource.update(where={"id": source_id}, data={"status": "COMPLETED"})
    except Exception as e:
        logger.error(f"Error processing FAQ in background: {e}")
        await db.datasource.update(where={"id": source_id}, data={"status": "FAILED"})


@router.post("/faq", response_model=DataSourceResponse)
async def add_faq_batch(
    payload: FAQSourceCreate, 
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user)
):
    """Add FAQs -> Return immediately -> Process in background."""
    bot = await db.bot.find_unique(where={"id": payload.botId})
    if not bot or bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ds = await db.datasource.create(
        data={"name": payload.name, "type": "TEXT", "status": "PROCESSING", "bot": {"connect": {"id": payload.botId}}}
    )

    # 1. Create FAQ records for granular management (keeping this synchronous for immediate UI feedback)
    for item in payload.faqs:
        await db.faq.create(
            data={
                "question": item.question,
                "answer": item.answer,
                "source": {"connect": {"id": ds.id}},
                "bot": {"connect": {"id": payload.botId}}
            }
        )

    background_tasks.add_task(process_faq_background, payload.botId, ds.id, payload.faqs, payload.name)

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


@router.get("", response_model=DataSourceListResponse)
async def list_bot_sources(botId: str = Query(...), current_user=Depends(get_current_user)):
    sources = await db.datasource.find_many(where={"botId": botId}, order={"createdAt": "desc"})
    return {"data": sources, "total": len(sources)}


@router.delete("/{ds_id}", status_code=204)
async def delete_datasource(ds_id: str, current_user=Depends(get_current_user)):
    ds = await db.datasource.find_unique(where={"id": ds_id}, include={"bot": True})
    if not ds or ds.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if ds.type == "FILE" and ds.fileUrl:
        # Avoid blocking the event loop with OS operations
        if os.path.exists(ds.fileUrl):
            await run_in_threadpool(os.remove, ds.fileUrl)

    # Bug Fix: Delete all vectors for this source from Chroma
    from app.services.processor import get_collection
    collection = await run_in_threadpool(get_collection, ds.botId)
    # Chroma delete supports a 'where' clause on metadata
    await run_in_threadpool(
        collection.delete,
        where={"source_id": ds_id}
    )
    logger.info(f"Source {ds_id} purged from Chroma")

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
    
    # Bug Fix: Sync with Chroma! 
    # Extract chunk_index from metadata to target the correct vector ID
    from app.services.processor import update_single_chunk_vector
    metadata = chunk.metadata if isinstance(chunk.metadata, dict) else {}
    chunk_index = metadata.get("chunk_index", 0)
    
    await update_single_chunk_vector(
        bot_id=chunk.botId, 
        source_id=chunk.sourceId, 
        chunk_id=chunk_id, 
        content=payload.content,
        index=chunk_index
    )
    
    return updated


@router.delete("/chunks/{chunk_id}", status_code=204)
async def delete_chunk(chunk_id: str, current_user=Depends(get_current_user)):
    chunk = await db.documentchunk.find_unique(where={"id": chunk_id}, include={"bot": True})
    if not chunk or chunk.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Bug Fix: Sync with Chroma BEFORE deleting from DB
    from app.services.processor import delete_single_chunk_vector
    metadata = chunk.metadata if isinstance(chunk.metadata, dict) else {}
    chunk_index = metadata.get("chunk_index", 0)

    await delete_single_chunk_vector(
        bot_id=chunk.botId,
        source_id=chunk.sourceId,
        index=chunk_index
    )

    await db.documentchunk.delete(where={"id": chunk_id})
    return None


@router.get("/file/{ds_id}")
async def get_datasource_file(ds_id: str, current_user=Depends(get_current_user)):
    """Serve the original file for a datasource. (Owner only)"""
    ds = await db.datasource.find_unique(where={"id": ds_id}, include={"bot": True})
    if not ds or ds.bot.ownerId != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to access this file")

    if ds.type != "FILE" or not ds.fileUrl:
        raise HTTPException(status_code=400, detail="This datasource does not have a file")

    if not os.path.exists(ds.fileUrl):
        raise HTTPException(status_code=404, detail="File not found on disk")

    # Use original name for the download
    return FileResponse(ds.fileUrl, filename=ds.name)
