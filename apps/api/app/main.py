from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import os
from datetime import datetime
from jose import jwt
from typing import List, Optional

from app.db.database import get_db, engine, Base
from app.db.models import User
from app.core.config import settings
from app.endpoints import auth, links, redirect

#create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Link Shortener API",
    description="API for managing link shortener",
    version="1.0.0"
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "https://yourdomain.com",
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
  
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(links.router, prefix="/links", tags=["Links"])
app.include_router(redirect.router)
