from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import ClassVar
class Settings(BaseSettings):
    # This tells BaseSettings to look for an .env file
    model_config = SettingsConfigDict(
        env_file="../.env", # Path to your .env file
        env_file_encoding='utf-8'
    )
    
    # These variables MUST match the names in .env file
    
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 300
    SUPERUSER_EMAILS: ClassVar[list[str]] = ["admin@gmail.com"]
    GOOGLE_APPLICATION_CREDENTIALS: str = "/Users/anwarmohammedkoji/link-shortener/apps/api/app/credentials/web-app-anwar-firebase-adminsdk-fbsvc-f5cb9d56ee.json"
    
    # DATABASE_URL is already loaded in database.py, but
    # it's good practice to have all env settings here.
    DATABASE_URL: str

# Create a single, importable instance of your settings
settings = Settings()