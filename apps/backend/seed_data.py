#!/usr/bin/env python3
"""
Data seeding script for Table Booking System
Run this script to populate the database with initial sample data
"""

import sys
import os
from datetime import datetime, time
from sqlalchemy.orm import Session

# Add the app directory to the Python path
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
# from app.models import User, Table, TimeSlot, OperatingHours, RoomLayout  # Commented out to prevent SQLAlchemy caching issues
from app.auth import get_password_hash

def seed_data():
    """Seed the database with initial data."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("🌱 Starting database seeding...")
        
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  Database already contains data. Skipping seeding.")
            return
        
        # 1. Create Admin User
        print("👤 Creating admin user...")
        admin_user = User(
            username="admin",
            email="admin@restaurant.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Administrator",
            phone="+1234567890",
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        
        # 2. Create Sample Users
        print("👥 Creating sample users...")
        sample_users = [
            User(
                username="john_doe",
                email="john@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="John Doe",
                phone="+1234567891",
                role="system_user",
                is_active=True
            ),
            User(
                username="jane_smith",
                email="jane@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Jane Smith",
                phone="+1234567892",
                role="system_user",
                is_active=True
            )
        ]
        for user in sample_users:
            db.add(user)
        
        # 3. Create Tables
        print("🪑 Creating restaurant tables...")
        tables = [
            Table(
                table_number="T1",
                name="Window Table 1",
                seats=2,
                location_x=100.0,
                location_y=150.0,
                table_type="round",
                is_active=True
            ),
            Table(
                table_number="T2",
                name="Window Table 2",
                seats=4,
                location_x=250.0,
                location_y=150.0,
                table_type="rectangle",
                is_active=True
            ),
            Table(
                table_number="T3",
                name="Center Table 1",
                seats=6,
                location_x=400.0,
                location_y=200.0,
                table_type="rectangle",
                is_active=True
            ),
            Table(
                table_number="T4",
                name="Bar Table 1",
                seats=2,
                location_x=500.0,
                location_y=100.0,
                table_type="round",
                is_active=True
            ),
            Table(
                table_number="T5",
                name="Private Table 1",
                seats=8,
                location_x=600.0,
                location_y=300.0,
                table_type="rectangle",
                is_active=True
            )
        ]
        for table in tables:
            db.add(table)
        
        # 4. Create Time Slots
        print("⏰ Creating time slots...")
        time_slots = [
            TimeSlot(start_time="11:00", end_time="12:00", slot_duration=60),
            TimeSlot(start_time="12:00", end_time="13:00", slot_duration=60),
            TimeSlot(start_time="13:00", end_time="14:00", slot_duration=60),
            TimeSlot(start_time="17:00", end_time="18:00", slot_duration=60),
            TimeSlot(start_time="18:00", end_time="19:00", slot_duration=60),
            TimeSlot(start_time="19:00", end_time="20:00", slot_duration=60),
            TimeSlot(start_time="20:00", end_time="21:00", slot_duration=60),
            TimeSlot(start_time="21:00", end_time="22:00", slot_duration=60)
        ]
        for slot in time_slots:
            db.add(slot)
        
        # 5. Create Operating Hours
        print("🕒 Creating operating hours...")
        operating_hours = [
            OperatingHours(day_of_week=0, opening_time="11:00", closing_time="22:00", is_open=True),  # Monday
            OperatingHours(day_of_week=1, opening_time="11:00", closing_time="22:00", is_open=True),  # Tuesday
            OperatingHours(day_of_week=2, opening_time="11:00", closing_time="22:00", is_open=True),  # Wednesday
            OperatingHours(day_of_week=3, opening_time="11:00", closing_time="22:00", is_open=True),  # Thursday
            OperatingHours(day_of_week=4, opening_time="11:00", closing_time="23:00", is_open=True),  # Friday
            OperatingHours(day_of_week=5, opening_time="11:00", closing_time="23:00", is_open=True),  # Saturday
            OperatingHours(day_of_week=6, opening_time="11:00", closing_time="21:00", is_open=True)   # Sunday
        ]
        for hours in operating_hours:
            db.add(hours)
        
        # 6. Create Default Room Layout
        print("🏠 Creating default room layout...")
        default_layout = RoomLayout(
            name="Default Layout",
            layout_data={
                "tables": [
                    {"id": 1, "x": 100, "y": 150, "table_number": "T1", "seats": 2},
                    {"id": 2, "x": 250, "y": 150, "table_number": "T2", "seats": 4},
                    {"id": 3, "x": 400, "y": 200, "table_number": "T3", "seats": 6},
                    {"id": 4, "x": 500, "y": 100, "table_number": "T4", "seats": 2},
                    {"id": 5, "x": 600, "y": 300, "table_number": "T5", "seats": 8}
                ],
                "dimensions": {"width": 800, "height": 600},
                "background": "restaurant-floor.jpg"
            },
            is_active=True
        )
        db.add(default_layout)
        
        # Commit all changes
        db.commit()
        print("✅ Database seeded successfully!")
        print("\n📋 Sample Data Created:")
        print("   • 1 Admin user (admin/admin123)")
        print("   • 2 Sample users (john_doe/password123, jane_smith/password123)")
        print("   • 5 Restaurant tables")
        print("   • 8 Time slots (11:00-22:00)")
        print("   • 7 Operating hours (Mon-Sun)")
        print("   • 1 Default room layout")
        print("\n🔑 Login Credentials:")
        print("   Admin: admin@restaurant.com / admin123")
        print("   User: john@example.com / password123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def main():
    """Main function to run the seeding."""
    try:
        seed_data()
    except Exception as e:
        print(f"❌ Failed to seed database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
