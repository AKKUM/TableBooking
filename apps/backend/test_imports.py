#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test all critical imports"""
    try:
        print("Testing imports...")
        
        # Test basic packages
        import fastapi
        print("✓ FastAPI imported")
        
        import sqlalchemy
        print("✓ SQLAlchemy imported")
        
        import asyncpg
        print("✓ asyncpg imported")
        
        # Test app modules
        from app.config import settings
        print("✓ Config imported")
        
        from app.database import engine, Base
        print("✓ Database imported")
        
        from app.models import User
        print("✓ Models imported")
        
        from app.auth import authenticate_user
        print("✓ Auth imported")
        
        print("\n🎉 All imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    test_imports()
