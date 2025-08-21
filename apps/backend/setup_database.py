#!/usr/bin/env python3
"""
Script to set up the database with the correct structure:
- tables.table_number as primary key
- All foreign keys reference table_number instead of id
"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "table_booking")
DB_USER = os.getenv("DB_USER", "table_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "table_password")

def get_db_connection():
    """Create a database connection."""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def setup_database():
    """Set up the database with the correct structure."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("Setting up database with correct structure...")
        
        # Drop existing tables if they exist (in correct order due to foreign keys)
        print("Dropping existing tables...")
        cursor.execute("DROP TABLE IF EXISTS notifications CASCADE")
        cursor.execute("DROP TABLE IF EXISTS table_blocks CASCADE")
        cursor.execute("DROP TABLE IF EXISTS bookings CASCADE")
        cursor.execute("DROP TABLE IF EXISTS room_layouts CASCADE")
        cursor.execute("DROP TABLE IF EXISTS tables CASCADE")
        cursor.execute("DROP TABLE IF EXISTS users CASCADE")
        cursor.execute("DROP TABLE IF EXISTS time_slots CASCADE")
        cursor.execute("DROP TABLE IF EXISTS operating_hours CASCADE")
        cursor.execute("DROP TABLE IF EXISTS restaurant_settings CASCADE")
        print("✓ Dropped existing tables")
        
        # Create tables in the correct order
        print("\nCreating tables with correct structure...")
        
        # Create restaurant_settings table
        cursor.execute("""
            CREATE TABLE restaurant_settings (
                id SERIAL PRIMARY KEY,
                restaurant_name VARCHAR(255) NOT NULL DEFAULT 'Restaurant Name',
                address VARCHAR(500) NOT NULL DEFAULT '123 Main Street, City, State 12345',
                phone VARCHAR(50),
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created restaurant_settings table")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR UNIQUE NOT NULL,
                email VARCHAR UNIQUE NOT NULL,
                hashed_password VARCHAR NOT NULL,
                full_name VARCHAR NOT NULL,
                phone VARCHAR NOT NULL,
                role VARCHAR DEFAULT 'system_user',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created users table")
        
        # Create tables table with table_number as primary key
        cursor.execute("""
            CREATE TABLE tables (
                table_number VARCHAR PRIMARY KEY,
                name VARCHAR NOT NULL,
                seats INTEGER NOT NULL,
                location_x FLOAT NOT NULL,
                location_y FLOAT NOT NULL,
                table_type VARCHAR NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created tables table with table_number as primary key")
        
        # Create time_slots table
        cursor.execute("""
            CREATE TABLE time_slots (
                id SERIAL PRIMARY KEY,
                start_time VARCHAR NOT NULL,
                end_time VARCHAR NOT NULL,
                slot_duration INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created time_slots table")
        
        # Create operating_hours table
        cursor.execute("""
            CREATE TABLE operating_hours (
                id SERIAL PRIMARY KEY,
                day_of_week INTEGER NOT NULL,
                opening_time VARCHAR NOT NULL,
                closing_time VARCHAR NOT NULL,
                is_open BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created operating_hours table")
        
        # Create bookings table with table_number foreign key
        cursor.execute("""
            CREATE TABLE bookings (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                table_number VARCHAR NOT NULL REFERENCES tables(table_number),
                booking_date TIMESTAMP NOT NULL,
                start_time VARCHAR NOT NULL,
                end_time VARCHAR NOT NULL,
                guest_name VARCHAR NOT NULL,
                guest_phone VARCHAR NOT NULL,
                number_of_people INTEGER NOT NULL,
                special_occasion TEXT,
                status VARCHAR DEFAULT 'confirmed',
                source VARCHAR DEFAULT 'web',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created bookings table with table_number foreign key")
        
        # Create table_blocks table with table_number foreign key
        cursor.execute("""
            CREATE TABLE table_blocks (
                id SERIAL PRIMARY KEY,
                table_number VARCHAR NOT NULL REFERENCES tables(table_number),
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                reason TEXT NOT NULL,
                created_by INTEGER NOT NULL REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created table_blocks table with table_number foreign key")
        
        # Create room_layouts table
        cursor.execute("""
            CREATE TABLE room_layouts (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                layout_data JSON NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("✓ Created room_layouts table")
        
        # Create notifications table
        cursor.execute("""
            CREATE TABLE notifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                booking_id INTEGER NOT NULL REFERENCES bookings(id),
                type VARCHAR NOT NULL,
                message TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_sent BOOLEAN DEFAULT FALSE
            )
        """)
        print("✓ Created notifications table")
        
        # Create indexes for better performance
        print("\nCreating indexes...")
        cursor.execute("CREATE INDEX idx_tables_table_number ON tables(table_number)")
        cursor.execute("CREATE INDEX idx_bookings_table_number ON bookings(table_number)")
        cursor.execute("CREATE INDEX idx_bookings_user_id ON bookings(user_id)")
        cursor.execute("CREATE INDEX idx_bookings_date ON bookings(booking_date)")
        cursor.execute("CREATE INDEX idx_table_blocks_table_number ON table_blocks(table_number)")
        cursor.execute("CREATE INDEX idx_users_username ON users(username)")
        cursor.execute("CREATE INDEX idx_users_email ON users(email)")
        print("✓ Created indexes")
        
        # Insert sample data
        print("\nInserting sample data...")
        
        # Insert default restaurant settings
        cursor.execute("""
            INSERT INTO restaurant_settings (restaurant_name, address, phone)
            VALUES ('Restaurant Name', '123 Main Street, City, State 12345', '(555) 123-4567')
        """)
        print("✓ Inserted default restaurant settings")
        
        # Insert default time slots
        time_slots = [
            ("11:00", "12:00", 60),
            ("12:00", "13:00", 60),
            ("13:00", "14:00", 60),
            ("14:00", "15:00", 60),
            ("15:00", "16:00", 60),
            ("16:00", "17:00", 60),
            ("17:00", "18:00", 60),
            ("18:00", "19:00", 60),
            ("19:00", "20:00", 60),
            ("20:00", "21:00", 60),
            ("21:00", "22:00", 60)
        ]
        
        for start_time, end_time, duration in time_slots:
            cursor.execute("""
                INSERT INTO time_slots (start_time, end_time, slot_duration)
                VALUES (%s, %s, %s)
            """, (start_time, end_time, duration))
        print("✓ Inserted default time slots")
        
        # Insert default operating hours
        for day in range(7):
            cursor.execute("""
                INSERT INTO operating_hours (day_of_week, opening_time, closing_time, is_open)
                VALUES (%s, '09:00', '22:00', TRUE)
            """, (day,))
        print("✓ Inserted default operating hours")
        
        # Insert sample tables
        sample_tables = [
            ("A1", "Table A1", 4, 100.0, 100.0, "rectangle"),
            ("A2", "Table A2", 4, 200.0, 100.0, "rectangle"),
            ("A3", "Table A3", 6, 300.0, 100.0, "rectangle"),
            ("B1", "Table B1", 2, 100.0, 200.0, "round"),
            ("B2", "Table B2", 2, 200.0, 200.0, "round"),
            ("B3", "Table B3", 4, 300.0, 200.0, "rectangle"),
            ("C1", "Table C1", 8, 100.0, 300.0, "rectangle"),
            ("C2", "Table C2", 6, 200.0, 300.0, "rectangle"),
            ("C3", "Table C3", 4, 300.0, 300.0, "round"),
            ("VIP1", "VIP Table 1", 6, 400.0, 100.0, "rectangle")
        ]
        
        for table_number, name, seats, x, y, table_type in sample_tables:
            cursor.execute("""
                INSERT INTO tables (table_number, name, seats, location_x, location_y, table_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (table_number, name, seats, x, y, table_type))
        print("✓ Inserted sample tables")
        
        # Insert admin user
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, full_name, phone, role)
            VALUES ('admin', 'admin@restaurant.com', 'sha256$$6$$rounds=656000$$hash_here', 'Administrator', '555-0001', 'admin')
        """)
        print("✓ Inserted admin user")
        
        # Commit all changes
        conn.commit()
        print("\n✓ Database setup completed successfully!")
        
        # Show final structure
        cursor.execute("""
            SELECT table_name, column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tables' AND table_schema = 'public'
            ORDER BY ordinal_position
        """)
        
        print("\nFinal tables table structure:")
        for row in cursor.fetchall():
            column_name, data_type, is_nullable, column_default = row
            nullable = "NULL" if is_nullable == "YES" else "NOT NULL"
            default = f" DEFAULT {column_default}" if column_default else ""
            print(f"  {column_name}: {data_type} {nullable}{default}")
        
        # Verify foreign key constraints
        cursor.execute("""
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND ccu.table_name = 'tables'
        """)
        
        foreign_keys = cursor.fetchall()
        print(f"\nForeign key constraints to tables.table_number:")
        for fk in foreign_keys:
            print(f"  {fk[0]}: {fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]}")
        
    except Exception as e:
        conn.rollback()
        print(f"Error setting up database: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    try:
        setup_database()
        print("\nDatabase setup completed successfully!")
        print("The database now uses table_number as the primary key.")
        print("All foreign key references have been updated accordingly.")
    except Exception as e:
        print(f"Failed to set up database: {e}")
        exit(1)
