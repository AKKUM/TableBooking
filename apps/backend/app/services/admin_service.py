from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict
from ..models import Table, RoomLayout, TimeSlot, OperatingHours, Booking, User, RestaurantSettings
from ..schemas import TableCreate, TableUpdate, RoomLayoutCreate, RoomLayoutUpdate, DashboardStats, BookingReport, UserCreate, UserUpdate, RestaurantSettingsUpdate
from ..auth import get_password_hash

class AdminService:
    def __init__(self):
        pass
    
    # Restaurant Settings
    def get_restaurant_settings(self, db: Session) -> Optional[RestaurantSettings]:
        """Get restaurant settings (creates default if none exist)."""
        settings = db.query(RestaurantSettings).first()
        if not settings:
            # Create default settings
            settings = RestaurantSettings(
                restaurant_name="Restaurant Name",
                address="123 Main Street, City, State 12345",
                phone="(555) 123-4567"
            )
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings
    
    def update_restaurant_settings(self, db: Session, settings_data: RestaurantSettingsUpdate) -> RestaurantSettings:
        """Update restaurant settings."""
        settings = db.query(RestaurantSettings).first()
        if not settings:
            # Create new settings if none exist
            settings = RestaurantSettings()
            db.add(settings)
        
        # Update fields
        for field, value in settings_data.dict(exclude_unset=True).items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(settings)
        return settings
    
    # User Management
    def get_all_users(self, db: Session) -> List[User]:
        """Get all users."""
        return db.query(User).order_by(User.created_at.desc()).all()
    
    def create_user(self, db: Session, user_data: UserCreate) -> User:
        """Create a new user."""
        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.email)
        ).first()
        
        if existing_user:
            if existing_user.username == user_data.username:
                raise ValueError("Username already exists")
            else:
                raise ValueError("Email already exists")
        
        # Hash the password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user object
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            phone=user_data.phone,
            hashed_password=hashed_password,
            role=user_data.role if hasattr(user_data, 'role') else "system_user"
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    def update_user(self, db: Session, user_id: int, user_data: UserUpdate) -> Optional[User]:
        """Update an existing user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        # Check if email is being changed and if it already exists
        if user_data.email and user_data.email != user.email:
            existing_user = db.query(User).filter(User.email == user_data.email).first()
            if existing_user:
                raise ValueError("Email already exists")
        
        # Update fields
        for field, value in user_data.dict(exclude_unset=True).items():
            setattr(user, field, value)
        
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    def delete_user(self, db: Session, user_id: int) -> bool:
        """Delete a user (soft delete by setting inactive)."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def toggle_user_status(self, db: Session, user_id: int) -> Optional[User]:
        """Toggle user active/inactive status."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        user.is_active = not user.is_active
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    # Table Management
    def create_table(self, db: Session, table_data: TableCreate) -> Table:
        """Create a new table."""
        db_table = Table(**table_data.dict())
        db.add(db_table)
        db.commit()
        db.refresh(db_table)
        return db_table
    
    def delete_all_tables(self, db: Session) -> bool:
        """Delete all tables (handles foreign key constraints)."""
        try:
            # First, delete all bookings that reference tables
            #from ..models import Booking
            #db.query(Booking).delete()
            #db.commit()
            
            # Now delete all tables
            db.query(Table).delete()
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting all tables: {e}")
            return False


    def update_table(self, db: Session, table_number: str, table_data: TableUpdate) -> Optional[Table]:
        """Update an existing table."""
        table = db.query(Table).filter(Table.table_number == table_number).first()
        if not table:
            return None
        
        for field, value in table_data.dict(exclude_unset=True).items():
            setattr(table, field, value)
        
        table.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(table)
        return table
    
    def delete_table(self, db: Session, table_number: str) -> bool:
        """Delete a table (soft delete by setting inactive)."""
        table = db.query(Table).filter(Table.table_number == table_number).first()
        if not table:
            return False
        
        table.is_active = False
        table.updated_at = datetime.utcnow()
        db.commit()
        return True
    
    def get_all_tables(self, db: Session) -> List[Table]:
        """Get all tables including inactive ones."""
        return db.query(Table).order_by(Table.table_number).all()
    
    # Delete yesterday and befor bookings
    def get_active_tables(self, db: Session) -> List[Table]:
        """Get only active tables."""
        return db.query(Table).filter(Table.is_active == True).order_by(Table.table_number).all()
    
    def delete_yesterday_bookings(self, db: Session) -> int:
        """Delete all bookings from yesterday. Returns the number of deleted bookings."""
        from datetime import date, timedelta
        
        yesterday = date.today() - timedelta(days=1)
        
        # Find all bookings from yesterday
        yesterday_bookings = db.query(Booking).filter(
            Booking.booking_date <= yesterday
        ).all()
        
        # Count before deletion
        count = len(yesterday_bookings)
        
        # Delete the bookings
        for booking in yesterday_bookings:
            db.delete(booking)
        
        db.commit()
        return count
    # Room Layout Management
    def create_room_layout(self, db: Session, layout_data: RoomLayoutCreate, user_id: int) -> RoomLayout:
        """Create a new room layout."""
        db_layout = RoomLayout(**layout_data.dict(), created_by=user_id)
        db.add(db_layout)
        db.commit()
        db.refresh(db_layout)
        return db_layout
    
    def update_room_layout(self, db: Session, layout_id: int, layout_data: RoomLayoutUpdate) -> Optional[RoomLayout]:
        """Update an existing room layout."""
        layout = db.query(RoomLayout).filter(RoomLayout.id == layout_id).first()
        if not layout:
            return None
        
        for field, value in layout_data.dict(exclude_unset=True).items():
            setattr(layout, field, value)
        
        layout.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(layout)
        return layout
    
    def delete_room_layout(self, db: Session, layout_id: int) -> bool:
        """Delete a room layout."""
        layout = db.query(RoomLayout).filter(RoomLayout.id == layout_id).first()
        if not layout:
            return False
        db.delete(layout)
        db.commit()
        return True 

    def get_active_room_layout(self, db: Session) -> Optional[RoomLayout]:
        """Get the currently active room layout."""
        return db.query(RoomLayout).filter(RoomLayout.is_active == True).first()
    
    def get_all_room_layouts(self, db: Session) -> List[RoomLayout]:
        """Get all room layouts."""
        return db.query(RoomLayout).order_by(RoomLayout.created_at.desc()).all()
    
    # Time Slot Management
    def create_time_slot(self, db: Session, start_time: str, end_time: str, duration: int) -> TimeSlot:
        """Create a new time slot."""
        db_slot = TimeSlot(
            start_time=start_time,
            end_time=end_time,
            slot_duration=duration
        )
        db.add(db_slot)
        db.commit()
        db.refresh(db_slot)
        return db_slot
    
    def get_all_time_slots(self, db: Session) -> List[TimeSlot]:
        """Get all time slots."""
        return db.query(TimeSlot).filter(TimeSlot.is_active == True).order_by(TimeSlot.start_time).all()
    
    # Operating Hours Management
    def update_operating_hours(self, db: Session, day_of_week: int, opening_time: str, closing_time: str, is_open: bool) -> OperatingHours:
        """Update operating hours for a specific day."""
        existing = db.query(OperatingHours).filter(OperatingHours.day_of_week == day_of_week).first()
        
        if existing:
            existing.opening_time = opening_time
            existing.closing_time = closing_time
            existing.is_open = is_open
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_hours = OperatingHours(
                day_of_week=day_of_week,
                opening_time=opening_time,
                closing_time=closing_time,
                is_open=is_open
            )
            db.add(new_hours)
            db.commit()
            db.refresh(new_hours)
            return new_hours
    
    def get_operating_hours(self, db: Session) -> List[OperatingHours]:
        """Get all operating hours."""
        return db.query(OperatingHours).order_by(OperatingHours.day_of_week).all()
    
    # Dashboard and Reporting
    def get_dashboard_stats(self, db: Session) -> DashboardStats:
        """Get dashboard statistics."""
        today = date.today()
        
        total_bookings = db.query(Booking).count()
        today_bookings = db.query(Booking).filter(Booking.booking_date == today).count()
        pending_bookings = db.query(Booking).filter(Booking.status == "confirmed").count()
        
        # Calculate occupancy rate for today
        active_tables = db.query(Table).filter(Table.is_active == True).count()
        if active_tables > 0:
            today_occupied = db.query(Booking).filter(
                and_(
                    Booking.booking_date == today,
                    Booking.status == "confirmed"
                )
            ).count()
            occupancy_rate = (today_occupied / active_tables) * 100
        else:
            occupancy_rate = 0.0
        
        return DashboardStats(
            total_bookings=total_bookings,
            today_bookings=today_bookings,
            pending_bookings=pending_bookings,
            occupancy_rate=occupancy_rate
        )
    
    def get_booking_report(self, db: Session, start_date: date, end_date: date) -> BookingReport:
        """Get booking report for a date range."""
        bookings = db.query(Booking).filter(
            and_(
                Booking.booking_date >= start_date,
                Booking.booking_date <= end_date
            )
        ).all()
        
        total_bookings = len(bookings)
        
        # Group by source
        bookings_by_source = {}
        for booking in bookings:
            source = booking.source
            if source not in bookings_by_source:
                bookings_by_source[source] = 0
            bookings_by_source[source] += 1
        
        # Calculate daily occupancy trends
        occupancy_trends = []
        current_date = start_date
        while current_date <= end_date:
            daily_bookings = db.query(Booking).filter(
                and_(
                    Booking.booking_date == current_date,
                    Booking.status == "confirmed"
                )
            ).count()
            
            active_tables = db.query(Table).filter(Table.is_active == True).count()
            daily_occupancy = (daily_bookings / active_tables * 100) if active_tables > 0 else 0
            
            occupancy_trends.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "bookings": daily_bookings,
                "occupancy_rate": daily_occupancy
            })
            
            current_date += timedelta(days=1)
        
        return BookingReport(
            date_range=f"{start_date} to {end_date}",
            total_bookings=total_bookings,
            bookings_by_source=bookings_by_source,
            occupancy_trends=occupancy_trends
        )
    
    def get_user_management_data(self, db: Session) -> Dict:
        """Get user management data for admin dashboard."""
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        admin_users = db.query(User).filter(User.role == "admin").count()
        system_users = db.query(User).filter(User.role == "system_user").count()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "system_users": system_users
        }
