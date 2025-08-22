from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List
from ..database import get_db
from ..auth import get_current_admin_user
from ..models import User
from ..schemas import (
    TableCreate, TableUpdate, Table as TableSchema,
    RoomLayoutCreate, RoomLayoutUpdate, RoomLayout as RoomLayoutSchema,
    TimeSlotCreate, TimeSlot as TimeSlotSchema,
    OperatingHoursCreate, OperatingHours as OperatingHoursSchema,
    DashboardStats, BookingReport,
    UserCreate, UserUpdate, User as UserSchema,
    RestaurantSettings, RestaurantSettingsUpdate
)
from ..services.admin_service import AdminService

router = APIRouter(tags=["admin"])
admin_service = AdminService()

# Restaurant Settings
@router.get("/restaurant-settings", response_model=RestaurantSettings)
async def get_restaurant_settings(
    db: Session = Depends(get_db)
):
    """Get restaurant settings (public endpoint)."""
    try:
        return admin_service.get_restaurant_settings(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving restaurant settings: {str(e)}"
        )

@router.put("/restaurant-settings", response_model=RestaurantSettings)
async def update_restaurant_settings(
    settings_data: RestaurantSettingsUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update restaurant settings (admin only)."""
    try:
        return admin_service.update_restaurant_settings(db, settings_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating restaurant settings: {str(e)}"
        )

# User Management
@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users."""
    try:
        return admin_service.get_all_users(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users: {str(e)}"
        )

@router.post("/users", response_model=UserSchema)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user."""
    try:
        return admin_service.create_user(db, user_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an existing user."""
    try:
        user = admin_service.update_user(db, user_id, user_data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (soft delete)."""
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        success = admin_service.delete_user(db, user_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )

@router.put("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Toggle user active/inactive status."""
    try:
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate your own account"
            )
        
        user = admin_service.toggle_user_status(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {"message": f"User status updated to {'active' if user.is_active else 'inactive'}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user status: {str(e)}"
        )

# Table Management
@router.post("/tables", response_model=TableSchema)
async def create_table(
    table_data: TableCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new table."""
    try:
        return admin_service.create_table(db, table_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating table: {str(e)}"
        )

@router.get("/tables", response_model=List[TableSchema])
async def get_all_tables(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all tables including inactive ones."""
    try:
        return admin_service.get_all_tables(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving tables: {str(e)}"
        )

@router.get("/tables/active", response_model=List[TableSchema])
async def get_active_tables(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get only active tables."""
    try:
        return admin_service.get_active_tables(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving active tables: {str(e)}"
        )

@router.put("/tables/{table_number}", response_model=TableSchema)
async def update_table(
    table_number: str,
    table_data: TableUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an existing table."""
    try:
        table = admin_service.update_table(db, table_number, table_data)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        return table
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating table: {str(e)}"
        )

@router.delete("/tables/all", response_model=bool)
async def delete_all_tables(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete all tables."""
    return admin_service.delete_all_tables(db)


@router.delete("/tables/{table_number}")
async def delete_table(
    table_number: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a table (soft delete)."""
    try:
        success = admin_service.delete_table(db, table_number)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Table not found"
            )
        return {"message": "Table deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting table: {str(e)}"
        )

# Room Layout Management
@router.post("/layouts", response_model=RoomLayoutSchema)
async def create_room_layout(
    layout_data: RoomLayoutCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new room layout."""
    try:
        return admin_service.create_room_layout(db, layout_data, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating room layout: {str(e)}"
        )

@router.get("/layouts", response_model=List[RoomLayoutSchema])
async def get_all_room_layouts(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all room layouts."""
    try:
        return admin_service.get_all_room_layouts(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving room layouts: {str(e)}"
        )

@router.get("/layouts/active", response_model=RoomLayoutSchema)
async def get_active_room_layout(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get the currently active room layout."""
    try:
        layout = admin_service.get_active_room_layout(db)
        if not layout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active room layout found"
            )
        return layout
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving active room layout: {str(e)}"
        )

@router.put("/layouts/{layout_id}", response_model=RoomLayoutSchema)
async def update_room_layout(
    layout_id: int,
    layout_data: RoomLayoutUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an existing room layout."""
    try:
        layout = admin_service.update_room_layout(db, layout_id, layout_data)
        if not layout:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room layout not found"
            )
        return layout
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating room layout: {str(e)}"
        )
# delete room layout
@router.delete("/layouts/{layout_id}")
async def delete_room_layout(
    layout_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a room layout."""
    return admin_service.delete_room_layout(db, layout_id)

# Time Slot Management
@router.post("/time-slots", response_model=TimeSlotSchema)
async def create_time_slot(
    start_time: str,
    end_time: str,
    duration: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new time slot."""
    try:
        return admin_service.create_time_slot(db, start_time, end_time, duration)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating time slot: {str(e)}"
        )

@router.get("/time-slots", response_model=List[TimeSlotSchema])
async def get_all_time_slots(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all time slots."""
    try:
        return admin_service.get_all_time_slots(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving time slots: {str(e)}"
        )

# Operating Hours Management
@router.put("/operating-hours/{day_of_week}")
async def update_operating_hours(
    day_of_week: int,
    opening_time: str,
    closing_time: str,
    is_open: bool,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update operating hours for a specific day."""
    try:
        if day_of_week < 0 or day_of_week > 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Day of week must be between 0 (Monday) and 6 (Sunday)"
            )
        
        return admin_service.update_operating_hours(db, day_of_week, opening_time, closing_time, is_open)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating operating hours: {str(e)}"
        )

@router.get("/operating-hours", response_model=List[OperatingHoursSchema])
async def get_operating_hours(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all operating hours."""
    try:
        return admin_service.get_operating_hours(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving operating hours: {str(e)}"
        )

# Dashboard and Reporting
@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics."""
    try:
        return admin_service.get_dashboard_stats(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard stats: {str(e)}"
        )

@router.get("/reports/bookings", response_model=BookingReport)
async def get_booking_report(
    start_date: date,
    end_date: date,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get booking report for a date range."""
    try:
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date must be before or equal to end date"
            )
        
        return admin_service.get_booking_report(db, start_date, end_date)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating booking report: {str(e)}"
        )

@router.get("/users/stats")
async def get_user_management_stats(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user management statistics."""
    try:
        return admin_service.get_user_management_data(db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user management stats: {str(e)}"
        )
