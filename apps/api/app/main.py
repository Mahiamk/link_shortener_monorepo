from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from slowapi.errors import RateLimitExceeded 
from app.core.limiter import limiter
import os
from datetime import datetime
from jose import jwt
from typing import List, Optional


from app.db.database import get_db, engine, Base
from app.db.models import User
from app.core.config import settings
from app.endpoints import auth, links, admin, analysis, redirect, contact

#create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Link Shortener API",
    description="API for managing link shortener",
    version="1.0.0"
)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"}
    )

origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://frontend-web-th5x.onrender.com",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.ADMIN_JWT_SECRET, algorithms=["HS256"])
        if payload.get("role") != "admin":
            raise HTTPException(
              status_code=status.HTTP_403_FORBIDDEN, 
              detail="Invalid authentication credentials"
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED, 
          detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
          status_code=status.HTTP_401_UNAUTHORIZED, 
          detail="Invalid token"
        )
        
@app.get("/")
async def root():
    return {"message": "Link Shortener API is running."}
  
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(datetime.astimezone.utc)}
  
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the LinkShorty API!"}
 
app.include_router(contact.router, prefix="/api", tags=["Contact"]) 
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])  
app.include_router(links.router, prefix="/links", tags=["Links"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
app.include_router(redirect.router)

