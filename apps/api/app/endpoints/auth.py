import json
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, credentials

# Import all helpers
from app import crud
from app.db import schemas, models
from app.db.database import get_db
from app.core import security
from app.core.email import send_welcome_email, send_verification_email
from app.core.security import create_access_token, verify_verification_token
from app.core.config import settings
from app.endpoints.links import get_current_user
from app.crud import get_user_by_email, create_user
from app.db.schemas import UserCreate
from app.core.security import create_verification_token
from jose import JWTError, jwt

router = APIRouter()


@router.post("/register", response_model=schemas.User)
async def register_user(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Handles user registration.
    """
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user and db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered and active",
        )
        
    if db_user and not db_user.is_active:
      pass
    else:
       db_user = crud.create_user(db=db, user=user)

    token = create_verification_token(email=db_user.email)
    background_tasks.add_task(
        send_verification_email,
        to_email=db_user.email,
        token=token
    )
    
    return db_user
  
@router.get("/verify-email/", status_code=status.HTTP_200_OK)
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Verify a user's email address from the link they click.
    """
    email = verify_verification_token(token)
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )

    user = crud.get_user_by_email(db, email=email)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    if user.is_active:
        return {"message": "Account already verified. You can log in."}

    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "Email verified successfully. You can now log in."}



@router.post("/token")
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    """
    Handles user login and issues a JWT access token.
    'form_data' will contain a 'username' (which is our email) and 'password'.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user. Account has been deactivated.",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.email}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
  

 
@router.get("/me", response_model=schemas.UserOut)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Get the profile for the current logged-in user.
    """
    return current_user

# --- INITIALIZE FIREBASE ADMIN SDK ---
cred_info = json.loads(os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON"))
cred = credentials.Certificate(cred_info)
# Explicitly pass the project_id
firebase_admin.initialize_app(cred, {
    'projectId': cred_info.get('project_id')
})
try:
    if not firebase_admin._apps:
        cred = credentials.ApplicationDefault() 
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized.")
except Exception as e:
    print(f"Error initializing Firebase Admin SDK: {e}")
    print("This is likely a problem with the GOOGLE_APPLICATION_CREDENTIALS secret file.")

class FirebaseToken(BaseModel):
    token: str
    
class Token(BaseModel): 
    access_token: str
    token_type: str = "bearer"



@router.post("/google/", response_model=Token) 
async def login_or_register_with_google(
    token: FirebaseToken,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Receives a Firebase ID token from the frontend, verifies it,
    finds or creates a user, and returns your app's access token.
    """
    try:
        decoded_token = auth.verify_id_token(token.token)
        email = decoded_token.get("email")
        name = decoded_token.get("name", "New User")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Firebase token.",
            )
        user = get_user_by_email(db, email=email)

        if not user:
            print(f"User not found. Creating new user for: {email}")
            random_password = str(uuid.uuid4())  
          
            user_to_create = UserCreate(
                email=email,
                password=random_password)
            user = create_user(db, user=user_to_create) 
            background_tasks.add_task(
                send_welcome_email, 
                to_email=email, 
                name=email.split("@")[0]  
            )
        else:
            print(f"User found: {email}")

        app_access_token = create_access_token(
            data={"sub": user.email, "id": user.id} 
        )

        return {"access_token": app_access_token, "token_type": "bearer"}

    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase token has expired."
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase token."
        )
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred."
        )
        