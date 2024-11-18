# Deployment Guide

## Overview
This document outlines the deployment process for the Pension Management System, including environment setup, database migrations, and monitoring.

## Prerequisites
- Docker and Docker Compose
- Node.js 16+
- PostgreSQL 14+
- AWS Account (for production deployment)
- PM2 (for process management)

## Environment Setup

1. Create environment files:
```bash
cp .env.example .env
```

2. Update the environment variables with your production values.

## Database Setup

1. Initial setup:
```bash
# Run migrations
psql -U ${DB_USER} -d ${DB_NAME} -f src/db/migrations/001_initial_schema.sql
```

2. Backup strategy:
- Daily automated backups via Docker container
- 7-day retention period
- Backups stored in `/backups` directory
- Manual backup command: `docker-compose exec backup pg_dump -h db -U ${DB_USER} ${DB_NAME} > backup_$(date +%Y%m%d).sql`

## Deployment Process

### Local Development
```bash
# Install dependencies
npm install
cd client && npm install

# Start development servers
npm run dev
```

### Production Deployment

1. Build and push Docker images:
```bash
docker-compose build
docker-compose up -d
```

2. Monitor services:
```bash
docker-compose ps
docker-compose logs -f
```

## CI/CD Pipeline

The system uses GitHub Actions for automated testing and deployment:

1. On push to main:
   - Runs tests
   - Builds Docker images
   - Deploys to production if tests pass

2. On pull requests:
   - Runs tests
   - Builds Docker images
   - Reports test coverage

## Process Management

PM2 is used for Node.js process management:

```bash
# Start production server
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

## Monitoring and Logging

1. Application logs:
   - Located in `logs/` directory
   - JSON format for easy parsing
   - Different log levels (error, warn, info, debug)

2. PM2 logs:
   - Located in `logs/pm2/`
   - Contains stdout and stderr
   - Includes timestamps and process IDs

3. Database logs:
   - PostgreSQL logs in container
   - Audit logs in database

## Backup and Recovery

1. Database backups:
   - Automated daily backups
   - Manual backup capability
   - 7-day retention policy

2. Recovery process:
```bash
# Restore from backup
psql -U ${DB_USER} -d ${DB_NAME} -f /backups/backup_file.sql
```

## Security Considerations

1. Environment variables:
   - Never commit .env files
   - Use secrets management in production
   - Rotate credentials regularly

2. Network security:
   - Internal services not exposed to internet
   - HTTPS required for all external access
   - Regular security updates

3. Access control:
   - Role-based access control
   - JWT authentication
   - Audit logging

## Troubleshooting

1. Container issues:
```bash
# View container logs
docker-compose logs [service_name]

# Restart services
docker-compose restart [service_name]
```

2. Database issues:
```bash
# Check database status
docker-compose exec db pg_isready

# Connect to database
docker-compose exec db psql -U ${DB_USER} -d ${DB_NAME}
```

3. Application issues:
```bash
# View PM2 logs
pm2 logs

# Restart application
pm2 restart pension-management-backend
```
