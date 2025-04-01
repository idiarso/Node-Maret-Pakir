# Development Guide

This guide provides information for developers working on the NodeTSpark parking management system.

## Development Environment Setup

### Prerequisites
- Node.js v18 or higher
- PostgreSQL v14 or higher
- Git
- VS Code (recommended)
- Docker (optional, for containerized development)

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/idiarso/NodeTSpark.git
cd NodeTSpark
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your local settings
```

4. Set up the database:
```bash
npm run setup:db
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/     # React components
├── services/      # Business logic and hardware services
├── pages/         # Page components
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── server/        # Backend server code
```

## Development Workflow

### Branch Strategy
- `main`: Production branch
- `develop`: Development branch
- Feature branches: `feature/feature-name`
- Bug fix branches: `fix/bug-name`
- Release branches: `release/v1.x.x`

### Commit Guidelines
- Use conventional commits:
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation changes
  - `style`: Code style changes
  - `refactor`: Code refactoring
  - `test`: Test changes
  - `chore`: Maintenance tasks

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write unit tests for new features
- Document complex logic

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## Hardware Integration

### Camera Setup
1. Configure camera IP in `.env`:
```
ENTRY_CAMERA_IP=192.168.2.5
EXIT_CAMERA_IP=192.168.2.7
```

2. Test camera connection:
```bash
npm run test:camera
```

### Printer Setup
1. Configure printer in `.env`:
```
PRINTER_PORT=COM3
PRINTER_BAUD_RATE=9600
```

2. Test printer:
```bash
npm run test:printer
```

### Barcode Scanner Setup
1. Configure scanner in `.env`:
```
SCANNER_PORT=COM4
SCANNER_BAUD_RATE=9600
```

2. Test scanner:
```bash
npm run test:scanner
```

## API Documentation

### Authentication
```typescript
// Login
POST /api/auth/login
{
  "email": string,
  "password": string
}

// Response
{
  "token": string,
  "user": {
    "id": number,
    "email": string,
    "name": string,
    "role": string
  }
}
```

### Tickets
```typescript
// Create ticket
POST /api/tickets
{
  "plateNumber": string,
  "vehicleType": string
}

// Get ticket
GET /api/tickets/:id

// Update ticket
PUT /api/tickets/:id
{
  "status": string,
  "amount": number
}
```

### Payments
```typescript
// Create payment
POST /api/payments
{
  "ticketId": number,
  "amount": number,
  "method": string
}

// Get payment
GET /api/payments/:id
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tickets Table
```sql
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  plate_number VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  status VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Payments Table
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Optimization

### Database Optimization
1. Use indexes for frequently queried columns
2. Implement connection pooling
3. Use prepared statements
4. Regular VACUUM and ANALYZE

### Application Optimization
1. Implement caching
2. Use pagination for large datasets
3. Optimize database queries
4. Implement rate limiting

## Security Best Practices

1. Input Validation
- Validate all user inputs
- Use parameterized queries
- Implement XSS protection

2. Authentication
- Use JWT tokens
- Implement token refresh
- Secure password storage

3. Authorization
- Role-based access control
- Resource-based permissions
- API endpoint protection

## Deployment

### Development
```bash
npm run dev
```

### Staging
```bash
npm run build
npm run start:staging
```

### Production
```bash
npm run build
npm run start:prod
```

## Troubleshooting

### Common Issues

1. Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connection
psql -U parking_user -d parking_system
```

2. Hardware Issues
```bash
# Check camera connection
ping 192.168.2.5
ping 192.168.2.7

# Check printer status
lpstat -p

# Check scanner connection
ls /dev/ttyUSB*
```

3. Application Issues
```bash
# Check logs
tail -f /var/log/parking-system/server.log

# Check process status
pm2 status
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Documentation](https://reactjs.org/docs)
- [Node.js Documentation](https://nodejs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/) 