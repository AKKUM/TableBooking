# Table Reservation Booking System - Backend

A comprehensive table reservation system built with FastAPI, PostgreSQL, and Redis.

## Features

### System User Features
- View table availability for specific dates and time slots
- Book tables with guest information
- Manage personal bookings (view, update, cancel)
- Real-time table status updates

### Admin User Features
- Manage tables (create, update, delete)
- Design room layouts with drag-and-drop interface
- Configure time slots and operating hours
- View dashboard statistics and booking reports
- User management

### Technical Features
- Thread-safe booking system with Redis locks
- RESTful API with comprehensive documentation
- JWT-based authentication
- PostgreSQL database with SQLAlchemy ORM
- Redis caching for performance
- Comprehensive error handling

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- pip

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb table_booking
   
   # Run migrations
   alembic upgrade head
   ```

6. **Start Redis server**
   ```bash
   redis-server
   ```

## Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `REDIS_URL`: Redis connection string
- `SMTP_*`: Email configuration (optional)
- `TWILIO_*`: SMS configuration (optional)

### Database Setup

1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE table_booking;
   ```

2. Update `DATABASE_URL` in `.env`

3. Run migrations:
   ```bash
   alembic upgrade head
   ```

## Running the Application

### Development
```bash
python start.py
```

### Production
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## API Endpoints

### Authentication
- `POST /api/v1/auth/token` - Login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Bookings (System Users)
- `GET /api/v1/bookings/tables` - Get table availability
- `POST /api/v1/bookings/` - Create booking
- `GET /api/v1/bookings/my-bookings` - Get user bookings
- `GET /api/v1/bookings/{id}` - Get specific booking
- `PUT /api/v1/bookings/{id}` - Update booking
- `DELETE /api/v1/bookings/{id}` - Cancel booking

### Admin
- `POST /api/v1/admin/tables` - Create table
- `GET /api/v1/admin/tables` - Get all tables
- `PUT /api/v1/admin/tables/{id}` - Update table
- `DELETE /api/v1/admin/tables/{id}` - Delete table
- `POST /api/v1/admin/layouts` - Create room layout
- `GET /api/v1/admin/dashboard/stats` - Get dashboard stats
- `GET /api/v1/admin/reports/bookings` - Get booking report

## Database Models

- **User**: System users and administrators
- **Table**: Restaurant tables with positioning
- **Booking**: Table reservations
- **TimeSlot**: Available time slots
- **OperatingHours**: Restaurant operating hours
- **RoomLayout**: Drag-and-drop room layouts
- **TableBlock**: Table blocking for maintenance
- **Notification**: Booking notifications

## Architecture

### Services
- **BookingService**: Handles booking logic with thread safety
- **AdminService**: Manages admin operations

### Security
- JWT token-based authentication
- Role-based access control (system_user, admin)
- Password hashing with bcrypt

### Performance
- Redis caching for table availability
- Database connection pooling
- Optimized queries with SQLAlchemy

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app
```

## Deployment

### Docker
```bash
docker build -t table-booking-backend .
docker run -p 8000:8000 table-booking-backend
```

### Production Considerations
- Use environment-specific configurations
- Set up proper logging
- Configure CORS appropriately
- Use HTTPS
- Set up monitoring and health checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
