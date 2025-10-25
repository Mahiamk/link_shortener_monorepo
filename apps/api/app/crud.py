from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .db import models, schemas
from .core.security import get_password_hash
from app.core.config import settings

import secrets




# --- User CRUD (Operations) ---

def get_user_by_email(db: Session, email: str):
    """Fetches a single user by their email address."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Creates a new user in the database."""
    # Get the hashed password
    hashed_password =get_password_hash(user.password)
    # Determine if the user is a superuser
    
    # Create the new User model instance
    db_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        is_superuser=True if user.email in settings.SUPERUSER_EMAILS else False
    )
    
    # Add to session, commit, refresh, and return
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Link CRUD (Skeletons) ---

def get_link_by_short_code(db: Session, short_code: str):
    """Fetches a link by its unique short code."""
    return db.query(models.Link).filter(models.Link.short_code == short_code).first()

def create_db_link(db: Session, original_url: str, user_id: int, tag: str | None = None):
    """Creates a new short link in the database."""
    short_code = secrets.token_urlsafe(4)
    expires_at = datetime.utcnow() + timedelta(days=30)  # 🔥 Expiration date = 30 days
    db_link = models.Link(original_url=original_url, short_code=short_code, owner_id=user_id, tag=tag, expires_at=expires_at)
    
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return {
        "id": db_link.id,
        "original_url": db_link.original_url,
        "short_code": db_link.short_code,
        "owner_id": db_link.owner_id,
        "created_at": db_link.created_at,
        "clicks": len(db_link.clicks),  # ✅ number of clicks
        "tag": db_link.tag,  # ✅ include tag
        "expires_at": db_link.expires_at  # ✅ include expiration date
    }
  
  
def get_link_with_click_count(db: Session, link_id: int):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if link is None:
        return None
    link.clicks = len(link.clicks)  # count the Click objects
    return link

# --- Click CRUD (Skeleton) ---

def log_click(db, link: models.Link):
    click = models.Click(link_id=link.id)
    db.add(click)
    db.commit()
    db.refresh(click)
    return click

def create_click_log(db: Session, link_id: int, ip_address: str | None = None):
    """Logs a new click for a specific link."""
    db_log = models.Click(link_id=link_id, ip_address=ip_address)
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
    # 1. Create a new models.Click object
    # 2. Add, commit, refresh
    
def get_links_by_user(db: Session, user_id: int):
    return db.query(models.Link).filter(models.Link.owner_id == user_id).all()
# def get_clicks_by_link(db: Session, link_id: int):
#     return db.query(models.Click).filter(models.Click.link_id == link_id).all()
  
  