import pytest
import uuid

@pytest.fixture
async def test_bot(authed_client, user_token):
    """Fixture to create a bot for testing data sources."""
    _, user_id = user_token
    bot_payload = {
        "name": f"DS Test Bot {uuid.uuid4()}",
        "description": "Testing data sources",
        "botPersona": "Test persona",
        "ownerId": user_id
    }
    response = await authed_client.post("/api/bots/", json=bot_payload)
    return response.json()

@pytest.mark.asyncio
async def test_faq_datasource(authed_client, test_bot):
    """Test adding, listing, updating, and deleting FAQs."""
    bot_id = test_bot["id"]
    
    # 1. Add FAQs
    faq_payload = {
        "botId": bot_id,
        "name": "Test FAQ Source",
        "faqs": [
            {"question": "What is PunchAI?", "answer": "An AI platform."},
            {"question": "Is it free?", "answer": "Yes, for now."}
        ]
    }
    response = await authed_client.post("/api/datasources/faq", json=faq_payload)
    assert response.status_code == 200
    ds_data = response.json()
    assert ds_data["name"] == "Test FAQ Source"

    # 2. List FAQs
    response = await authed_client.get(f"/api/datasources/faqs?botId={bot_id}")
    assert response.status_code == 200
    faqs = response.json()
    assert len(faqs) == 2
    faq_id = faqs[0]["id"]

    # 3. Update FAQ
    update_payload = {"answer": "A premium AI platform."}
    response = await authed_client.patch(f"/api/datasources/faqs/{faq_id}", json=update_payload)
    assert response.status_code == 200
    assert response.json()["answer"] == "A premium AI platform."

    # 4. Delete FAQ
    response = await authed_client.delete(f"/api/datasources/faqs/{faq_id}")
    assert response.status_code == 204

    # 5. List sources
    response = await authed_client.get(f"/api/datasources/?botId={bot_id}")
    assert response.status_code == 200
    sources = response.json()["data"]
    assert len(sources) >= 1
    ds_id = sources[0]["id"]

    # 6. Delete source
    response = await authed_client.delete(f"/api/datasources/{ds_id}")
    assert response.status_code == 204
