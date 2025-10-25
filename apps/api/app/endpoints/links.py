import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta

# Import your helpers
from app import crud
from app.db import schemas, models, database
from app.core.security import oauth2_scheme
from app.core.config import settings

router = APIRouter()

# --- Dependency to get DB ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Dependency to get the Current User (from Token) ---
# This is your endpoint protection!

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    """
    Decodes the JWT token, validates it, and returns the user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        # Get the email from the 'sub' (subject) field
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Find the user in the database
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user


# --- Schema for creating a link ---
class LinkCreate(BaseModel):
    original_url: str
    tag: Optional[str] = None
    expires_at: Optional[datetime] = None

# --- Updated Endpoints ---

@router.get("/", response_model=List[schemas.Link]) # Assuming you have a Link schema
async def get_user_links(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Gets all links for the currently logged-in user.
    """
    links = crud.get_links_by_user(db=db, user_id=current_user.id)
    result = []
    now = datetime.utcnow()
    for link in links:
        is_expired = link.expires_at and link.expires_at < now
        expires_in_days = None
        if link.expires_at:
            delta = link.expires_at - now
            expires_in_days = max(delta.days, 0)
    for link in links:
        result.append({
            "id": link.id,
            "original_url": link.original_url,
            "short_code": link.short_code,
            "clicks": len(link.clicks),  # ✅ convert list to int
            "created_at": link.created_at,
            "owner_id": link.owner_id,
            "tag": link.tag,
            "expires_at": link.expires_at,
            "is_expired": is_expired,
            "expires_in_days": expires_in_days
        })
    return result

# --- User deletes
@router.delete("/users/me", status_code=204)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.delete(current_user)
    db.commit()
    return {"message": "User and all related links/clicks deleted successfully."}



@router.post("/", response_model=schemas.Link)
async def create_link(
    link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Set expiration date to None if not provided
    """
    Creates a new short link for the currently logged-in user.
    expiration_date = datetime.utcnow() + timedelta(days=30)
    """
    # ✅ Generate short code using your helper
    short_code = secrets.token_urlsafe(4)

# ✅ Create link with optional tag and expiration date
    new_link = crud.create_db_link(
        db=db,
        original_url=link.original_url,
        user_id=current_user.id,
        tag=link.tag, 
    )
    return new_link



#--- CRUD function for logging clicks ---
@router.delete("/{link_id}", status_code=204)
async def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    success = crud.delete_link(db, link_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found or not authorized to delete"
        )
    db.delete(success)
    db.commit()
    return {"detail": "Link deleted successfully"}
  
  
#--- New Endpoint to Extend Link Expiration ---  
@router.put("/links/{link_id}/extend", response_model=schemas.Link)
def extend_link_expiration(
    link_id: int,
    days: int = 30,  # default extension
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # ✅ Only super admin can extend or reactivate
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Permission denied")

    link.expires_at = datetime.utcnow() + timedelta(days=days)
    db.commit()
    db.refresh(link)
    return link
  
#--- New Endpoint to Get Expired Links (Admin Only) ---
@router.get("/links/expired", response_model=List[schemas.Link])
def get_expired_links(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Permission denied")

    now = datetime.utcnow()
    expired_links = db.query(models.Link).filter(models.Link.expires_at < now).all()
    return expired_links

  
