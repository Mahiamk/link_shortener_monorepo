from pydantic import BaseModel, EmailStr
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
    is_expired: Optional[bool] = None
    expires_in_days: Optional[int] = None

    class Config:
        from_attributes = True  # Pydantic v2
        
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
    clicks: List[ClickOut] = []

    class Config:
        from_attributes = True