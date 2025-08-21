from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from .database import engine, Base, refresh_metadata
from .api import auth, bookings, admin
from .config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    refresh_metadata()  # Force metadata refresh for new table structure
    # Skip table creation since tables already exist with new structure
    # Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    engine.dispose()

app = FastAPI(
    title=settings.APP_NAME,
    description="Comprehensive Table Reservation Booking System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint with system information."""
    return {
        "message": "Table Reservation Booking System API",
        "version": "1.0.0",
        "restaurant": settings.RESTAURANT_NAME,
        "address": settings.RESTAURANT_ADDRESS,
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "table-booking-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
