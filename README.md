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
│   ├── utils/           # Helper functions
│   └── server.js        # Main application file
├── client/             # React frontend (to be added)
├── tests/             # Test files
└── package.json
```

## API Documentation

### Employee Endpoints

- `GET /api/employees` - List all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee details
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Pension Endpoints

- `GET /api/pension/contributions` - List contributions
- `POST /api/pension/calculate` - Calculate pension
- `GET /api/pension/reports` - Generate reports

## Security

- JWT-based authentication
- Role-based access control
- Data encryption
- Secure password hashing

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
