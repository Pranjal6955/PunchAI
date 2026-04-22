import time
import asyncio
import statistics
import numpy as np
from typing import List
from app.services.processor import model, hybrid_retrieve, process_and_store
from app.services.llm import generate_llm_response, generate_groq_response, build_rag_prompt
from app.core.database import db

async def benchmark_embeddings():
    print("\n--- Benchmarking Embeddings (all-MiniLM-L6-v2) ---")
    test_texts = [
        "Short sentence.",
        "A medium length paragraph describing the features of PunchAI, an AI-powered platform for building custom bots and managing knowledge bases efficiently.",
        "A long text block " + "with many words " * 50
    ]
    
    for i, text in enumerate(test_texts):
        latencies = []
        for _ in range(10):
            start = time.perf_counter()
            _ = model.encode([text])
            latencies.append(time.perf_counter() - start)
        
        avg = statistics.mean(latencies) * 1000
        print(f"Size {i+1} ({len(text)} chars): Avg {avg:.2f}ms")

async def benchmark_retrieval():
    print("\n--- Benchmarking Retrieval ---")
    # Note: Requires some data in the DB/Chroma for the bot
    # We'll try to find a bot with some chunks
    bots = await db.bot.find_many(take=1)
    if not bots:
        print("No bots found. Skipping retrieval benchmark.")
        return
    
    bot_id = bots[0].id
    query = "What is PunchAI?"
    
    # 1. Semantic
    from app.services.processor import retrieve_semantic
    latencies = []
    for _ in range(5):
        start = time.perf_counter()
        await retrieve_semantic(bot_id, query)
        latencies.append(time.perf_counter() - start)
    print(f"Semantic Retrieval: Avg {statistics.mean(latencies)*1000:.2f}ms")
    
    # 2. Keyword
    from app.services.processor import retrieve_keywords
    latencies = []
    for _ in range(5):
        start = time.perf_counter()
        await retrieve_keywords(bot_id, query)
        latencies.append(time.perf_counter() - start)
    print(f"Keyword Retrieval: Avg {statistics.mean(latencies)*1000:.2f}ms")
    
    # 3. Hybrid
    latencies = []
    for _ in range(5):
        start = time.perf_counter()
        await hybrid_retrieve(bot_id, query)
        latencies.append(time.perf_counter() - start)
    print(f"Hybrid Retrieval: Avg {statistics.mean(latencies)*1000:.2f}ms")

async def benchmark_llm():
    print("\n--- Benchmarking LLM (OpenRouter & Groq) ---")
    prompt = "Explain RAG in one sentence."
    
    # OpenRouter
    try:
        start = time.perf_counter()
        res = await generate_llm_response(prompt)
        print(f"OpenRouter Latency: {time.perf_counter() - start:.2f}s")
    except Exception as e:
        print(f"OpenRouter Failed: {e}")
        
    # Groq (Direct)
    try:
        start = time.perf_counter()
        res = await generate_groq_response(prompt)
        print(f"Groq Latency: {time.perf_counter() - start:.2f}s")
    except Exception as e:
        print(f"Groq Failed: {e}")

async def main():
    await db.connect()
    try:
        await benchmark_embeddings()
        await benchmark_retrieval()
        await benchmark_llm()
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
