# Pension Management System API Documentation

## Base URL

All API endpoints are prefixed with `/api/v1`

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication via JWT token.

Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Common Response Format

All endpoints follow a standardized response format:

### Success Response
```json
{
  "status": "success",
  "code": 200,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-19T12:00:00Z"
}
```

### Error Response
```json
{
  "status": "error",
  "code": 400,
  "message": "Operation failed",
  "errors": [ ... ],
  "timestamp": "2024-01-19T12:00:00Z"
}
```

## Authentication Endpoints

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "admin"
    }
  }
}
```

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

## Employee Endpoints

### GET /employees
List employees with pagination and filtering.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `sort` (e.g., lastName:asc)
- `search`
- `company`
- `status`

**Response:**
```json
{
  "status": "success",
  "code": 200,
  "data": {
    "employees": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### POST /employees
Create a new employee.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "nibNumber": "AB1234567",
  "dateOfBirth": "1990-01-01",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "ACME Inc",
  "position": "Developer",
  "employeeType": "full-time"
}
```

## Pension Endpoints

### GET /pension/contributions
List pension contributions with filtering.

**Query Parameters:**
- `startDate`
- `endDate`
- `employeeId`
- `company`
- `status`
- `page`
- `limit`
- `sort`

### POST /pension/contributions
Create a new pension contribution.

**Request Body:**
```json
{
  "employeeId": 1,
  "amount": 1000.00,
  "contributionDate": "2024-01-19",
  "type": "employer",
  "payPeriod": "2024-01"
}
```

## Payroll Endpoints

### POST /payroll/entry
Create a new payroll entry.

**Request Body:**
```json
{
  "employeeId": 1,
  "payPeriod": "2024-01",
  "grossPay": 5000.00,
  "pensionContribution": 500.00,
  "deductions": [
    {
      "type": "tax",
      "amount": 1000.00
    }
  ]
}
```

## Report Endpoints

### GET /reports/generate
Generate a new report.

**Query Parameters:**
- `reportType` (summary, detailed, compliance, audit)
- `startDate`
- `endDate`
- `format` (pdf, excel, csv)
- `company`
- `employeeId`

**Response:**
```json
{
  "status": "success",
  "data": {
    "reportId": "uuid-here",
    "status": "processing",
    "estimatedCompletion": "2024-01-19T12:05:00Z"
  }
}
```

## Upload Endpoints

### POST /upload/bulk
Upload bulk data file.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: CSV or Excel file
  - `uploadType`: contributions, employees, payroll
  - `company`: Company name
  - `payPeriod`: YYYY-MM (optional)

**Response:**
```json
{
  "status": "success",
  "data": {
    "uploadId": "uuid-here",
    "status": "processing",
    "totalRecords": 100,
    "processedRecords": 0
  }
}
```

## Error Codes

- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

- Rate limit: 100 requests per minute
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Webhooks

Webhook notifications are available for:
- Bulk upload completion
- Report generation completion
- Large pension contributions
- Compliance alerts

Configure webhooks in the dashboard or via API.
