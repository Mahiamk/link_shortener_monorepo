from pydantic import BaseModel, EmailStr, computed_field
from typing import List, Optional
from datetime import datetime


#------------
# User Schemas
#------------
# Schema for creating a new user
class UserCreate(BaseModel):
    email: str
    password: str

# Schema for responding with user info (omits password)
class User(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True  # Pydantic v2
           
# Output schema
class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime
    is_active: bool = True
    is_superuser: bool = False

    class Config:
        from_attributes = True
        
class LinkOutCount(BaseModel):
    id: int
    original_url: str
    short_code: str
    owner_id: int
    created_at: datetime
    clicks: int  # number of clicks

    class Config:
        from_attributes = True  # Pydantic v2
        
#------------
# Link Schemas
#------------
# Schema for creating a new link
class LinkBase(BaseModel):
  id: int
  original_url: str
  
class LinkCreate(LinkBase):
    pass
  
# Schema for responding with link info
class Link(LinkBase):
    short_code: str
    clicks: int
    created_at: datetime
    owner_id: int
    tag: Optional[str] = None
    expires_at: Optional[datetime] = None
    # is_expired: Optional[bool] = None
    # expires_in_days: Optional[int] = None
    @computed_field
    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return self.expires_at < datetime.utcnow()

    @computed_field
    @property
    def expires_in_days(self) -> Optional[int]:
        if self.expires_at is None:
            return None
        delta = self.expires_at - datetime.utcnow()
        return max(delta.days, 0) # Return 0 if it's already expired

    owner: UserOut 
    class Config:
        from_attributes = True
        
#------------
# Click Schemas
#------------
# Schema for responding with click info
class ClickOut(BaseModel):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LinkOut(BaseModel):
    id: int
    original_url: str
    short_code: str
    owner_id: int
    created_at: datetime
    clicks:int = 0

    class Config:
        from_attributes = True
        
class AdminStats(BaseModel):
    """
    Schema for returning high-level admin statistics.
    """
    total_users: int
    total_links: int
    total_clicks: int

    class Config:
        from_attributes = True
        
        
class ClickOverTimeStat(BaseModel):
    """Schema for representing click counts over a time period."""
    date: str # Will be YYYY-MM-DD, YYYY-MM-01, or YYYY-01-01
    count: int

class BreakdownStat(BaseModel):
    """
    Schema for representing a breakdown by category (e.g., browser, device).
    Uses Dict[str, int] for dynamic categories like {"Chrome": 100, "Safari": 50}.
    """
   
    pass 
  
class ContactSubmissionCreate(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    message: str

# Schema for what the API will return
class ContactSubmission(BaseModel):
    id: int
    first_name: str  # We return snake_case
    last_name: str
    email: EmailStr
    message: str
    created_at: datetime

    class Config:
        from_attributes = True # Pydantic v2