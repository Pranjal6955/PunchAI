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
    """Extra cleaning logic for extracted raw text."""
    # Remove multiple newlines, unnecessary whitespace, etc.
    cleaned = " ".join(text.split())
    return cleaned


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


def retrieve_context(bot_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    1. Embed the user query
    2. Search the bot-specific Chroma collection
    3. Return top-K relevant text chunks
    """
    collection = get_collection(bot_id)
    
    # Embed the query
    query_embedding = model.encode(query).tolist()
    
    # Query ChromaDB (returns results sorted by cosine similarity)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )
    
    # Flatten the result list
    retrieved_chunks = []
    if results and results['documents']:
        retrieved_chunks = results['documents'][0]
        
    return retrieved_chunks
