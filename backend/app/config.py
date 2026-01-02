from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    database_url: str
    gemini_api_key: str
    openai_api_key: str | None = None
    jwt_secret: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    log_level: str = "INFO"
    
    # Email Configuration
    EMAIL_FROM: str = "noreply@bondpath.com"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025  # Use 1025 for local testing with MailHog
    SMTP_TLS: bool = False
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

settings = Settings()
