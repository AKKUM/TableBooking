from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, time

# Restaurant Settings schemas
class RestaurantSettings(BaseModel):
    id: int
    restaurant_name: str
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RestaurantSettingsUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    phone: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "system_user"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Table schemas
class TableBase(BaseModel):
    table_number: str
    name: str
    seats: int
    location_x: float
    location_y: float
    table_type: str

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    name: Optional[str] = None
    seats: Optional[int] = None
    location_x: Optional[float] = None
    location_y: Optional[float] = None
    table_type: Optional[str] = None
    is_active: Optional[bool] = None

class Table(TableBase):
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Time slot schemas
class TimeSlotBase(BaseModel):
    start_time: str
    end_time: str
    slot_duration: int

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlot(TimeSlotBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Operating hours schemas
class OperatingHoursBase(BaseModel):
    day_of_week: int
    opening_time: str
    closing_time: str
    is_open: bool

class OperatingHoursCreate(OperatingHoursBase):
    pass

class OperatingHours(OperatingHoursBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Booking schemas
class BookingBase(BaseModel):
    table_number: str  # Changed: now uses table_number instead of table_id
    booking_date: date
    start_time: str
    end_time: str
    guest_name: str
    guest_phone: str
    number_of_people: int
    special_occasion: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    guest_name: Optional[str] = None
    guest_phone: Optional[str] = None
    number_of_people: Optional[int] = None
    special_occasion: Optional[str] = None
    status: Optional[str] = None

class Booking(BookingBase):
    id: int
    user_id: int
    status: str
    source: str
    created_at: datetime
    updated_at: datetime
    # Removed table relationship to avoid validation issues
    
    class Config:
        from_attributes = True

# Table block schemas
class TableBlockBase(BaseModel):
    table_number: str  # Changed: now uses table_number instead of table_id
    start_date: datetime
    end_date: datetime
    reason: str

class TableBlockCreate(TableBlockBase):
    pass

class TableBlock(TableBlockBase):
    id: int
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Room layout schemas
class RoomLayoutBase(BaseModel):
    name: str
    layout_data: dict

class RoomLayoutCreate(RoomLayoutBase):
    pass

class RoomLayoutUpdate(BaseModel):
    name: Optional[str] = None
    layout_data: Optional[dict] = None
    is_active: Optional[bool] = None

class RoomLayout(RoomLayoutBase):
    id: int
    is_active: bool
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Table availability schemas
class TableAvailability(BaseModel):
    table_number: str  # Use table_number instead of table object
    name: str
    seats: int
    table_type: str
    is_available: bool
    booked_slots: List[dict]

# Booking request schemas
class BookingRequest(BaseModel):
    date: date
    time_slot: str
    table_number: str  # Changed: now uses table_number instead of table_id
    guest_name: str
    guest_phone: str
    number_of_people: int
    special_occasion: Optional[str] = None

# Response schemas
class BookingResponse(BaseModel):
    success: bool
    message: str
    booking: Optional[Booking] = None

class TableListResponse(BaseModel):
    tables: List[TableAvailability]
    date: date
    time_slot: str

# Admin dashboard schemas
class DashboardStats(BaseModel):
    total_bookings: int
    today_bookings: int
    pending_bookings: int
    occupancy_rate: float
    revenue: Optional[float] = None

class BookingReport(BaseModel):
    date_range: str
    total_bookings: int
    bookings_by_source: dict
    occupancy_trends: List[dict]
