from datetime import datetime, timedelta
from sqlalchemy.orm import Session, joinedload, subqueryload
from .db import models, schemas
from .core.security import get_password_hash
from app.core.config import settings
from typing import List
from sqlalchemy import func, cast, Date, Interval, desc
from sqlalchemy.sql import extract

import secrets

# --- Helper Functions ---

def convert_db_link_to_schema(db_link: models.Link, click_count: int = None) -> dict:
    """
    Safely converts a Link database object into a dictionary
    that matches the schemas.Link Pydantic model.
    """
    if db_link is None:
        return None

    now = datetime.utcnow()
    is_expired = db_link.expires_at and db_link.expires_at < now
    expires_in_days = None
    if db_link.expires_at:
        delta = db_link.expires_at - now
        expires_in_days = max(delta.days, 0)

    # Convert owner to UserOut schema if it exists, otherwise None
    owner_out = schemas.UserOut.from_orm(db_link.owner) if db_link.owner else None

    if click_count is not None:
        computed_clicks = click_count
    else:
        computed_clicks = len(db_link.clicks) if hasattr(db_link, 'clicks') and db_link.clicks else 0

    return {
        "id": db_link.id,
        "original_url": db_link.original_url,
        "short_code": db_link.short_code,
        # Safely calculate click count
        "clicks": computed_clicks,
        "created_at": db_link.created_at,
        "owner_id": db_link.owner_id,
        "tag": db_link.tag,
        "expires_at": db_link.expires_at,
        "is_expired": is_expired,
        "expires_in_days": expires_in_days,
        "owner": owner_out # Include the owner details
    }

def convert_db_links_to_schemas(db_links: List[any]) -> List[dict]:
    """Applies the conversion to a list of link objects or (link, count) tuples."""
    results = []
    for item in db_links:
        if isinstance(item, models.Link):
             results.append(convert_db_link_to_schema(item))
        else:
             # Expecting Row/Tuple (models.Link, count)
             try:
                results.append(convert_db_link_to_schema(item[0], click_count=item[1]))
             except (IndexError, TypeError):
                # Fallback or skip if data format is unexpected
                continue
    return results

def get_mysql_date_trunc(column, interval):
    """Returns the correct MySQL function for truncating a date."""
    if interval == 'day':
        return func.date(column) # Standard function for truncating to day
    elif interval == 'month':
        # MySQL equivalent of date_trunc('month'): YYYY-MM-01
        return func.date_format(column, '%Y-%m-01')
    elif interval == 'year':
        # MySQL equivalent of date_trunc('year'): YYYY-01-01
        return func.date_format(column, '%Y-01-01')
    return func.date(column) # Default to day

# --- User CRUD (Operations) ---

def get_user_by_email(db: Session, email: str):
    """Fetches a single user by their email address."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """Creates a new user in the database."""
    hashed_password = get_password_hash(user.password)
    superuser_list = []
    if isinstance(settings.SUPERUSER_EMAILS, str):
        # Only split if it's actually a string
        superuser_list = [email.strip() for email in settings.SUPERUSER_EMAILS.split(",")]

    is_superuser = user.email in superuser_list
    
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_superuser=is_superuser
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Link CRUD (Operations) ---

def get_link_by_short_code(db: Session, short_code: str):
    """Fetches a link by its unique short code."""
    return (
        db.query(models.Link)
        .options(joinedload(models.Link.owner))
        .filter(models.Link.short_code == short_code)
        .first()
    )

def create_db_link(db: Session, original_url: str, user_id: int, tag: str | None = None):
    """Creates a new short link in the database."""
    short_code = secrets.token_urlsafe(6)
    while get_link_by_short_code(db, short_code):
        short_code = secrets.token_urlsafe(6)
    expires_at = datetime.utcnow() + timedelta(days=30)
    db_link = models.Link(
        original_url=original_url,
        short_code=short_code,
        owner_id=user_id,
        tag=tag,
        expires_at=expires_at
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    return db_link # Return the DB object

def get_links_by_user(db: Session, user_id: int) -> List[models.Link]:
    """Gets all links for a specific user."""
    return (
        db.query(models.Link, func.count(models.Click.id).label('click_count'))
        .outerjoin(models.Click, models.Link.id == models.Click.link_id)
        .options(joinedload(models.Link.owner))
        .filter(models.Link.owner_id == user_id)
        .group_by(models.Link.id)
        .order_by(models.Link.created_at.desc())
        .all()
    )
    
def get_link_by_id_and_owner(db: Session, link_id: int, user_id: int) -> models.Link | None:
    """
    Fetches a single link by its ID, ensuring it belongs to the specified user.
    """
    return (
        db.query(models.Link)
        .filter(models.Link.id == link_id, models.Link.owner_id == user_id)
        .first()
    )

def delete_link(db: Session, link_id: int, user_id: int) -> models.Link | None:
    """
    Finds a link by its ID and the owner's ID.
    Returns the link object if found and owned by the user, otherwise None.
    Uses the corrected function to ensure clicks are loaded if needed later.
    """
    link_to_delete = get_link_by_id_and_owner(db, link_id, user_id)
    return link_to_delete


# --- Click CRUD (Operations) ---

def create_click_log(
    db: Session,
    link_id: int,
    ip_address: str | None = None,
    country: str | None = None,
    referrer: str | None = None,
    browser: str | None = None,
    device_type: str | None = None
):
    """Logs a new click for a specific link with all analytics data."""
    db_log = models.Click(
        link_id=link_id,
        ip_address=ip_address,
        country=country,
        referrer=referrer,
        browser=browser,
        device_type=device_type
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

# --- Admin CRUD ---

def get_user_count(db: Session) -> int:
    return db.query(models.User).count()

def get_link_count(db: Session) -> int:
    return db.query(models.Link).count()

def get_click_count(db: Session) -> int:
    return db.query(models.Click).count()

def get_all_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def get_all_links(db: Session, skip: int = 0, limit: int = 100) -> List[models.Link]:
    """Gets all links (for admin), eager loading relationships."""
    return (
        db.query(models.Link, func.count(models.Click.id).label('click_count'))
        .outerjoin(models.Click, models.Link.id == models.Click.link_id)
        .options(joinedload(models.Link.owner))
        .group_by(models.Link.id)
        .order_by(models.Link.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
def get_user_registration_stats(db: Session, interval: str = 'day'):
    """
    Aggregates user registration counts by day, month, or year.
    'interval' can be 'day', 'month', or 'year'.
    """
    date_trunc_map = {
        'day': func.date(models.User.created_at),
        'month': func.date_trunc('month', models.User.created_at),
        'year': func.date_trunc('year', models.User.created_at),
    }

    if interval not in date_trunc_map:
        interval = 'day' # Default to day if invalid

    date_column = get_mysql_date_trunc(models.User.created_at, interval).label('date')

    results = (
        db.query(
            date_column,
            func.count(models.User.id).label('count')
        )
        .group_by(date_column)
        .order_by(date_column)
        .all()
    )

    # Format results as a list of dictionaries
    return [{"date": str(row.date), "count": row.count} for row in results]
  
  
def get_aggregated_clicks_over_time(db: Session, user_id: int, interval: str = 'day'):
    """
    Aggregates total clicks per time interval (day, month, year)
    across all links owned by the specified user.
    """
    date_trunc_map = {
        'day': func.date(models.Click.created_at),
        'month': func.date_trunc('month', models.Click.created_at),
        'year': func.date_trunc('year', models.Click.created_at),
    }

    if interval not in date_trunc_map:
        interval = 'day' # Default to day if invalid

    date_column = get_mysql_date_trunc(models.Click.created_at, interval).label('date')

    results = (
        db.query(
            date_column,
            func.count(models.Click.id).label('count')
        )
        .join(models.Link) # Join Click with Link
        .filter(models.Link.owner_id == user_id) # Filter by the user owning the link
        .group_by(date_column)
        .order_by(date_column) # Order chronologically
        .all()
    )

    # Format results
    return [{"date": str(row.date), "count": row.count} for row in results]


def get_aggregated_breakdown(db: Session, user_id: int, group_by_column: str, limit: int = 10):
    """
    Generic function to aggregate clicks by a specific column (e.g., browser, device_type, country, referrer)
    across all links owned by the specified user, returning top N results + 'Other'.
    """
    if group_by_column not in ['browser', 'device_type', 'country', 'referrer']:
        raise ValueError("Invalid column for breakdown")

    column_attribute = getattr(models.Click, group_by_column)

    # Query to get counts per category
    results = (
        db.query(
            column_attribute.label('category'),
            func.count(models.Click.id).label('count')
        )
        .join(models.Link)
        .filter(models.Link.owner_id == user_id)
        .group_by(column_attribute)
        .order_by(desc('count')) # Order by count descending
        .all()
    )

    # Process results: Top N + Other
    top_results = results[:limit]
    other_count = sum(row.count for row in results[limit:])

    breakdown = {row.category if row.category else 'Unknown': row.count for row in top_results}
    if other_count > 0:
        breakdown['Other'] = other_count

    return breakdown

# --- Convenience functions using the generic breakdown ---

def get_aggregated_device_breakdown(db: Session, user_id: int):
    return get_aggregated_breakdown(db, user_id, 'device_type', limit=5)

def get_aggregated_browser_breakdown(db: Session, user_id: int):
     return get_aggregated_breakdown(db, user_id, 'browser', limit=5)

def get_aggregated_referrer_breakdown(db: Session, user_id: int):
    return get_aggregated_breakdown(db, user_id, 'referrer', limit=5)

def get_aggregated_country_breakdown(db: Session, user_id: int):
    return get_aggregated_breakdown(db, user_id, 'country', limit=5)
  
  
def get_user_by_id(db: Session, user_id: int):
    """Fetches a single user by their ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user_active_status(db: Session, user_id: int, is_active: bool) -> models.User | None:
    """Updates the is_active status of a user by ID."""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db_user.is_active = is_active
        db.commit()
        db.refresh(db_user)
    return db_user

def delete_user_by_id(db: Session, user_id: int) -> bool:
    """Deletes a user by ID. Returns True if deleted, False otherwise."""
    db_user = get_user_by_id(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False
  
# --- NEW ADMIN FUNCTION ---
def admin_delete_link(db: Session, link_id: int) -> bool:
    """
    Admin action: Deletes a link by its ID, regardless of owner.
    Returns True if deleted, False if not found.
    """
    # Find the link first
    db_link = db.query(models.Link).filter(models.Link.id == link_id).first()
    
    if db_link:
        # If found, delete it
        db.delete(db_link)
        db.commit()
        return True
    
    # If not found, return False
    return False
  
def create_contact_submission(db: Session, submission: schemas.ContactSubmissionCreate) -> models.ContactSubmission:
    """
    Creates a new contact form submission in the database.
    Maps frontend camelCase to backend snake_case.
    """
    # Map from the Pydantic schema (camelCase) to the SQLAlchemy model (snake_case)
    db_submission = models.ContactSubmission(
        first_name=submission.firstName,
        last_name=submission.lastName,
        email=submission.email,
        message=submission.message
    )
    
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    return db_submission
  
def get_submissions(db: Session, skip: int = 0, limit: int = 100) -> List[models.ContactSubmission]:
    """
    Retrieves all contact submissions, newest first.
    """
    return db.query(models.ContactSubmission).order_by(models.ContactSubmission.created_at.desc()).offset(skip).limit(limit).all()


def get_submission_by_id(db: Session, submission_id: int) -> models.ContactSubmission | None:
    """
    Retrieves a single contact submission by its ID.
    """
    return db.query(models.ContactSubmission).filter(models.ContactSubmission.id == submission_id).first()


def delete_submission(db: Session, submission_id: int) -> models.ContactSubmission | None:
    """
    Deletes a contact submission by its ID.
    """
    db_submission = get_submission_by_id(db, submission_id)
    if db_submission:
        db.delete(db_submission)
        db.commit()
        return db_submission
    return None