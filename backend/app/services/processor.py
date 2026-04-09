"""
Document Preprocessing Pipeline: Clean -> Chunk -> Embed -> Store.
Uses SentenceTransformers for local embedding generation.
"""

from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.core.vector_store import get_collection

# Initialize embedding model (free, locally running)
# 'all-MiniLM-L6-v2' is fast and accurate for general RAG tasks.
model = SentenceTransformer('all-MiniLM-L6-v2')

# Configure text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=100,
    separators=["\n\n", "\n", " ", ""]
)


def clean_text(text: str) -> str:
    """Extra cleaning logic for extracted raw text while preserving structure."""
    import re
    # Normalize horizontal whitespace (tabs/multiple spaces) to single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalize multiple blank lines to exactly two newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


def process_and_store(
    bot_id: str, 
    source_id: str, 
    raw_text: str, 
    metadata: Dict[str, Any] = None
):
    """
    Main Preprocessing Pipeline:
    1. Clean text
    2. Chunk into smaller pieces
    3. Generate Embeddings (handled by Chroma)
    4. Store in ChromaDB
    """
    if not raw_text.strip():
        return False

    # 1. Cleaning
    clean_content = clean_text(raw_text)
    
    # 2. Chunking
    chunks: List[str] = text_splitter.split_text(clean_content)
    
    if not chunks:
        return False

    # 3. Embedding & 4. Vector Storage
    collection = get_collection(bot_id)
    
    # Prepare IDs and Metadatas for Chroma
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]
    metadatas = []
    for i in range(len(chunks)):
        meta = metadata.copy() if metadata else {}
        meta.update({"source_id": source_id, "bot_id": bot_id, "chunk_index": i})
        metadatas.append(meta)

    # Note: Chroma handles the embedding internally via 'all-MiniLM-L6-v2' 
    # if we point its 'embedding_function' to it, but for explicit control:
    embeddings = model.encode(chunks).tolist()
    
    collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

    return True


def retrieve_semantic(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """Retrieve relevant chunks using Vector Search (ChromaDB)."""
    collection = get_collection(bot_id)
    query_embedding = model.encode(query).tolist()
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents"]
    )
    
    return results['documents'][0] if results and results['documents'] else []


async def retrieve_keywords(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """Retrieve relevant chunks using Keyword Search (PostgreSQL Full-Text)."""
    from app.core.database import db
    
    # We use a case-insensitive search across chunks belonging to the bot.
    # For a production setup, consider using Postgres tsvector/tsquery for better BM25.
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
    Removes duplicates and returns the best top-K chunks.
    """
    # 1. Semantic (Vector)
    semantic_results = retrieve_semantic(bot_id, query, top_k=top_k)
    
    # 2. Keyword (SQL)
    keyword_results = await retrieve_keywords(bot_id, query, top_k=top_k)
    
    # 3. Combine and Deduplicate (preserving order of semantic first)
    combined = []
    seen = set()
    
    for res in semantic_results + keyword_results:
        if res not in seen:
            combined.append(res)
            seen.add(res)
            
    return combined[:top_k]
