# Pension Management System API Documentation

## Overview
This document outlines the API endpoints, authentication requirements, and performance considerations for the Pension Management System.

## Authentication
All API endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Pension Report Endpoints

#### GET /api/pension/summary
Returns a summary of pension contributions.

**Query Parameters:**
- `startDate` (ISO date string): Start date for the report period
- `endDate` (ISO date string): End date for the report period
- `employeeId` (string, optional): Filter by specific employee

**Response:**
```json
{
  "data": {
    "summary": {
      "totalContributions": number,
      "employeeContributions": number,
      "employerContributions": number,
      "averageContribution": number
    },
    "details": [
      {
        "date": string,
        "amount": number,
        "type": "EMPLOYEE" | "EMPLOYER"
      }
    ]
  },
  "metadata": {
    "generatedAt": string,
    "filters": object
  }
}
```

#### GET /api/pension/employee/:employeeId/contributions
Returns detailed contribution history for a specific employee.

**Path Parameters:**
- `employeeId` (string): ID of the employee

**Query Parameters:**
- `startDate` (ISO date string, optional)
- `endDate` (ISO date string, optional)

**Response:**
```json
{
  "data": [
    {
      "id": string,
      "date": string,
      "amount": number,
      "type": "EMPLOYEE" | "EMPLOYER",
      "status": "PROCESSED" | "PENDING"
    }
  ],
  "metadata": {
    "totalCount": number,
    "page": number,
    "pageSize": number
  }
}
```

#### POST /api/pension/reports/export
Generates and returns a report file.

**Request Body:**
```json
{
  "format": "pdf" | "excel",
  "filters": {
    "startDate": string,
    "endDate": string,
    "employeeId": string,
    "reportType": "SUMMARY" | "DETAILED"
  }
}
```

**Response:**
- Content-Type: application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- File download stream

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": {
    "code": string,
    "message": string,
    "details": object
  }
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user
- Export endpoints: 10 requests per minute per user

## Caching Strategy
The API implements a multi-level caching strategy:

1. **In-Memory Cache (Redis)**
   - Summary reports: 5 minutes TTL
   - Individual contribution data: 10 minutes TTL
   - Cache invalidation on contribution updates

2. **API Response Caching**
   - ETag support for all GET endpoints
   - Cache-Control headers for public data
   - Conditional requests supported (If-None-Match)

3. **Database Query Caching**
   - Materialized views for common report queries
   - Automatic refresh every 6 hours
   - Manual refresh on significant data changes

## Performance Optimization

### Query Optimization
- Indexed fields: employeeId, contributionDate, type
- Composite indexes for common query patterns
- Partitioned tables by date range

### Response Optimization
- Pagination for large datasets (default: 50 items per page)
- Compressed responses (gzip)
- Selective field returns using GraphQL-style query parameters

### Monitoring
- Response time tracking per endpoint
- Cache hit/miss ratio monitoring
- Query performance logging
- Resource usage alerts
