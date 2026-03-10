from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # AI
    groq_api_key: str
    
    # Job Sources
    jsearch_api_key: str = ""
    
    # Email
    resend_api_key: str
    email_from: str
    
    # App
    frontend_url: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()