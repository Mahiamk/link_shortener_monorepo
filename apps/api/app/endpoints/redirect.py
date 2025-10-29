from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session
from app.db import models, database
from user_agents import parse
from datetime import datetime
from app import crud

router = APIRouter()

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Helper functions ---
def parse_browser(user_agent_str: str) -> str:
    try:
        ua = parse(user_agent_str or "")
        return ua.browser.family
    except Exception:
        return "unknown"

def parse_device_type(user_agent_str: str) -> str:
    ua = parse(user_agent_str or "")
    return "mobile" if ua.is_mobile else "tablet" if ua.is_tablet else "desktop"

# --- Endpoints ---

@router.get("/{short_code}")
async def handle_redirect(
    short_code: str, 
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Handles the primary redirect. This is the one you should share.
    It logs the click and redirects to the original URL.
    """
    link = crud.get_link_by_short_code(db, short_code=short_code)
    
    if not link:
        raise HTTPException(status_code=404, detail="Short link not found")
  
    # Link expiration check
    if link.expires_at and datetime.utcnow() > link.expires_at:
        # Re-use the nice HTML response from your other endpoint
        return HTMLResponse(
            content=f"""
            <html>
                <head><title>Link Expired</title></head>
                <body style="font-family: sans-serif; text-align: center; margin-top: 100px;">
                    <h1>🚫 This link has expired</h1>
                    <p>The short link <b>{short_code}</b> expired on <b>{link.expires_at.strftime("%Y-%m-%d %H:%M:%S")}</b>.</p>
                </body>
            </html>
            """,
            status_code=410
        )
    
    # --- Log Click Analytics ---
    user_agent = request.headers.get("user-agent")
    referrer = request.headers.get("referer")
    ip = request.client.host # Note: This is often '127.0.0.1' in Docker.
                             # For real IP, you need a reverse proxy (e.g., Nginx)
                             # and to check 'x-forwarded-for' header.
                             # For now, this is fine for testing.
    
    # Use the CRUD function to log the click
    crud.create_click_log(
        db=db,
        link_id=link.id,
        ip_address=ip,
        country=ip, # Placeholder. Use a service like IP2Location to map IP to country
        referrer=referrer,
        browser=parse_browser(user_agent),
        device_type=parse_device_type(user_agent),
    )
    
    return RedirectResponse(url=link.original_url, status_code=307)
  
# Note: You also had a "/r/{short_code}" endpoint. It was a duplicate
# of the one above. I have removed it for clarity.
# The main "/{short_code}" is all you need.

# You can also remove the "delete_expired_links" function
# as it is not an API endpoint and would be better run as a
# scheduled background task.
