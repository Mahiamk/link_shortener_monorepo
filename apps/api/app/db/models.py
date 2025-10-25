from xmlrpc.client import Boolean
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # One-to-many relationship: one user can have many links
    links = relationship("Link", back_populates="owner", cascade="all, delete-orphan")
    is_active = Column(Boolean, default=True)  # 1 for active, 0 for inactive
    is_superuser = Column(Boolean, default=False)  # 1 for admin, 0 for regular user

class Click(Base):
    __tablename__ = "clicks"
    id = Column(Integer, primary_key=True, index=True)
    link_id = Column(Integer, ForeignKey("links.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(100), nullable=True)  # IPv6 compatible
    link = relationship("Link", back_populates="clicks")
    country = Column(String(100), nullable=True)
    referrer = Column(String(255), nullable=True)
    browser = Column(String(100), nullable=True)
    device_type = Column(String(100), nullable=True)

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String(255), nullable=False)
    short_code = Column(String(255), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Foreign key: link belongs to a user
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="links")
    # One-to-many relationship: one link can have many clicks
    clicks = relationship("Click", back_populates="link", cascade="all, delete-orphan")
    # Back relationship
    owner = relationship("User", back_populates="links")
    expires_at = Column(DateTime, nullable=True)  # Optional expiration date
    tag = Column(String(100), nullable=True)  # Optional tag for categorization
