from ast import List
import datetime
from typing import List, Optional
from app.endpoints.links import get_current_user
from app.db import schemas
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.db import models, database
from user_agents import parse
from IP2Location import IP2Location
from datetime import datetime, timedelta
from app import crud

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# helper functions to parse user agent strings
def parse_browser(user_agent_str: str) -> str:
    try:
        ua = parse(user_agent_str or "")
        return ua.browser.family
    except Exception:
        return "unknown"

def parse_device_type(user_agent_str: str) -> str:
    ua = parse(user_agent_str or "")
    return "mobile" if ua.is_mobile else "tablet" if ua.is_tablet else "desktop"
# Dependency to get DB session
@router.get("/{short_code}")
async def handle_redirect(short_code: str, request: Request, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()
    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")
  
    # link expiration check
    if link.expires_at and datetime.utcnow() > link.expires_at:
      raise HTTPException(status_code=410, detail="Link expired")
    
    #COUNTRY, REFERRER, BROWSER, DEVICE TYPE can be extracted from request headers if needed.
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")
    ip = request.client.host
    ua = parse(user_agent)
    browser = ua.browser.family
    device_type = "mobile" if ua.is_mobile else "tablet" if ua.is_tablet else "desktop"

    click = models.Click(
        link_id=link.id,
        country=ip,   # use IP2Location or similar API
        referrer=referrer,
        browser=parse_browser(user_agent),
        device_type=parse_device_type(user_agent),
    )

    # Log the click
    db.add(click)
    db.commit()
    
    return RedirectResponse(url=link.original_url, status_code=307)
  
# Helper function to group clicks by attribute
def group_by(clicks, attr):
    result = {}
    for c in clicks:
        key = getattr(c, attr)
        result[key] = result.get(key, 0) + 1
    return result
  
  
# Function to delete expired links
def delete_expired_links(db: Session):
    now = datetime.utcnow()
    db.query(models.Link).filter(models.Link.expires_at < now).delete()
    db.commit()



@router.get("/links/{link_id}/stats")
def link_stats(link_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link or link.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    clicks = db.query(models.Click).filter(models.Click.link_id == link_id).all()
    total_clicks = len(clicks)

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
    
  
# Redirect endpoint for expanded links  
@router.get("/r/{short_code}", response_class=HTMLResponse)
def redirect_link(short_code: str, db: Session = Depends(get_db)):
    link = db.query(models.Link).filter(models.Link.short_code == short_code).first()

    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # ✅ Check expiration
    if link.expires_at and link.expires_at < datetime.utcnow():
        return HTMLResponse(
            content=f"""
            <html>
                <head><title>Link Expired</title></head>
                <body style="font-family: sans-serif; text-align: center; margin-top: 100px;">
                    <h1>🚫 This link has expired</h1>
                    <p>The short link <b>{short_code}</b> expired on <b>{link.expires_at.strftime("%Y-%m-%d %H:%M:%S")}</b>.</p>
                    <p>Contact the owner if you believe this is an error.</p>
                </body>
            </html>
            """,
            status_code=410
        )

    # ✅ Log click analytics
    crud.create_click_log(db, link_id=link.id)

    # ✅ Redirect to the original URL
    return RedirectResponse(url=link.original_url)
  

# Endpoint to get active links for current user
@router.get("/links/active", response_model=List[schemas.Link])
def get_active_links(db: Session = Depends(get_db), current_user: schemas.User = Depends(get_current_user)):
    current_time = datetime.utcnow()
    links = (
        db.query(models.Link)
        .filter(models.Link.owner_id == current_user.id)
        .filter((models.Link.expires_at == None) | (models.Link.expires_at > current_time))
        .all()
    )
    return links
  
 # Endpoint to extend link expiration (super admin only) 
@router.put("/links/{link_id}/extend", response_model=schemas.Link)
def extend_expiration(link_id: int, days: int = 30, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    link = db.query(models.Link).filter(models.Link.id == link_id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Only super admin can extend
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Permission denied")

    link.expires_at = datetime.utcnow() + timedelta(days=days)
    db.commit()
    db.refresh(link)
    return link


# Endpoint to get expired links (super admin only)
@router.get("/links/expired")
def get_expired_links(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    links = db.query(models.Link).all()
    expired_links = [
        {
            "id": link.id,
            "original_url": link.original_url,
            "short_code": link.short_code,
            "expires_at": link.expires_at,
            "is_expired": link.expires_at and datetime.utcnow() > link.expires_at
        }
        for link in links if link.expires_at and datetime.utcnow() > link.expires_at
    ]
    return expired_links
