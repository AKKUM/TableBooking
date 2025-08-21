#!/usr/bin/env python3
"""
Database status checker for Table Booking System
Run this script to see the current state of your database
"""

import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.dirname(__file__))

from app.database import SessionLocal
from sqlalchemy import text

def check_database_status():
    """Check the current status of the database."""
    db = SessionLocal()
    try:
        print("🔍 Checking database status...")
        print("=" * 50)
        
        # Check if tables exist and their row counts
        tables_to_check = [
            "users", "tables", "bookings", "time_slots", 
            "operating_hours", "room_layouts", "table_blocks"
        ]
        
        for table_name in tables_to_check:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
                count = result.scalar()
                status = "✅" if count > 0 else "❌"
                print(f"{status} {table_name}: {count} rows")
            except Exception as e:
                print(f"❌ {table_name}: Table doesn't exist or error - {e}")
        
        print("=" * 50)
        
        # Check specific data
        try:
            # Check users
            result = db.execute(text("SELECT username, email, role FROM users LIMIT 5"))
            users = result.fetchall()
            if users:
                print("\n👥 Users found:")
                for user in users:
                    print(f"   • {user[0]} ({user[1]}) - {user[2]}")
            else:
                print("\n👥 No users found")
            
            # Check tables
            result = db.execute(text("SELECT table_number, name, seats FROM tables LIMIT 5"))
            tables = result.fetchall()
            if tables:
                print("\n🪑 Tables found:")
                for table in tables:
                    print(f"   • {table[0]} - {table[1]} ({table[2]} seats)")
            else:
                print("\n🪑 No tables found")
                
        except Exception as e:
            print(f"\n❌ Error checking specific data: {e}")
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
    finally:
        db.close()

def main():
    """Main function to run the database check."""
    try:
        check_database_status()
    except Exception as e:
        print(f"❌ Failed to check database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
