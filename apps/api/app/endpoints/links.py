from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    
    return crud.convert_db_links_to_schemas(links, db=db)

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
    return crud.convert_db_link_to_schema(new_link, db=db)

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
    
    return crud.convert_db_link_to_schema(link, db=db)
  
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
    
    return crud.convert_db_links_to_schemas(expired_links, db=db)

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
    return crud.convert_db_links_to_schemas(links, db=db)

@router.get("/{link_id}/stats")
def get_link_stats(
    link_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    """
    Gets detailed click statistics for a single link using efficient SQL aggregation.
    """
    # First verify the link belongs to the user (no need to load clicks)
    link = db.query(models.Link).filter(
        models.Link.id == link_id, 
        models.Link.owner_id == current_user.id
    ).first()
    
    if not link:
        raise HTTPException(status_code=403, detail="Not authorized or link not found")

    # Efficient SQL aggregation for total clicks
    total_clicks = db.query(func.count(models.Click.id)).filter(
        models.Click.link_id == link_id
    ).scalar() or 0

    # Get last clicked timestamp efficiently
    last_clicked = db.query(func.max(models.Click.created_at)).filter(
        models.Click.link_id == link_id
    ).scalar()

    # Efficient SQL aggregation for breakdowns
    def get_breakdown(column):
        results = (
            db.query(column, func.count(models.Click.id).label('count'))
            .filter(models.Click.link_id == link_id)
            .group_by(column)
            .all()
        )
        return {(key or "unknown"): count for key, count in results}

    return {
        "short_code": link.short_code,
        "total_clicks": total_clicks,
        "tag": link.tag,
        "created_at": link.created_at,
        "last_clicked_at": last_clicked,
        "by_country": get_breakdown(models.Click.country),
        "by_referrer": get_breakdown(models.Click.referrer),
        "by_browser": get_breakdown(models.Click.browser),
        "by_device": get_breakdown(models.Click.device_type),
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

