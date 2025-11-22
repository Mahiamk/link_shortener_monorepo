import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Get DB URL from environment variable, with a default for docker-compose

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")
  
if SQLALCHEMY_DATABASE_URL.startswith("mysql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "mysql://", "mysql+pymysql://", 1
    )

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=10,              # Number of persistent connections
    max_overflow=20,           # Additional connections under high load
    pool_pre_ping=True,        # Verify connection health before use
    pool_recycle=3600,         # Recycle connections after 1 hour
    echo=False                 # Set to True for SQL query logging (dev only)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()