from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import datetime
import uvicorn

from app.database import get_db
from app.api import auth, admin, bookings
from app.models import User
from app.auth import get_current_active_user

app = FastAPI(
    title="Table Booking API",
    description="API for restaurant table booking system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint for AWS
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["bookings"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Table Booking API", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
