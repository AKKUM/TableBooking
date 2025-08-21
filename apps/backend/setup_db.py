#!/usr/bin/env python3
"""
Database setup script for Table Booking System
This script will create the database and user if they don't exist
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

def setup_database():
    """Setup the database and user."""
    try:
        # Connect to PostgreSQL as superuser (default postgres database)
        print("🔌 Connecting to PostgreSQL...")
        conn = psycopg2.connect(
            host="localhost",
            user="postgres",
            password="",  # No password for local development
            database="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'table_booking'")
        if cursor.fetchone():
            print("✅ Database 'table_booking' already exists")
        else:
            print("📝 Creating database 'table_booking'...")
            cursor.execute("CREATE DATABASE table_booking")
            print("✅ Database 'table_booking' created successfully")
        
        # Check if user exists
        cursor.execute("SELECT 1 FROM pg_user WHERE usename = 'table_user'")
        if cursor.fetchone():
            print("✅ User 'table_user' already exists")
        else:
            print("👤 Creating user 'table_user'...")
            cursor.execute("CREATE USER table_user WITH PASSWORD 'table_password'")
            print("✅ User 'table_user' created successfully")
        
        # Grant privileges
        print("🔐 Granting privileges...")
        cursor.execute("GRANT ALL PRIVILEGES ON DATABASE table_booking TO table_user")
        cursor.execute("GRANT ALL PRIVILEGES ON SCHEMA public TO table_user")
        print("✅ Privileges granted successfully")
        
        cursor.close()
        conn.close()
        
        print("\n🎉 Database setup completed!")
        print("\n📋 Connection Details:")
        print("   Database: table_booking")
        print("   User: table_user")
        print("   Password: table_password")
        print("   Host: localhost")
        print("   Port: 5432")
        print("\n🔗 Connection String:")
        print("   postgresql://table_user:table_password@localhost/table_booking")
        
        # Create .env file with the new database configuration
        print("\n📝 Creating .env file...")
        env_content = """# Database Configuration
DATABASE_URL=postgresql://table_user:table_password@localhost/table_booking

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# App Configuration
APP_NAME=Table Reservation System
RESTAURANT_NAME=Your Restaurant Name
RESTAURANT_ADDRESS=123 Main St, City, State
"""
        
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ .env file created successfully")
        
    except psycopg2.OperationalError as e:
        print(f"❌ Connection error: {e}")
        print("\n💡 Make sure PostgreSQL is running and accessible")
        print("   Try: brew services start postgresql@14")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    setup_database()
