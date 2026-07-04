import os
import socket as _socket
import ssl as _ssl_module
from urllib.parse import urlparse as _urlparse
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
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

if "?" in SQLALCHEMY_DATABASE_URL:
    base_url, _ = SQLALCHEMY_DATABASE_URL.split("?", 1)
    SQLALCHEMY_DATABASE_URL = base_url

# On Vercel/Lambda Python 3.12, socket.getaddrinfo called from worker threads
# (anyio thread pool) fails with EBUSY. Fix: resolve DNS once in the main thread
# at import time, cache the result, and monkey-patch getaddrinfo so worker threads
# hit the cache instead of calling the OS resolver.
_dns_cache: dict = {}
_original_getaddrinfo = _socket.getaddrinfo

def _cached_getaddrinfo(host, port, family=0, socktype=0, proto=0, flags=0):
    cached = _dns_cache.get((host, port))
    if cached is not None:
        return cached
    return _original_getaddrinfo(host, port, family, socktype, proto, flags)

_dns_prefetch_error: str = ""
try:
    _parsed = _urlparse(SQLALCHEMY_DATABASE_URL)
    _db_host = _parsed.hostname
    _db_port = _parsed.port or 3306
    _resolved = _original_getaddrinfo(_db_host, _db_port, _socket.AF_INET, _socket.SOCK_STREAM)
    _dns_cache[(_db_host, _db_port)] = _resolved
    _socket.getaddrinfo = _cached_getaddrinfo
except Exception as _e:
    _dns_prefetch_error = str(_e)

# Create SSLContext in the main thread — creating ssl.SSLContext in Lambda worker
# threads on Python 3.12 can also trigger EBUSY. Reusing a main-thread context
# is safe; SSLContext objects are thread-safe.
_ssl_ctx = _ssl_module.SSLContext(_ssl_module.PROTOCOL_TLS_CLIENT)
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = _ssl_module.CERT_NONE

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=NullPool,
    connect_args={"connect_timeout": 8, "ssl": _ssl_ctx},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
