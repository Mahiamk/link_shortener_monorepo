import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar, Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "../.env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )
    
    SECRET_KEY: str = "xd5Wg+/OBNiA6AA2Vm6QshwFeOUkHI+KQwdB56aZSeP75mzqoLzzuI/FvToqhJE+"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    SUPERUSER_EMAILS: ClassVar[list[str]] = ["admin@gmail.com"]
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    
    DATABASE_URL: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000"

    # Stripe Settings
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRO_PRICE_ID: str = ""
    STRIPE_ENTERPRISE_PRICE_ID: str = ""

settings = Settings()