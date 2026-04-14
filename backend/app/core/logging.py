import sys
from loguru import logger
from app.core.config import settings

def setup_logging():
    """
    Logging & Observability (h):
    Configure structured logging with loguru.
    """
    # Remove default handler
    logger.remove()
    
    # Add stdout handler with specific format
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="DEBUG" if settings.DEBUG else "INFO",
    )
    
    # Add file handler for errors
    logger.add(
        "logs/error.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="10 MB",
        retention="10 days",
    )

    logger.info("Logging initialized with Loguru.")

# Initialize at module level
setup_logging()
