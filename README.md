# Restaurant Booking System - Backend

A professional Node.js backend for restaurant booking management system with MySQL database.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Booking Management**: Full CRUD operations with conflict detection
- **Customer Management**: Customer profiles with booking history
- **Table Management**: Table availability and assignment system
- **Analytics**: Dashboard analytics and reporting
- **Real-time Notifications**: Booking alerts and reminders
- **Export Functionality**: CSV and JSON export options
- **Professional Logging**: Winston-based logging system
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling
- **Rate Limiting**: API protection against abuse
- **Database Migrations**: Structured database setup

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Installation

1. **Clone and setup**
```bash
git clone <repository-url>
cd restaurant-booking-backend
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database credentials and configuration
```

3. **Database Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE restaurant_booking;
EXIT;

# Run migrations (tables will be created automatically on first start)
npm run migrate
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

5. **Test the API**
```bash
curl http://localhost:3000/api/health
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `GET /api/auth/verify` - Verify token
- `POST /api/auth/change-password` - Change password

### Bookings
- `GET /api/bookings` - Get all bookings (with filters)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get specific booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `POST /api/bookings/batch` - Batch operations
- `GET /api/bookings/export` - Export bookings

### Customers
- `GET /api/customers/search` - Search customers
- `GET /api/customers` - Get all customers (paginated)
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

### Tables
- `GET /api/tables` - Get all tables
- `GET /api/tables/availability` - Check availability
- `GET /api/tables/:id` - Get table details

### Staff
- `GET /api/staff` - Get all staff members
- `GET /api/staff/:id` - Get staff member details

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/revenue` - Revenue analytics

### Notifications
- `GET /api/notifications` - Get system notifications

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── models/         # Data models (if using ORM)
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper utilities
└── database/       # Database migrations and schema
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT signing secret | Required |
| `DB_HOST` | Database host | localhost |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | Required |
| `DB_NAME` | Database name | restaurant_booking |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:8000 |

## Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Database Migrations
```bash
npm run migrate
```

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production database
4. Set up proper logging
5. Use process manager (PM2)
6. Set up reverse proxy (nginx)

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- JWT authentication with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection protection via parameterized queries
- CORS configuration
- Helmet.js security headers
- Request logging and monitoring

## Performance

- Connection pooling for database
- Compression middleware
- Efficient database queries with proper indexing
- Caching-ready structure
- Request rate limiting

## Monitoring & Logging

- Winston-based logging with rotation
- Error tracking and reporting  
- Performance monitoring hooks
- Health check endpoints
- Request/response logging
 # or edit a sentence
# Small tweak
