from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app import crud
from app.db import schemas, models, database
from app.endpoints.links import get_current_user
from app.db.database import get_db
from pydantic import BaseModel

router = APIRouter()

# --- Schema for updating user status ---
class UserStatusUpdate(BaseModel):
    is_active: bool
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
    interval: str = Query("day", enum=["day", "month", "year"]), 
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
    return crud.convert_db_links_to_schemas(links, db=db)
  

# ---  Endpoint to Activate/Deactivate User --- 
@router.patch("/users/{user_id}", response_model=schemas.UserOut, dependencies=[Depends(get_current_superuser)])
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superuser) 
):
    """
    Activate or deactivate a user. (Admin Only)
    Prevents admin from deactivating themselves.
    """
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot deactivate their own account."
        )

    updated_user = crud.update_user_active_status(db, user_id=user_id, is_active=status_update.is_active)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return updated_user
  
# ---  Endpoint to Delete User and Associated Data --- 
@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_superuser)])
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_superuser) 
):
    """
    Permanently delete a user and their associated data (links, clicks). (Admin Only)
    Prevents admin from deleting themselves.
    """
    if user_id == current_admin.id:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admins cannot delete their own account."
        )

    user_to_delete = crud.get_user_by_id(db, user_id) 
    if not user_to_delete:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    deleted = crud.delete_user_by_id(db, user_id=user_id)
    if not deleted:
         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found during deletion attempt")

    return None
  
@router.delete("/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_superuser)])
def admin_delete_link_endpoint(
    link_id: int,
    db: Session = Depends(get_db)
):
    """
    Instantly deletes a link by its ID. (Admin Only)
    """
    success = crud.admin_delete_link(db, link_id=link_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )
    
    return None