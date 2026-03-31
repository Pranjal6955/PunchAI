import pytest
import uuid

@pytest.mark.asyncio
async def test_bot_lifecycle(authed_client, user_token):
    """Test creating, listing, getting, updating, and deleting a bot."""
    _, user_id = user_token
    bot_name = f"Test Bot {uuid.uuid4()}"
    
    # 1. Create Bot
    create_payload = {
        "name": bot_name,
        "description": "A test bot description",
        "botPersona": "You are a test bot.",
        "ownerId": user_id
    }
    response = await authed_client.post("/api/bots/", json=create_payload)
    assert response.status_code == 201
    bot_data = response.json()
    assert bot_data["name"] == bot_name
    bot_id = bot_data["id"]

    # 2. List Bots
    response = await authed_client.get(f"/api/bots/?ownerId={user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any(b["id"] == bot_id for b in data["data"])

    # 3. Get Bot
    response = await authed_client.get(f"/api/bots/{bot_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == bot_name
    assert data["owner"]["id"] == user_id

    # 4. Update Bot
    update_payload = {"name": f"Updated {bot_name}"}
    response = await authed_client.patch(f"/api/bots/{bot_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == f"Updated {bot_name}"

    # 5. Delete Bot
    response = await authed_client.delete(f"/api/bots/{bot_id}")
    assert response.status_code == 204

    # 6. Verify Delete
    response = await authed_client.get(f"/api/bots/{bot_id}")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_bot_for_other_user(authed_client):
    """Test that a user cannot create a bot for someone else."""
    other_user_id = str(uuid.uuid4())
    create_payload = {
        "name": "Intruder Bot",
        "description": "Attempting to create bot for another user",
        "botPersona": "Sneaky",
        "ownerId": other_user_id
    }
    response = await authed_client.post("/api/bots/", json=create_payload)
    assert response.status_code == 403
    assert response.json()["detail"] == "Not authorized to create bot for another user"
