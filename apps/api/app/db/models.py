from xmlrpc.client import Boolean
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # Index for stats queries
    # One-to-many relationship: one user can have many links
    links = relationship("Link", back_populates="owner", cascade="all, delete-orphan")
    is_active = Column(Boolean, default=False, index=True)  # Index for filtering active users
    is_superuser = Column(Boolean, default=False)  # 1 for admin, 0 for regular user

class Click(Base):
    __tablename__ = "clicks"
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"), index=True)  # Index for JOIN performance
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)  # Index for time-based queries
    ip_address = Column(String(100), nullable=True)  # IPv6 compatible
    link = relationship("Link", back_populates="clicks")
    country = Column(String(100), nullable=True, index=True)  # Index for aggregation queries
    referrer = Column(String(255), nullable=True)
    browser = Column(String(100), nullable=True, index=True)  # Index for aggregation queries
    device_type = Column(String(100), nullable=True, index=True)  # Index for aggregation queries

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String(255), nullable=False)
    short_code = Column(String(255), unique=True, nullable=False, index=True)  # Already unique, but explicit index
    created_at = Column(DateTime, default=datetime.utcnow, index=True)  # Index for sorting by date
    # Foreign key: link belongs to a user
    owner_id = Column(Integer, ForeignKey("users.id"), index=True)  # Index for user's links queries
    owner = relationship("User", back_populates="links")
    # One-to-many relationship: one link can have many clicks
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")
    # Back relationship
    owner = relationship("User", back_populates="links")
    expires_at = Column(DateTime, nullable=True, index=True)  # Index for expiration queries
    tag = Column(String(100), nullable=True, index=True)  # Index for filtering by tag  
    
    
class ContactSubmission(Base):
    __tablename__ = "contact_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
