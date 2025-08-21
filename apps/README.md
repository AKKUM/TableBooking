# Table Reservation Booking System

A comprehensive, full-stack table reservation system built with Python FastAPI backend and React TypeScript frontend, featuring real-time table availability, user management, and admin controls.

## 🚀 Features

### System User Features
- **Landing Page**: View all tables with real-time availability for selected dates and times
- **Table Booking**: Interactive booking system with guest information and special requests
- **User Dashboard**: Personal booking management, statistics, and history
- **Mobile Responsive**: Optimized for web, tablet, and mobile devices

### Admin User Features
- **Room Layout Designer**: Drag-and-drop interface for restaurant layouts
- **Table Management**: Create, update, and configure tables with seating and positioning
- **Time Slot Configuration**: Flexible time slot and operating hours management
- **Reporting Dashboard**: Comprehensive analytics and booking reports
- **User Management**: Monitor system users and their activities

### Technical Features
- **Thread-Safe Booking**: Redis-based locking prevents double bookings
- **RESTful API**: Comprehensive backend with full CRUD operations
- **Real-Time Updates**: Instant availability updates across all clients
- **Authentication**: JWT-based security with role-based access control
- **Database**: PostgreSQL with SQLAlchemy ORM and Alembic migrations
- **Caching**: Redis for performance optimization and session management

## 🏗️ Architecture

```
├── backend/                 # Python FastAPI Backend
│   ├── app/
│   │   ├── api/            # API endpoints and routes
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── auth.py         # Authentication utilities
│   │   ├── config.py       # Configuration management
│   │   └── database.py     # Database connection
│   ├── alembic/            # Database migrations
│   ├── requirements.txt     # Python dependencies
│   └── start.py            # Application entry point
│
├── frontend/                # React TypeScript Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── index.css       # Tailwind CSS styles
│   ├── package.json        # Node.js dependencies
│   └── tailwind.config.js  # Tailwind configuration
│
└── README.md               # Project documentation
```

## 🛠️ Technology Stack

### Backend
- **Python 3.8+** - Core programming language
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and session storage
- **Alembic** - Database migrations
- **JWT** - Authentication tokens
- **Pydantic** - Data validation

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis 6+
- pip and npm

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TableBooking
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
createdb table_booking
alembic upgrade head

# Start Redis server
redis-server

# Run the application
python start.py
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost/table_booking
SECRET_KEY=your-super-secret-key
REDIS_URL=redis://localhost:6379
SMTP_SERVER=smtp.gmail.com
TWILIO_ACCOUNT_SID=your-twilio-sid
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

### Database Setup
```sql
CREATE DATABASE table_booking;
CREATE USER table_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE table_booking TO table_user;
```

## 📱 Usage

### For System Users
1. **Browse Tables**: Visit the landing page to see available tables
2. **Select Date/Time**: Choose your preferred reservation slot
3. **Book Table**: Click on an available table to make a reservation
4. **Manage Bookings**: Access your dashboard to view and cancel bookings

### For Administrators
1. **Dashboard**: Monitor system statistics and recent activity
2. **Table Management**: Add, edit, and configure restaurant tables
3. **Layout Design**: Create custom room layouts with drag-and-drop
4. **Reports**: Generate booking analytics and occupancy reports

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Separate permissions for users and admins
- **Password Hashing**: Bcrypt encryption for user passwords
- **Input Validation**: Comprehensive data validation with Pydantic
- **CORS Protection**: Configurable cross-origin resource sharing

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/token` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Bookings
- `GET /api/v1/bookings/tables` - Get table availability
- `POST /api/v1/bookings/` - Create booking
- `GET /api/v1/bookings/my-bookings` - Get user bookings
- `PUT /api/v1/bookings/{id}` - Update booking
- `DELETE /api/v1/bookings/{id}` - Cancel booking

### Admin
- `POST /api/v1/admin/tables` - Create table
- `GET /api/v1/admin/tables` - Get all tables
- `POST /api/v1/admin/layouts` - Create room layout
- `GET /api/v1/admin/dashboard/stats` - Get dashboard stats

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
pytest --cov=app
```

### Frontend Testing
```bash
cd frontend
npm test
npm run build
```

## 🚀 Deployment

### Backend Deployment
```bash
# Production server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Docker
docker build -t table-booking-backend .
docker run -p 8000:8000 table-booking-backend
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy build folder to your hosting service
```

## 🔄 Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 📈 Performance Features

- **Redis Caching**: Table availability caching for fast responses
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Async Operations**: Non-blocking API operations
- **Compression**: Gzip compression for API responses

## 🛡️ Error Handling

- **Comprehensive Logging**: Detailed error tracking and monitoring
- **User-Friendly Messages**: Clear error messages for end users
- **Graceful Degradation**: System continues functioning during partial failures
- **Input Validation**: Prevents invalid data from reaching the database

## 🔧 Customization

### Adding New Features
1. **Backend**: Add models, schemas, and API endpoints
2. **Frontend**: Create components and integrate with API
3. **Database**: Run migrations for schema changes

### Styling
- **Tailwind CSS**: Modify `tailwind.config.js` for custom themes
- **Component Styles**: Update CSS classes in `index.css`
- **Responsive Design**: Adjust breakpoints and mobile layouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint for API documentation
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions for help and ideas

## 🔮 Roadmap

- [ ] Email/SMS notifications
- [ ] Waitlist functionality
- [ ] Multi-language support
- [ ] POS system integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Payment processing integration

## 🙏 Acknowledgments

- FastAPI team for the excellent web framework
- React team for the powerful UI library
- Tailwind CSS for the utility-first CSS framework
- PostgreSQL and Redis communities for robust data solutions

---

**Built with ❤️ for modern restaurant management**
