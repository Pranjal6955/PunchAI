from app.core.database import db
from app.services.llm import generate_conversation_insights
from app.core.logging import logger


async def update_chat_insights(chat_id: str):
    """
    Background Task: Fetches full chat history, generates summary/sentiment, and updates DB.

    Guards:
    - Requires at least 4 messages for reliable signal.
    - Only re-analyzes every 4 messages to avoid wasteful LLM calls on every reply.
    """
    try:
        # 1. Fetch history
        messages = await db.message.find_many(
            where={"chatId": chat_id},
            order={"createdAt": "asc"}
        )

        msg_count = len(messages)

        # Require at least 4 messages (2 user + 2 assistant) for meaningful signal
        if msg_count < 4:
            return

        # Re-analyze every 4 messages (not on every single reply) to reduce LLM cost
        # Always analyze when count is exactly 4, 8, 12, ... or when it's the latest pair
        if msg_count > 4 and msg_count % 4 != 0:
            return

        # 2. Generate Insights
        insights = await generate_conversation_insights(messages)

        # 3. Update Chat record
        await db.chat.update(
            where={"id": chat_id},
            data={
                "summary": insights.get("summary"),
                "sentiment": insights.get("sentiment")
            }
        )
        logger.info(f"Updated insights for chat {chat_id} | {msg_count} msgs | sentiment={insights.get('sentiment')}")
    except Exception as e:
        logger.error(f"Failed to update chat insights: {e}")

