from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    restaurant_name = Column(String(255), nullable=False, default="Restaurant Name")
    address = Column(String(500), nullable=False, default="123 Main Street, City, State 12345")
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    phone = Column(String)
    role = Column(String, default="system_user")  # system_user, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    bookings = relationship("Booking", back_populates="user")

class Table(Base):
    __tablename__ = "tables"
    
    table_number = Column(String, primary_key=True, index=True)  # Changed: table_number is now primary key
    name = Column(String)
    seats = Column(Integer)
    location_x = Column(Float)  # For drag-and-drop positioning
    location_y = Column(Float)
    table_type = Column(String)  # round, rectangle
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    bookings = relationship("Booking", back_populates="table")

class TimeSlot(Base):
    __tablename__ = "time_slots"
    
    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(String)  # Format: "HH:MM"
    end_time = Column(String)    # Format: "HH:MM"
    slot_duration = Column(Integer)  # Duration in minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

class OperatingHours(Base):
    __tablename__ = "operating_hours"
    
    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    opening_time = Column(String)  # Format: "HH:MM"
    closing_time = Column(String)  # Format: "HH:MM"
    is_open = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    table_number = Column(String, ForeignKey("tables.table_number"))
    booking_date = Column(DateTime)
    start_time = Column(String)  # Format: "HH:MM"
    end_time = Column(String)    # Format: "HH:MM"
    guest_name = Column(String)
    guest_phone = Column(String)
    number_of_people = Column(Integer)
    special_occasion = Column(Text, nullable=True)
    status = Column(String, default="confirmed")  # confirmed, cancelled, completed
    source = Column(String, default="web")  # web, api, phone
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="bookings")
    table = relationship("Table", back_populates="bookings")

class TableBlock(Base):
    __tablename__ = "table_blocks"
    
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String, ForeignKey("tables.table_number"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())

class RoomLayout(Base):
    __tablename__ = "room_layouts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    layout_data = Column(JSON)  # Store drag-and-drop layout configuration
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    type = Column(String)  # confirmation, reminder, cancellation
    message = Column(Text)
    sent_at = Column(DateTime, default=func.now())
    is_sent = Column(Boolean, default=False)
