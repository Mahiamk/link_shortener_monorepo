import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from urllib.parse import urlparse

# Import helpers
from app import crud
from app.db import schemas, models, database
from app.core.security import oauth2_scheme
from app.core.config import settings
from app.core.limiter import limiter

router = APIRouter()

from app.db.database import get_db

# --- Dependency to get the Current User (from Token) ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: Session = Depends(get_db)
) -> models.User:
    """
    Decodes the JWT token, validates it, and returns the active user.
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
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user. Account has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user

# --- Schema for creating a link ---
class LinkCreate(BaseModel):
    original_url: str
    tag: Optional[str] = None


# ── Public (unauthenticated) endpoints ────────────────────────────────────────

class PublicShortenRequest(BaseModel):
    url: str


@router.post("/public/shorten", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/hour")
async def public_shorten_link(
    request: Request,
    data: PublicShortenRequest,
    db: Session = Depends(get_db),
):
    """Shorten a URL without authentication. Rate-limited per IP."""
    if len(data.url) > 8192:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is too long (max 8192 characters).",
        )
    try:
        parsed = urlparse(data.url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Must start with http:// or https://",
        )

    short_code = secrets.token_urlsafe(6)
    while crud.get_link_by_short_code(db, short_code):
        short_code = secrets.token_urlsafe(6)

    db_link = models.Link(
        original_url=data.url,
        short_code=short_code,
        owner_id=None,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(db_link)
    db.commit()

    return {"short_code": short_code}


@router.get("/public/stats")
def get_public_stats(db: Session = Depends(get_db)):
    """Returns total link and click counts for public display. No auth required."""
    return {
        "total_links":  crud.get_link_count(db),
        "total_clicks": crud.get_click_count(db),
    }


# ── Authenticated endpoints ────────────────────────────────────────────────────

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
    if len(link.original_url) > 8192:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL is too long (max 8192 characters).",
        )
    try:
        parsed = urlparse(link.original_url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Must start with http:// or https://",
        )

    new_link = crud.create_db_link(
        db=db,
        original_url=link.original_url,
        user_id=current_user.id,
        tag=link.tag, 
    )
    return crud.convert_db_link_to_schema(new_link)

@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link_endpoint(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Deletes a link owned by the current user.
    """
    deleted = crud.delete_link(db, link_id, current_user.id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found or you do not have permission to delete it"
        )
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
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Superuser permissions required"
        )

    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

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
    Gets all expired links for the current user (or all if superuser).
    """
    now = datetime.utcnow()
    if current_user.is_superuser:
        expired_links = db.query(models.Link).filter(models.Link.expires_at < now).all()
    else:
        expired_links = db.query(models.Link).filter(
            models.Link.owner_id == current_user.id,
            models.Link.expires_at < now
        ).all()
    
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
    current_user: models.User = Depends(get_current_user)
):
    """
    Gets detailed click statistics for a single link owned by the user (or any link if superuser).
    """
    if current_user.is_superuser:
        link = db.query(models.Link).filter(models.Link.id == link_id).first()
    else:
        link = crud.get_link_by_id_and_owner(db, link_id, current_user.id)

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found or access denied"
        )

    clicks = link.clicks or []
    total_clicks = len(clicks)

    def group_by(clicks_list, attr):
        result = {}
        for c in clicks_list:
            key = getattr(c, attr) or "unknown"
            result[key] = result.get(key, 0) + 1
        return result

    return {
        "short_code": link.short_code,
        "original_url": link.original_url,
        "target_url": link.original_url,
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
