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
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
        
    return user

# --- Schema for creating a link ---
class LinkCreate(BaseModel):
    original_url: str
    tag: Optional[str] = None

# --- Endpoints ---

@router.get("/", response_model=List[schemas.Link])
async def get_user_links(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Gets all links for the currently logged-in user.
    """
    links = crud.get_links_by_user(db=db, user_id=current_user.id)
    
    return crud.convert_db_links_to_schemas(links)

@router.post("/", response_model=schemas.Link)
async def create_link(
    link: LinkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Creates a new short link for the currently logged-in user.
    """
    new_link = crud.create_db_link(
        db=db,
        original_url=link.original_url,
        user_id=current_user.id,
        tag=link.tag, 
    )
    return crud.convert_db_link_to_schema(new_link)

@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes a link owned by the current user.
    """
    link_to_delete = crud.get_link_by_id_and_owner(db, link_id, current_user.id)
    
    if not link_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found or you do not have permission to delete it"
        )
    
    db.delete(link_to_delete)
    db.commit()
    return 

@router.put("/{link_id}/extend", response_model=schemas.Link)
def extend_link_expiration(
    link_id: int,
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Extends a link's expiration date (Superuser only).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Permission denied")

    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    link.expires_at = datetime.utcnow() + timedelta(days=days)
    db.commit()
    db.refresh(link)
    
    return crud.convert_db_link_to_schema(link)
  
@router.get("/expired", response_model=List[schemas.Link])
def get_expired_links(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Gets all expired links (Superuser only).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Permission denied")

    now = datetime.utcnow()
    expired_links = db.query(models.Link).filter(models.Link.expires_at < now).all()
    
    return crud.convert_db_links_to_schemas(expired_links)

@router.get("/active", response_model=List[schemas.Link])
def get_active_links(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    Gets all active (non-expired) links for the current user.
    """
    current_time = datetime.utcnow()
    links = (
        db.query(models.Link)
        .filter(models.Link.owner_id == current_user.id)
        .filter((models.Link.expires_at == None) | (models.Link.expires_at > current_time))
        .all()
    )
    return crud.convert_db_links_to_schemas(links)

@router.get("/{link_id}/stats")
def get_link_stats(
    link_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Gets detailed click statistics for a single link.
    """
    link = crud.get_link_by_id_and_owner(db, link_id, current_user.id)
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized or link not found")

    clicks = link.clicks
    total_clicks = len(clicks)

    def group_by(clicks_list, attr):
        result = {}
        for c in clicks_list:
            key = getattr(c, attr) or "unknown"
            result[key] = result.get(key, 0) + 1
        return result

    return {
        "short_code": link.short_code,
        "total_clicks": total_clicks,
        "tag": link.tag,
        "created_at": link.created_at,
        "last_clicked_at": max([c.created_at for c in clicks]) if clicks else None,
        "by_country": group_by(clicks, "country"),
        "by_referrer": group_by(clicks, "referrer"),
        "by_browser": group_by(clicks, "browser"),
        "by_device": group_by(clicks, "device_type"),
    }

@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Deletes the current user and all their associated data."""
    db.delete(current_user)
    db.commit()
    return

