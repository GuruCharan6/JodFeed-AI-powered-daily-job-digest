from fastapi import Header, HTTPException
from app.database import admin


async def get_current_user(authorization: str = Header(...)):
    """Validate Bearer token via Firebase Admin SDK."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")

    token = authorization.split(" ")[1]

    # CHANGED: early return for empty token to avoid unnecessary SDK call
    if not token or token == "undefined" or token == "null":
        raise HTTPException(401, "Invalid token")

    try:
        user = admin.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(401, "Invalid token")
        return user.user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Unauthorized")
