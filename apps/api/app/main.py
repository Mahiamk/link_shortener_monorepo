import os
import logging
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.core.config import settings
from app.endpoints import auth, links, admin, analysis, redirect, contact

# Configure server logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("linkshortener.api")

app = FastAPI(
    title="Link Shortener API",
    description="API for managing link shortener",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter

# --- Safe Global Exception Handlers (Prevent Information Disclosure) ---

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    headers = getattr(exc, "headers", None)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers
    )

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Request validation failed on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid request payload."}
    )

@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request: Request, exc: ResponseValidationError):
    logger.error("Response validation failed on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )


# --- CORS Middleware ---

allowed_origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://linkyshorty.vercel.app",
    "https://frontend-web-th5x.onrender.com",
]

frontend_env = os.getenv("FRONTEND_URL")
if frontend_env and frontend_env not in allowed_origins:
    allowed_origins.append(frontend_env)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Health & Root Endpoints ---

@app.get("/")
async def root():
    return {"message": "Welcome to the LinkShorty API!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


# --- Include Routers ---

app.include_router(contact.router, prefix="/api", tags=["Contact"]) 
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])  
app.include_router(links.router, prefix="/links", tags=["Links"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(redirect.router)
