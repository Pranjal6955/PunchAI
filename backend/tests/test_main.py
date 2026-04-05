import pytest

@pytest.mark.asyncio
async def test_root(client):
    """Test the root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "app": "PunchAI API",
        "version": "1.0.0",
        "docs": "/docs",
    }

@pytest.mark.asyncio
async def test_health_check(client):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert data["status"] in ["healthy", "degraded"]
