import asyncio
from prisma import Prisma

async def main():
    prisma = Prisma()
    await prisma.connect()
    
    # Update bots where engine or type is NULL
    # Prisma for Python uses 'None' for NULL
    count = await prisma.chatbot.update_many(
        where={
            "OR": [
                {"engine": None},
                {"type": None}
            ]
        },
        data={
            "engine": "google",
            "type": "gemini-1.5-flash"
        }
    )
    
    print(f"Updated {count} bots with default values.")
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
