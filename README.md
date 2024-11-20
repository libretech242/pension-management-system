# Pension Management System

A comprehensive system for managing pension contributions, employee data, and generating reports.

## Features

- Employee data management with NIB Number tracking
- Automated pension contribution calculations
- Role-based access control
- Interactive dashboards and reports
- Export capabilities (Excel, CSV, PDF)
- Email notifications
- Microsoft Graph API integration for file monitoring
- Advanced query capabilities with filtering, sorting, and pagination
- Comprehensive input validation
- Standardized API responses
- Bulk data upload support

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

4. Set up the database:
   ```bash
   # Create PostgreSQL database
   createdb pension_db
   
   # Run migrations
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
pension-management-system/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── middleware/      # Custom middleware
│   │   └── validation/  # Input validation
│   ├── utils/          # Helper functions
│   └── server.js       # Main application file
├── client/            # React frontend (to be added)
├── tests/            # Test files
└── package.json
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/reset-password` - Password reset request
- `PUT /api/auth/update-password` - Update password

### Employee Endpoints

- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Pension Endpoints

- `GET /api/pension/contributions` - List contributions
- `POST /api/pension/contributions` - Create contribution
- `GET /api/pension/contributions/:id` - Get contribution details
- `PUT /api/pension/contributions/:id` - Update contribution
- `POST /api/pension/calculate` - Calculate pension

### Payroll Endpoints

- `POST /api/payroll/entry` - Create payroll entry
- `GET /api/payroll/:startDate/:endDate` - Get payroll by period
- `PUT /api/payroll/:id` - Update payroll entry

### Report Endpoints

- `GET /api/reports/generate` - Generate reports
- `GET /api/reports/:reportId` - Get report status
- `GET /api/reports/download/:reportId` - Download report

### Upload Endpoints

- `POST /api/upload/bulk` - Bulk data upload
- `GET /api/upload/status/:uploadId` - Check upload status

## Query Parameters

All list endpoints support the following query parameters:

- `page` (number) - Page number for pagination
- `limit` (number) - Items per page
- `sort` (string) - Sort field and direction (e.g., `lastName:asc`)
- `search` (string) - Search term
- `filter` (object) - Filter criteria
- `startDate` (date) - Start date for date range
- `endDate` (date) - End date for date range

Example:
```
GET /api/employees?page=1&limit=10&sort=lastName:asc&search=john
```

## Validation Rules

### Employee Validation
- First name and last name: 2-50 characters
- NIB number: 8-12 alphanumeric characters
- Age: Must be between 16-100 years
- Email: Valid email format
- Phone: Valid phone number format

### Pension Validation
- Contribution amount: Positive number
- Date range: Valid ISO dates
- Employee ID: Must exist in system

### Payroll Validation
- Gross pay: Positive number
- Pension contribution: Cannot exceed 50% of gross pay
- Pay period: Valid ISO date

### File Upload Validation
- File types: CSV, Excel
- Maximum file size: 10MB
- Required fields based on upload type

## Security

- JWT-based authentication
- Role-based access control (Admin, Manager, User)
- Data encryption at rest and in transit
- Secure password hashing with bcrypt
- Rate limiting
- Input sanitization
- XSS protection
- CORS configuration

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2024-01-19T12:00:00Z"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
