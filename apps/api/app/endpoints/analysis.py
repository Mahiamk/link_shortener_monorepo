from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict # Import Dict

from app import crud
from app.db import schemas, models
from app.db.database import get_db
# Re-use the user authentication dependency from links.py
from app.endpoints.links import get_current_user

router = APIRouter()

@router.get("/clicks-over-time", response_model=List[schemas.ClickOverTimeStat])
def get_user_clicks_over_time(
    interval: str = Query("day", enum=["day", "month", "year"]),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get aggregated click counts over time for the current user's links.
    """
    stats = crud.get_aggregated_clicks_over_time(db, user_id=current_user.id, interval=interval)
    return stats

# Note: We use Dict[str, int] as the response_model because BreakdownStat is empty
@router.get("/device-breakdown", response_model=Dict[str, int])
def get_user_device_breakdown(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get aggregated click breakdown by device type for the current user."""
    return crud.get_aggregated_device_breakdown(db, user_id=current_user.id)

@router.get("/browser-breakdown", response_model=Dict[str, int])
def get_user_browser_breakdown(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get aggregated click breakdown by browser for the current user."""
    return crud.get_aggregated_browser_breakdown(db, user_id=current_user.id)


@router.get("/referrer-breakdown", response_model=Dict[str, int])
def get_user_referrer_breakdown(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get aggregated click breakdown by referrer for the current user."""
    return crud.get_aggregated_referrer_breakdown(db, user_id=current_user.id)

@router.get("/country-breakdown", response_model=Dict[str, int])
def get_user_country_breakdown(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get aggregated click breakdown by country for the current user."""
    return crud.get_aggregated_country_breakdown(db, user_id=current_user.id)