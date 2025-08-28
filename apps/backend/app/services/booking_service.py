from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict
import json
try:
    import redis  # type: ignore
except Exception:  # pragma: no cover
    redis = None
from ..models import Booking, Table, TableBlock, TimeSlot, OperatingHours, RoomLayout
from ..schemas import BookingCreate, BookingUpdate, TableAvailability
from ..config import settings

class BookingService:
    def __init__(self):
        self.redis_client = None
        if redis is not None:
            try:
                self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
                # ping to verify
                self.redis_client.ping()
            except Exception:
                self.redis_client = None
    
    def get_table_availability(self, db: Session, target_date: date, time_slot: str) -> List[TableAvailability]:
        """Get availability for all tables on a specific date and time slot.
        Only tables included in the active room layout are considered (if a layout exists).
        """
        # Check cache if available
        cache_key = f"availability:{target_date}:{time_slot}"
        if self.redis_client:
            try:
                cached_data = self.redis_client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception:
                pass
        
        # Parse time slot
        start_time, end_time = time_slot.split("-")
        
        # Determine tables from active layout (if any)
        layout = db.query(RoomLayout).filter(RoomLayout.is_active == True).first()
        table_query = db.query(Table).filter(Table.is_active == True)
        layout_table_numbers: Optional[List[str]] = None
        
        if layout and layout.layout_data and isinstance(layout.layout_data, dict):
            tables_section = layout.layout_data.get("tables")
            if isinstance(tables_section, list) and len(tables_section) > 0:
                # Use table_number matching (more reliable)
                layout_table_numbers = [t.get("table_number") for t in tables_section if t.get("table_number")]
        
        # Filter by layout table numbers if available
        if layout_table_numbers:
            table_query = table_query.filter(Table.table_number.in_(layout_table_numbers))
        
        tables = table_query.all()
        
        # If layout defined, keep order as in layout
        if layout_table_numbers:
            table_map_num = {t.table_number: t for t in tables}
            tables = [table_map_num[num] for num in layout_table_numbers if num in table_map_num]
        
        availability_list = []
        
        for table in tables:
            # Check if table is blocked
            is_blocked = self._is_table_blocked(db, table.table_number, target_date, start_time, end_time)
            
            # Check existing bookings
            existing_bookings = self._get_existing_bookings(db, table.table_number, target_date, start_time, end_time)
            
            is_available = not is_blocked and len(existing_bookings) == 0
            
            availability = TableAvailability(
                table_number=table.table_number,
                name=table.name,
                seats=table.seats,
                table_type=table.table_type,
                is_available=is_available,
                booked_slots=existing_bookings
            )
            availability_list.append(availability)
        
        # Cache the result for 5 minutes
        if self.redis_client:
            try:
                self.redis_client.setex(cache_key, 300, json.dumps([av.dict() for av in availability_list]))
            except Exception:
                pass
        
        return availability_list
    
    def create_booking(self, db: Session, booking_data: BookingCreate, user_id: int) -> Optional[Booking]:
        """Create a new booking with best-effort lock when Redis is available."""
        lock_key = f"booking_lock:{booking_data.table_number}:{booking_data.booking_date}:{booking_data.start_time}"
        
        # Fallback path if Redis not available
        if not self.redis_client:
            if not self._is_table_available(db, booking_data.table_number, booking_data.booking_date,
                                            booking_data.start_time, booking_data.end_time):
                return None
            db_booking = Booking(
                user_id=user_id,
                table_number=booking_data.table_number,
                booking_date=booking_data.booking_date,
                start_time=booking_data.start_time,
                end_time=booking_data.end_time,
                guest_name=booking_data.guest_name,
                guest_phone=booking_data.guest_phone,
                number_of_people=booking_data.number_of_people,
                special_occasion=booking_data.special_occasion,
                source="web"
            )
            db.add(db_booking)
            db.commit()
            db.refresh(db_booking)
            return db_booking
        
        # With Redis lock
        with self.redis_client.lock(lock_key, timeout=10):
            if not self._is_table_available(db, booking_data.table_number, booking_data.booking_date, 
                                         booking_data.start_time, booking_data.end_time):
                return None
            db_booking = Booking(
                user_id=user_id,
                table_number=booking_data.table_number,
                booking_date=booking_data.booking_date,
                start_time=booking_data.start_time,
                end_time=booking_data.end_time,
                guest_name=booking_data.guest_name,
                guest_phone=booking_data.guest_phone,
                number_of_people=booking_data.number_of_people,
                special_occasion=booking_data.special_occasion,
                source="web"
            )
            db.add(db_booking)
            db.commit()
            db.refresh(db_booking)
            # Clear cache best-effort
            self._clear_availability_cache(booking_data.booking_date, booking_data.start_time)
            return db_booking
    
    def update_booking(self, db: Session, booking_id: int, booking_data: BookingUpdate) -> Optional[Booking]:
        """Update an existing booking."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return None
        
        for field, value in booking_data.dict(exclude_unset=True).items():
            setattr(booking, field, value)
        
        booking.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(booking)
        # Clear cache best-effort
        self._clear_availability_cache(booking.booking_date, booking.start_time)
        return booking
    
    def cancel_booking(self, db: Session, booking_id: int) -> bool:
        """Cancel a booking."""
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return False
        
        booking.status = "cancelled"
        booking.updated_at = datetime.utcnow()
        db.commit()
        # Clear cache
        self._clear_availability_cache(booking.booking_date, booking.start_time)
        return True
    
    def get_user_bookings(self, db: Session, user_id: int) -> List[Booking]:
        """Get all bookings for a specific user."""
        return db.query(Booking).filter(Booking.user_id == user_id).order_by(Booking.booking_date.desc()).all()

    def get_all_bookings(self, db: Session) -> List[Booking]:
        """Get all bookings for all users (for authenticated users)."""
        return db.query(Booking).order_by(Booking.booking_date.desc()).all()
    
    def get_booking_by_id(self, db: Session, booking_id: int) -> Optional[Booking]:
        """Get a specific booking by ID."""
        return db.query(Booking).filter(Booking.id == booking_id).first()
    
    def delete_yesterday_bookings(self, db: Session) -> int:
        """Delete all bookings from yesterday and earlier.
        Returns the number of deleted bookings. Safe when there are no rows.
        """
        # booking_date is a DateTime; delete everything with booking_date <= end of yesterday
        yesterday = date.today() - timedelta(days=1)
        cutoff = datetime.combine(yesterday, datetime.max.time())
        query = db.query(Booking).filter(Booking.booking_date <= cutoff)
        deleted_count = query.count()
        # Use bulk delete; safe even if zero rows
        query.delete(synchronize_session=False)
        db.commit()
        return deleted_count
    
    
    def _is_table_blocked(self, db: Session, table_number: str, target_date: date, start_time: str, end_time: str) -> bool:
        """Check if a table is blocked for the given date and time."""
        target_datetime = datetime.combine(target_date, datetime.strptime(start_time, "%H:%M").time())
        blocked = db.query(TableBlock).filter(
            and_(
                TableBlock.table_number == table_number,
                TableBlock.start_date <= target_datetime,
                TableBlock.end_date >= target_datetime
            )
        ).first()
        return blocked is not None
    
    def _get_existing_bookings(self, db: Session, table_number: str, target_date: date, start_time: str, end_time: str) -> List[Dict]:
        """Get existing bookings for a table on a specific date and time."""
        bookings = db.query(Booking).filter(
            and_(
                Booking.table_number == table_number,
                Booking.booking_date == target_date,
                Booking.status == "confirmed",
                or_(
                    and_(Booking.start_time <= start_time, Booking.end_time > start_time),
                    and_(Booking.start_time < end_time, Booking.end_time >= end_time),
                    and_(Booking.start_time >= start_time, Booking.end_time <= end_time)
                )
            )
        ).all()
        return [
            {
                "booking_id": booking.id,
                "start_time": booking.start_time,
                "end_time": booking.end_time,
                "guest_name": booking.guest_name,
                "guest_phone": booking.guest_phone,
                "number_of_people": booking.number_of_people,
                "special_occasion": booking.special_occasion
            }
            for booking in bookings
        ]
    
    def _is_table_available(self, db: Session, table_number: str, target_date: date, start_time: str, end_time: str) -> bool:
        """Check if a table is available for the given date and time."""
        if self._is_table_blocked(db, table_number, target_date, start_time, end_time):
            return False
        existing_bookings = self._get_existing_bookings(db, table_number, target_date, start_time, end_time)
        return len(existing_bookings) == 0
    
    def _clear_availability_cache(self, target_date: date, start_time: str):
        """Clear availability cache for a specific date and time (best-effort)."""
        if not self.redis_client:
            return
        try:
            cache_key = f"availability:{target_date}:{start_time}"
            self.redis_client.delete(cache_key)
        except Exception:
            pass