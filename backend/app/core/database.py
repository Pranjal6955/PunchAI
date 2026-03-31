"""
Prisma database client — singleton pattern with async lifecycle.
"""

from prisma import Prisma

# Single Prisma client instance shared across the application.
db = Prisma()


async def connect_db() -> None:
    """Connect to the Neon PostgreSQL database."""
    await db.connect()
    print("✅  Connected to Neon PostgreSQL via Prisma")


async def disconnect_db() -> None:
    """Gracefully disconnect from the database."""
    await db.disconnect()
    print("🔌  Disconnected from database")
