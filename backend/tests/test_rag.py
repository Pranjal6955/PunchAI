import asyncio
import pytest
from app.services.processor import hybrid_retrieve
from app.services.llm import generate_llm_response, build_rag_prompt
from app.core.database import db

@pytest.mark.asyncio
async def test_rag_flow():
    """
    Basic RAG flow integration test.
    Verifies that retrieval and generation are working together.
    """
    # 1. Look for an existing bot with data
    bot = await db.bot.find_first(where={"dataSources": {"some": {}}})
    if not bot:
        pytest.skip("No bot with data sources found for RAG test")
    
    question = "What is the main topic of the uploaded documents?"
    
    # 2. Retrieve
    retrieval = await hybrid_retrieve(bot_id=bot.id, query=question, top_k=3)
    assert isinstance(retrieval, dict)
    context = retrieval["chunks"]
    assert isinstance(context, list)
    
    # 3. Generate
    prompt = build_rag_prompt(persona=bot.botPersona, context=context, question=question)
    ai_text, usage = await generate_llm_response(prompt)
    
    assert ai_text is not None
    assert len(ai_text) > 10
    print(f"\nQuestion: {question}")
    print(f"Retrieved {len(context)} chunks")
    print(f"Response: {ai_text[:100]}...")

# RAGAS Automated Evaluation script (Manual trigger or CI)
async def run_ragas_eval(bot_id: str):
    try:
        from ragas import evaluate
        from ragas.metrics import faithfulness, answer_relevancy
        from datasets import Dataset
    except ImportError:
        print("RAGAS or datasets not installed")
        return

    # Sample test set
    test_queries = [
        "Summarize the key information.",
        "What are the specific details mentioned in the documents?",
    ]

    results_data = {
        "question": [],
        "answer": [],
        "contexts": [],
    }

    print(f"Starting RAGAS evaluation for bot {bot_id}...")
    
    for query in test_queries:
        retrieval = await hybrid_retrieve(bot_id, query, top_k=3)
        context = retrieval["chunks"]
        prompt = build_rag_prompt(persona=None, context=context, question=query)
        answer, _ = await generate_llm_response(prompt)
        
        results_data["question"].append(query)
        results_data["answer"].append(answer)
        results_data["contexts"].append(context)

    dataset = Dataset.from_dict(results_data)
    
    # Note: evaluate() typically requires OPENAI_API_KEY for its default models
    # To use Groq/OpenRouter, we'd need to configure Langchain wrappers.
    # For now, we print the collected data for manual review if API is missing.
    try:
        # result = evaluate(dataset, metrics=[faithfulness, answer_relevancy])
        # print("RAGAS Results:", result)
        print("Evaluation data collected successfully.")
    except Exception as e:
        print(f"LLM-based evaluation failed (likely missing OpenAI key): {e}")

if __name__ == "__main__":
    # Example usage: python -m tests.test_rag <bot_id>
    import sys
    if len(sys.argv) > 1:
        asyncio.run(run_ragas_eval(sys.argv[1]))
