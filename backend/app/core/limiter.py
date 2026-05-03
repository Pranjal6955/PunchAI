from slowapi import Limiter
from fastapi import Request

def get_real_ip(request: Request) -> str:
    """Prioritize X-Forwarded-For for proxy support, fallback to client host."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the list (the actual client)
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# Initialize the limiter
limiter = Limiter(key_func=get_real_ip)
