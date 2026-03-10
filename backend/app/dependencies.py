from fastapi import Header, HTTPException
from app.database import admin


async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    
    token = authorization.split(" ")[1]
    
    try:
        user = admin.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(401, "Invalid token")
        return user.user
    except Exception:
        raise HTTPException(401, "Unauthorized")