"""
Simple in-memory rate-limiting middleware using SlowAPI.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


def setup_rate_limiter(app: FastAPI) -> None:
    """Attach the rate limiter to the FastAPI application."""
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={
                "error": "rate_limit_exceeded",
                "detail": f"Rate limit exceeded. Try again later.",
            },
        )
