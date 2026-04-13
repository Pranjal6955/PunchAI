import re
import asyncio
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.vector_store import get_collection
from fastapi.concurrency import run_in_threadpool
from app.core.logging import logger

# Initialize embedding model (free, locally running)
model = SentenceTransformer('all-MiniLM-L6-v2')

# Configure text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""]
)


def clean_text(text: str) -> str:
    """
    Validation & Sanitization (i):
    Improved cleaning logic to handle Noise, HTML, and extra whitespace.
    """
    if not text:
        return ""
        
    # Remove HTML tags if any
    text = re.sub(r'<[^>]+>', '', text)
    
    # Normalize horizontal whitespace (tabs/multiple spaces) to single space
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Normalize multiple blank lines to exactly two newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    # Remove control characters
    text = "".join(ch for ch in text if ord(ch) >= 32 or ch in "\n\r\t")
    
    return text.strip()


async def process_and_store(
    bot_id: str, 
    source_id: str, 
    raw_text: str, 
    metadata: Dict[str, Any] = None
):
    """
    Main Preprocessing Pipeline:
    Uses run_in_threadpool for CPU-bound embedding generation.
    """
    if not raw_text.strip():
        return False

    # 1. Cleaning (Sanitization)
    clean_content = clean_text(raw_text)
    
    # 2. Chunking
    chunks: List[str] = text_splitter.split_text(clean_content)
    
    if not chunks:
        return False

    # 3. Vector Storage
    collection = await run_in_threadpool(get_collection, bot_id)
    
    # Prepare IDs and Metadatas for Chroma
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]
    metadatas = []
    for i in range(len(chunks)):
        meta = metadata.copy() if metadata else {}
        meta.update({"source_id": source_id, "bot_id": bot_id, "chunk_index": i})
        metadatas.append(meta)

    # 4. Explicit Embedding Generation (CPU-bound)
    # We run this in a threadpool to avoid blocking the event loop
    embeddings = await run_in_threadpool(model.encode, chunks)
    embeddings_list = embeddings.tolist()
    
    # Store in ChromaDB
    await run_in_threadpool(
        collection.add,
        ids=ids,
        documents=chunks,
        embeddings=embeddings_list,
        metadatas=metadatas
    )

    return True


async def retrieve_semantic(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve relevant chunks using Vector Search.
    Uses run_in_threadpool for the CPU-bound encoding step.
    """
    collection = await run_in_threadpool(get_collection, bot_id)
    
    # Encode query in threadpool
    query_embedding = await run_in_threadpool(model.encode, query)
    query_embedding_list = query_embedding.tolist()
    
    # Query Chroma in threadpool
    results = await run_in_threadpool(
        collection.query,
        query_embeddings=[query_embedding_list],
        n_results=top_k,
        include=["documents"]
    )
    
    return results['documents'][0] if results and results['documents'] else []


async def retrieve_keywords(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve relevant chunks using Keyword Search (PostgreSQL Full-Text).
    Uses standard Postgres FTS (Full-Text Search) for high performance and relevance.
    """
    from app.core.database import db
    
    # We use a raw SQL query to leverage Postgres Full-Text Search
    # websearch_to_tsquery is more user-friendly as it handles quotes/minuses like Google
    raw_query = """
        SELECT content
        FROM document_chunks
        WHERE bot_id = $1
        AND to_tsvector('english', content) @@ websearch_to_tsquery('english', $2)
        LIMIT $3
    """
    
    try:
        results = await db.query_raw(raw_query, bot_id, query, top_k)
        return [r['content'] for r in results]
    except Exception as e:
        # Fallback to simple contains if FTS fails (e.g. if extensions aren't ready)
        logger.error(f"FTS Search failed: {e}. Falling back to simple contains.")
        chunks = await db.documentchunk.find_many(
            where={
                "botId": bot_id,
                "content": {"contains": query, "mode": "insensitive"}
            },
            take=top_k
        )
        return [c.content for c in chunks]


async def hybrid_retrieve(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Combines Semantic Search and Keyword Search (Hybrid Search).
    Both retrievers are now appropriately async-friendly.
    """
    # Run retrieval in parallel for better performance
    semantic_task = retrieve_semantic(bot_id, query, top_k=top_k)
    keyword_task = retrieve_keywords(bot_id, query, top_k=top_k)
    
    semantic_results, keyword_results = await asyncio.gather(semantic_task, keyword_task)
    
    # Combine and Deduplicate (preserving order of semantic first)
    combined = []
    seen = set()
    
    for res in semantic_results + keyword_results:
        if res not in seen:
            combined.append(res)
            seen.add(res)
            
    return combined[:top_k]
