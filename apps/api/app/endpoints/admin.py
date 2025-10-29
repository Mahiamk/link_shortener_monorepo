from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app import crud
from app.db import schemas, models, database
# We re-use the same get_current_user and get_db dependencies
from app.endpoints.links import get_current_user
from app.db.database import get_db

router = APIRouter()

# --- Admin Dependency ---
def get_current_superuser(current_user: models.User = Depends(get_current_user)):
    """
    Dependency to check if the current user is a superuser.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized: Superuser permissions required"
        )
    return current_user

# --- Admin Endpoints ---
@router.get("/stats", response_model=schemas.AdminStats, dependencies=[Depends(get_current_superuser)])
def get_admin_stats(db: Session = Depends(get_db)):
    """
    Get high-level statistics for the entire site. (Admin Only)
    """
    return {
        "total_users": crud.get_user_count(db),
        "total_links": crud.get_link_count(db),
        "total_clicks": crud.get_click_count(db)
    }

@router.get("/users", response_model=List[schemas.UserOut], dependencies=[Depends(get_current_superuser)])
def get_all_users(db: Session = Depends(get_db)):
    """
    Get a list of all users. (Admin Only)
    """
    return crud.get_all_users(db)
  
@router.get("/user-registration-stats", dependencies=[Depends(get_current_superuser)])
def get_user_registration_data(
    interval: str = Query("day", enum=["day", "month", "year"]), # Add query parameter
    db: Session = Depends(get_db)
):
    """
    Get user registration statistics aggregated by day, month, or year. (Admin Only)
    """
    stats = crud.get_user_registration_stats(db, interval=interval)
    return stats

@router.get("/links", response_model=List[schemas.Link], dependencies=[Depends(get_current_superuser)])
def get_all_links(db: Session = Depends(get_db)):
    """
    Get a list of all links from all users. (Admin Only)
    """
    links = crud.get_all_links(db)
    # convert each link to schema
    return crud.convert_db_links_to_schemas(links)