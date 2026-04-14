from app.core.database import db
from app.services.llm import generate_conversation_insights
from app.core.logging import logger

async def update_chat_insights(chat_id: str):
    """
    Background Task: Fetches full chat history, generates summary/sentiment, and updates DB.
    Only runs if there are enough messages to analyze.
    """
    try:
        # 1. Fetch history
        messages = await db.message.find_many(
            where={"chatId": chat_id},
            order={"createdAt": "asc"}
        )
        
        # Don't waste AI calls on very short chats (e.g., just "hello")
        if len(messages) < 2:
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
        logger.info(f"Updated insights for chat {chat_id}")
    except Exception as e:
        logger.error(f"Failed to update chat insights: {e}")
