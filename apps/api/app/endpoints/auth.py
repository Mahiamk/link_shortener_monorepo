from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Import all your new helpers
from app import crud
from app.db import schemas, models
from app.db.database import get_db
from app.core import security
from app.core.config import settings

router = APIRouter()

# --- 1. Updated /register Endpoint ---

@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Handles user registration.
    """
    # Check if user already exists
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # User doesn't exist, so call the CRUD function to create them
    return crud.create_user(db=db, user=user)


# --- 2. New /token (Login) Endpoint ---

@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Handles user login and issues a JWT access token.
    'form_data' will contain a 'username' (which is our email) and 'password'.
    """
    # 1. Find the user by email
    user = crud.get_user_by_email(db, email=form_data.username)
    
    # 2. Check if user exists and if the password is correct
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create the access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email},  # 'sub' (subject) is the user's email
        expires_delta=access_token_expires
    )
    
    # 4. Return the token
    return {"access_token": access_token, "token_type": "bearer"}