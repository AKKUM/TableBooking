from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from ..database import get_db
from ..auth import get_current_active_user
from ..models import User
from ..schemas import TableListResponse, BookingCreate, BookingResponse, Booking as BookingSchema, TimeSlot as TimeSlotSchema
from ..services.booking_service import BookingService
from ..models import TimeSlot as TimeSlotModel

router = APIRouter(prefix="/bookings", tags=["bookings"])
booking_service = BookingService()

@router.get("/tables", response_model=TableListResponse)
async def get_table_availability(
    target_date: date,
    time_slot: str,
    db: Session = Depends(get_db)
):
    """Get table availability for a specific date and time slot."""
    try:
        tables = booking_service.get_table_availability(db, target_date, time_slot)
        return TableListResponse(
            tables=tables,
            date=target_date,
            time_slot=time_slot
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving table availability: {str(e)}"
        )

@router.get("/time-slots", response_model=List[TimeSlotSchema])
async def get_public_time_slots(
    db: Session = Depends(get_db)
):
    """Public endpoint to fetch active time slots ordered by start time."""
    try:
        return db.query(TimeSlotModel).filter(TimeSlotModel.is_active == True).order_by(TimeSlotModel.start_time).all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving time slots: {str(e)}"
        )

@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new table booking."""
    try:
        # Convert date to datetime for the service
        from datetime import datetime
        booking_date = datetime.combine(booking_data.booking_date, datetime.min.time())
        
        # Create booking data for service
        service_booking_data = BookingCreate(
            table_number=booking_data.table_number,
            booking_date=booking_date,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            guest_name=booking_data.guest_name,
            guest_phone=booking_data.guest_phone,
            number_of_people=booking_data.number_of_people,
            special_occasion=booking_data.special_occasion
        )
        
        booking = booking_service.create_booking(db, service_booking_data, current_user.id)
        
        if not booking:
            return BookingResponse(
                success=False,
                message="Table is not available for the selected time slot"
            )
        
        return BookingResponse(
            success=True,
            message="Booking created successfully",
            booking=booking
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating booking: {str(e)}"
        )

@router.get("/all", response_model=List[BookingSchema])
async def get_all_bookings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all bookings (visible to any authenticated user)."""
    try:
        return booking_service.get_all_bookings(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving bookings: {str(e)}"
        )

@router.delete("/yesterday")
async def delete_yesterday_bookings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete all bookings from yesterday (admin only)."""
    try:
        # Check if user is admin
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can delete bookings"
            )
        
        deleted_count = booking_service.delete_yesterday_bookings(db)
        
        return {
            "success": True,
            "message": f"Successfully deleted {deleted_count} bookings from yesterday",
            "deleted_count": deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting yesterday's bookings: {str(e)}"
        )

@router.get("/my-bookings", response_model=List[BookingSchema])
async def get_my_bookings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all bookings for the current user."""
    try:
        return booking_service.get_user_bookings(db, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving bookings: {str(e)}"
        )

@router.get("/{booking_id}", response_model=BookingSchema)
async def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific booking by ID."""
    try:
        booking = booking_service.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check if user owns this booking or is admin
        if booking.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this booking"
            )
        
        return booking
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving booking: {str(e)}"
        )

@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing booking."""
    try:
        # Get the booking first
        booking = booking_service.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check if user owns this booking or is admin
        if booking.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to modify this booking"
            )
        
        # Update the booking
        updated_booking = booking_service.update_booking(db, booking_id, booking_data)
        
        if not updated_booking:
            return BookingResponse(
                success=False,
                message="Failed to update booking"
            )
        
        return BookingResponse(
            success=True,
            message="Booking updated successfully",
            booking=updated_booking
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating booking: {str(e)}"
        )

@router.delete("/{booking_id}", response_model=BookingResponse)
async def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Cancel a booking."""
    try:
        # Get the booking first
        booking = booking_service.get_booking_by_id(db, booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check if user owns this booking or is admin
        if booking.user_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this booking"
            )
        
        # Cancel the booking
        success = booking_service.cancel_booking(db, booking_id)
        
        if not success:
            return BookingResponse(
                success=False,
                message="Failed to cancel booking"
            )
        
        return BookingResponse(
            success=True,
            message="Booking cancelled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling booking: {str(e)}"
        )