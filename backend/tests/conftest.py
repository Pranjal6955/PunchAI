import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from app.main import app
from app.core.database import db

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def test_app():
    """Fixture that handles the app lifecycle."""
    async with LifespanManager(app) as manager:
        yield manager.app

@pytest.fixture(scope="session")
async def client(test_app):
    """Fixture that providing an async client for the app."""
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        yield client

@pytest.fixture(scope="session")
async def user_token(client):
    """Fixture to create a test user and return an access token."""
    import uuid
    unique_email = f"test_{uuid.uuid4()}@example.com"
    signup_payload = {
        "email": unique_email,
        "password": "password123",
        "name": "Test User",
        "avatar": ""
    }
    response = await client.post("/api/auth/signup", json=signup_payload)
    data = response.json()
    return data["accessToken"], data["user"]["id"]

@pytest.fixture(scope="session")
async def authed_client(test_app, user_token):
    """Fixture providing an authenticated async client."""
    token, _ = user_token
    async with AsyncClient(
        transport=ASGITransport(app=test_app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"}
    ) as client:
        yield client
