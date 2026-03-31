import pytest
import uuid

@pytest.mark.asyncio
async def test_signup_and_login(client):
    """Test user signup and login."""
    unique_email = f"test_{uuid.uuid4()}@example.com"
    signup_payload = {
        "email": unique_email,
        "password": "password123",
        "name": "Test User",
        "avatar": ""
    }

    # Signup
    response = await client.post("/api/auth/signup", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert "accessToken" in data
    assert "tokenType" in data
    assert data["user"]["email"] == unique_email

    # Login
    login_payload = {
        "email": unique_email,
        "password": "password123"
    }
    response = await client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["user"]["email"] == unique_email

@pytest.mark.asyncio
async def test_signup_existing_user(client):
    """Test signup with an existing email."""
    unique_email = f"test_{uuid.uuid4()}@example.com"
    payload = {
        "email": unique_email,
        "password": "password123",
        "name": "Test User"
    }

    # First signup
    await client.post("/api/auth/signup", json=payload)

    # Second signup
    response = await client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "User with this email already exists"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client):
    """Test login with incorrect password."""
    unique_email = f"test_{uuid.uuid4()}@example.com"
    signup_payload = {
        "email": unique_email,
        "password": "password123",
        "name": "Test User"
    }
    await client.post("/api/auth/signup", json=signup_payload)

    login_payload = {
        "email": unique_email,
        "password": "wrongpassword"
    }
    response = await client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
