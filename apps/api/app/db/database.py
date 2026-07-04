import os
import ssl as ssl_lib
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

if SQLALCHEMY_DATABASE_URL.startswith("mysql://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace(
        "mysql://", "mysql+pymysql://", 1
    )

# Strip ?ssl-mode= query param — PyMySQL doesn't support this URL param
if "?" in SQLALCHEMY_DATABASE_URL:
    base_url, _ = SQLALCHEMY_DATABASE_URL.split("?", 1)
    SQLALCHEMY_DATABASE_URL = base_url

# SSL context: connect over TLS but skip server cert verification since we
# don't have Aiven's CA cert bundled in the serverless environment.
_ssl_ctx = ssl_lib.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl_lib.CERT_NONE

# NullPool: no persistent pool — each request opens/closes its own connection.
# Required for serverless (Vercel) where multiple cold-starts would otherwise
# each maintain a pool and exhaust the DB connection limit.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=NullPool,
    connect_args={"connect_timeout": 8, "ssl": _ssl_ctx},
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