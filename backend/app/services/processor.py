import re
import asyncio
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, CrossEncoder
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.vector_store import get_collection
from fastapi.concurrency import run_in_threadpool
from app.core.logging import logger
from prisma import Json

# Initialize embedding model (free, locally running)
model = SentenceTransformer('all-MiniLM-L6-v2')
# Initialize re-ranker model (Small but powerful cross-encoder)
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

# Configure text splitter for chunking
# Reduced chunk_size to 800 to safely fit within the 256-token limit of MiniLM
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=200,
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
    1. Cleans text.
    2. Split into small chunks.
    3. Stores chunks in Postgres (for Keyword Search).
    4. Generates embeddings and stores in Chroma (for Semantic Search).
    """
    if not raw_text.strip():
        return False

    # 1. Cleaning (Sanitization)
    clean_content = clean_text(raw_text)
    
    # 2. Chunking
    chunks: List[str] = text_splitter.split_text(clean_content)
    
    if not chunks:
        return False

    # 3. SQL Storage (Postgres) - Optimized: Sync small chunks to Postgres in bulk
    from app.core.database import db
    try:
        # Bulk create chunks to minimize DB roundtrips
        chunk_data = [
            {
                "content": chunk,
                "sourceId": source_id,
                "botId": bot_id,
                "metadata": Json(metadata) if metadata else None
            }
            for chunk in chunks
        ]
        await db.documentchunk.create_many(data=chunk_data)
    except Exception as e:
        logger.error(f"Failed to sync chunks to Postgres: {e}")
        pass

    # 4. Vector Storage (Chroma)
    collection = await run_in_threadpool(get_collection, bot_id)
    
    # Prepare IDs and Metadatas for Chroma
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]
    metadatas = []
    for i in range(len(chunks)):
        meta = metadata.copy() if metadata else {}
        meta.update({"source_id": source_id, "bot_id": bot_id, "chunk_index": i})
        metadatas.append(meta)

    # 5. Explicit Embedding Generation (CPU-bound)
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


async def update_single_chunk_vector(bot_id: str, source_id: str, chunk_id: str, content: str, index: int):
    """
    Syncs a single chunk edit to ChromaDB.
    """
    collection = await run_in_threadpool(get_collection, bot_id)
    
    # We must re-generate the embedding for the new content
    embedding = await run_in_threadpool(model.encode, content)
    embedding_list = embedding.tolist()
    
    # Use the consistent ID format: {source_id}_{index}
    vector_id = f"{source_id}_{index}"
    
    await run_in_threadpool(
        collection.update,
        ids=[vector_id],
        documents=[content],
        embeddings=[embedding_list]
    )
    logger.info(f"Synchronized chunk {vector_id} update to Chroma")


async def delete_single_chunk_vector(bot_id: str, source_id: str, index: int):
    """
    Removes a single chunk from ChromaDB.
    """
    collection = await run_in_threadpool(get_collection, bot_id)
    vector_id = f"{source_id}_{index}"
    
    await run_in_threadpool(
        collection.delete,
        ids=[vector_id]
    )
    logger.info(f"Deleted chunk {vector_id} from Chroma")


async def retrieve_semantic(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve relevant chunks using Vector Search.
    Includes a Similarity Guard (distance threshold).
    """
    collection = await run_in_threadpool(get_collection, bot_id)
    
    # Encode query in threadpool
    query_embedding = await run_in_threadpool(model.encode, query)
    query_embedding_list = query_embedding.tolist()
    
    # Query Chroma — distance (cosine) is 0 for match, 2 for opposite
    results = await run_in_threadpool(
        collection.query,
        query_embeddings=[query_embedding_list],
        n_results=top_k,
        include=["documents", "distances"]
    )
    
    if not results or not results['documents']:
        return []

    # Similarity Guard: Filter out chunks with high distance (low confidence)
    # 0.6 is a balanced threshold for all-MiniLM-L6-v2 cosine distance
    THRESHOLD = 0.6
    
    filtered_docs = []
    docs = results['documents'][0]
    distances = results['distances'][0]
    
    for doc, dist in zip(docs, distances):
        if dist <= THRESHOLD:
            filtered_docs.append(doc)
        else:
            logger.debug(f"Chunk discarded due to low similarity (dist: {dist:.4f})")
            
    return filtered_docs


async def retrieve_keywords(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Retrieve relevant chunks using Keyword Search (PostgreSQL Full-Text).
    """
    if not query or len(query.strip()) < 2:
        return []
        
    async def _fetch():
        from app.core.database import db
        raw_query = """
            SELECT content
            FROM document_chunks
            WHERE bot_id = $1
            AND to_tsvector('english', content) @@ websearch_to_tsquery('english', $2)
            LIMIT $3
        """
        results = await db.query_raw(raw_query, bot_id, query, top_k)
        return [r['content'] for r in results]

    try:
        # P0 Enhancement: 1.5s timeout to prevent the 8s stalling observed in benchmarks
        return await asyncio.wait_for(_fetch(), timeout=1.5)
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning(f"Keyword search (FTS) bypassed or failed: {type(e).__name__}")
        return []


async def hybrid_retrieve(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Combines Semantic Search and Keyword Search (Hybrid Search) with Re-ranking.
    1. Retrieves candidates using Semantic (Chroma) and Keyword (Postgres).
    2. Interleaves top candidates.
    3. Re-ranks candidates using a Cross-Encoder for maximum accuracy.
    """
    # 1. Run retrieval in parallel (Top-K*2 to have enough candidates for re-ranking)
    candidate_k = top_k * 2
    semantic_task = retrieve_semantic(bot_id, query, top_k=candidate_k)
    keyword_task = retrieve_keywords(bot_id, query, top_k=candidate_k)
    
    semantic_results, keyword_results = await asyncio.gather(semantic_task, keyword_task)
    
    # 2. Balanced Interweaving to get a candidate pool
    candidates = []
    seen = set()
    
    for i in range(candidate_k):
        if i < len(semantic_results):
            chunk = semantic_results[i]
            if chunk not in seen:
                candidates.append(chunk)
                seen.add(chunk)
        
        if i < len(keyword_results):
            chunk = keyword_results[i]
            if chunk not in seen:
                candidates.append(chunk)
                seen.add(chunk)
    
    if not candidates:
        return []

    # 3. P1 Enhancement: Cross-Encoder Re-ranking
    # We score each (query, candidate) pair
    pairs = [[query, cand] for cand in candidates]
    
    # Run scoring in threadpool (CPU bound)
    scores = await run_in_threadpool(reranker.predict, pairs)
    
    # Combine and sort by score (descending)
    scored_candidates = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)
    
    # Return top_k
    return [c for c, s in scored_candidates[:top_k]]
