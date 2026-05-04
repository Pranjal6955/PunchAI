"""
ChromaDB vector store configuration for PunchAI RAG system.
"""

import os
import chromadb
from chromadb.config import Settings
from app.core.config import settings
from app.core.logging import logger

CHROMA_DATA_PATH = settings.CHROMA_DATA_PATH
os.makedirs(CHROMA_DATA_PATH, exist_ok=True)

# Initialize persistent Chroma client
client = chromadb.PersistentClient(
    path=CHROMA_DATA_PATH,
    settings=Settings(allow_reset=True, anonymized_telemetry=False)
)


def get_collection(bot_id: str):
    """Get or create a Chroma collection for a specific bot."""
    # We use bot_id as the collection name to isolate data per agent
    return client.get_or_create_collection(
        name=f"bot_{bot_id}",
        metadata={"hnsw:space": "cosine"}  # Use Cosine Similarity for embeddings
    )


def delete_collection(bot_id: str):
    """Delete the collection related to a specific bot."""
    try:
        client.delete_collection(name=f"bot_{bot_id}")
    except Exception as e:
        logger.error(f"Failed to delete Chroma collection for bot {bot_id}: {e}")
        
        
def reset_vector_db():
    """Wipe the entire vector database (use with caution)."""
    client.reset()
