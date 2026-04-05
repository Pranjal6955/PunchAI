import pytest
import uuid
from unittest.mock import patch

@pytest.fixture
async def test_bot(authed_client, user_token):
    """Fixture to create a bot for testing chats."""
    _, user_id = user_token
    bot_payload = {
        "name": f"Chat Test Bot {uuid.uuid4()}",
        "description": "Testing chats",
        "botPersona": "Persona",
        "ownerId": user_id
    }
    response = await authed_client.post("/api/bots/", json=bot_payload)
    return response.json()

@pytest.mark.asyncio
async def test_chat_lifecycle(authed_client, user_token, test_bot):
    """Test starting a chat, adding a message, and listing/deleting."""
    _, user_id = user_token
    bot_id = test_bot["id"]

    # 1. Start Chat
    chat_payload = {
        "title": "My New Chat",
        "userId": user_id,
        "botId": bot_id
    }
    response = await authed_client.post("/api/chats/", json=chat_payload)
    assert response.status_code == 201
    chat_data = response.json()
    assert chat_data["title"] == "My New Chat"
    chat_id = chat_data["id"]

    # 2. Add Message (Mocking LLM and Retrieval)
    with patch("app.api.routes.chats.hybrid_retrieve", return_value=["Mocked knowledge chunk"]), \
         patch("app.api.routes.chats.generate_llm_response", return_value="Hello! I am your AI."):
        
        message_payload = {"content": "Hello bot!"}
        response = await authed_client.post(f"/api/chats/{chat_id}/messages", json=message_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["role"] == "ASSISTANT"
        assert data["content"] == "Hello! I am your AI."

    # 3. List Chats
    response = await authed_client.get(f"/api/chats/?userId={user_id}")
    assert response.status_code == 200
    chats = response.json()["data"]
    assert len(chats) >= 1

    # 4. Get Chat details
    response = await authed_client.get(f"/api/chats/{chat_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["messages"]) >= 2  # USER + ASSISTANT

    # 5. Delete Chat
    response = await authed_client.delete(f"/api/chats/{chat_id}")
    assert response.status_code == 204
