from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, File, UploadFile, Form
from typing import List, Optional
from app.db.prisma import prisma
from app.api.endpoints.auth import get_current_user
from app.schemas.data_source import DataSourceCreate, DataSourceResponse, DataSourceUpdate
from app.core.scraper import scrape_website
from app.core.document_processor import extract_text_from_file
from app.core.gemini import extract_structured_data

router = APIRouter()

async def run_scraping_and_extraction(data_source_id: str):
    """Perform background scraping and optional AI cleaning."""
    try:
        data_source = await prisma.datasource.find_unique(where={"id": data_source_id})
        if not data_source: return
        
        await prisma.datasource.update(where={"id": data_source_id}, data={"status": "scraping"})
        scrape_result = await scrape_website(data_source.link)
        raw_content = scrape_result.get("content", "")
        title = scrape_result.get("title", "No Title")
        
        structured_content = None
        if data_source.prompt and raw_content:
            await prisma.datasource.update(where={"id": data_source_id}, data={"status": "processing_ai", "content": raw_content, "title": title})
            structured_content = extract_structured_data(raw_content, data_source.prompt)
            
        await prisma.datasource.update(
            where={"id": data_source_id},
            data={
                "title": title,
                "content": raw_content,
                "structuredContent": structured_content,
                "status": "completed"
            }
        )
    except Exception as e:
        print(f"Error in background task: {e}")
        await prisma.datasource.update(where={"id": data_source_id}, data={"status": "failed"})

async def run_file_extraction(data_source_id: str, file_content: bytes, original_name: str):
    """Background task to extract text from a file and optional AI cleaning."""
    try:
        data_source = await prisma.datasource.find_unique(where={"id": data_source_id})
        if not data_source: return

        ext = original_name.split('.')[-1] if '.' in original_name else 'txt'
        extracted_text = extract_text_from_file(file_content, ext)
        
        if extracted_text:
            structured_content = None
            if data_source.prompt:
                await prisma.datasource.update(where={"id": data_source_id}, data={"status": "processing_ai", "content": extracted_text})
                structured_content = extract_structured_data(extracted_text, data_source.prompt)

            await prisma.datasource.update(
                where={"id": data_source_id},
                data={
                    "title": original_name,
                    "content": extracted_text,
                    "structuredContent": structured_content,
                    "status": "completed"
                }
            )
        else:
            await prisma.datasource.update(where={"id": data_source_id}, data={"status": "failed"})
    except Exception as e:
        print(f"File extraction error: {e}")
        await prisma.datasource.update(where={"id": data_source_id}, data={"status": "failed"})

@router.post("/{bot_id}/data-sources", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def add_data_source(
    bot_id: str, 
    ds_in: DataSourceCreate, 
    background_tasks: BackgroundTasks, 
    current_user = Depends(get_current_user)
):
    """Add a new web link data source."""
    bot = await prisma.chatbot.find_unique(where={"id": bot_id})
    if not bot or bot.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    
    new_ds = await prisma.datasource.create(
        data={
            "type": "url",
            "link": ds_in.link,
            "prompt": ds_in.prompt,
            "botId": bot_id,
            "status": "pending"
        }
    )
    background_tasks.add_task(run_scraping_and_extraction, new_ds.id)
    return new_ds

@router.post("/{bot_id}/data-sources/upload", response_model=DataSourceResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    bot_id: str,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    current_user = Depends(get_current_user)
):
    """Upload a PDF, DOCX, or TXT file as a data source."""
    bot = await prisma.chatbot.find_unique(where={"id": bot_id})
    if not bot or bot.userId != current_user.id:
        raise HTTPException(status_code=404, detail="Chatbot not found")
        
    # Read content
    content = await file.read()
    
    # Create DB entry
    new_ds = await prisma.datasource.create(
        data={
            "type": "file",
            "fileName": file.filename,
            "title": file.filename,
            "prompt": prompt,
            "botId": bot_id,
            "status": "processing"
        }
    )
    
    # Process in background
    background_tasks.add_task(run_file_extraction, new_ds.id, content, file.filename)
    
    return new_ds

@router.get("/{bot_id}/data-sources", response_model=List[DataSourceResponse])
async def list_data_sources(bot_id: str, current_user = Depends(get_current_user)):
    """
    Retrieve all data sources for a specific bot.
    """
    bot = await prisma.chatbot.find_unique(where={"id": bot_id})
    if not bot or bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
        
    data_sources = await prisma.datasource.find_many(
        where={"botId": bot_id},
        order={"createdAt": "desc"}
    )
    return data_sources


@router.put("/data-sources/{id}", response_model=DataSourceResponse)
async def update_data_source(
    id: str,
    ds_in: DataSourceUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update a specific data source's content or title.
    """
    data_source = await prisma.datasource.find_unique(
        where={"id": id},
        include={"bot": True}
    )
    
    if not data_source or data_source.bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
        
    update_data = ds_in.dict(exclude_unset=True)
    
    updated = await prisma.datasource.update(
        where={"id": id},
        data=update_data
    )
    return updated

@router.delete("/data-sources/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_data_source(id: str, current_user = Depends(get_current_user)):
    """
    Delete a specific data source.
    """
    # Find with include check ownership
    data_source = await prisma.datasource.find_unique(
        where={"id": id},
        include={"bot": True}
    )
    
    if not data_source or data_source.bot.userId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
        
    await prisma.datasource.delete(where={"id": id})
    return None
