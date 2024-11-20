# Pension Management System Deployment Guide

## Prerequisites

### System Requirements
- Node.js >= 16.x
- PostgreSQL >= 13
- Redis >= 6.2
- Docker (optional)
- Nginx (for production)

### Environment Setup
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Configure environment variables:
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=pension_db
   DB_USER=pension_user
   DB_PASSWORD=your_password

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_redis_password

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRY=24h

   # API
   API_PORT=3000
   API_URL=http://localhost:3000
   CORS_ORIGIN=http://localhost:3001

   # Client
   CLIENT_PORT=3001
   REACT_APP_API_URL=http://localhost:3000
   ```

## Development Deployment

1. **Install Dependencies**
   ```bash
   # Backend
   cd server
   npm install

   # Frontend
   cd client
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create database
   psql -U postgres -c "CREATE DATABASE pension_db"
   
   # Run migrations
   npm run migrate
   
   # Seed initial data (optional)
   npm run seed
   ```

3. **Start Development Servers**
   ```bash
   # Backend
   cd server
   npm run dev

   # Frontend
   cd client
   npm start
   ```

## Production Deployment

### 1. Backend Deployment

1. **Build the Application**
   ```bash
   cd server
   npm run build
   ```

2. **Configure PM2**
   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Start the application
   pm2 start ecosystem.config.js
   ```

3. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name api.pension-system.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 2. Frontend Deployment

1. **Build the Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Configure Nginx for Frontend**
   ```nginx
   server {
       listen 80;
       server_name pension-system.com;
       root /var/www/pension-system/client/build;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://api.pension-system.com;
       }
   }
   ```

### 3. Database Setup

1. **Create Production Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE pension_db_prod"
   ```

2. **Run Migrations**
   ```bash
   NODE_ENV=production npm run migrate
   ```

3. **Configure Backup Strategy**
   ```bash
   # Add to crontab
   0 0 * * * pg_dump -U postgres pension_db_prod > /backup/pension_$(date +\%Y\%m\%d).sql
   ```

### 4. Redis Setup

1. **Configure Redis**
   ```bash
   # Edit redis.conf
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   ```

2. **Enable Persistence**
   ```bash
   # In redis.conf
   appendonly yes
   appendfsync everysec
   ```

## Monitoring & Maintenance

### 1. Setup Monitoring

1. **Install Prometheus & Grafana**
   ```bash
   docker-compose -f monitoring/docker-compose.yml up -d
   ```

2. **Configure Alerts**
   ```yaml
   # prometheus/alerts.yml
   groups:
     - name: pension-system
       rules:
         - alert: HighResponseTime
           expr: http_request_duration_seconds > 2
           for: 5m
   ```

### 2. Backup Strategy

1. **Database Backups**
   - Daily full backups
   - Hourly WAL archiving
   - 30-day retention

2. **Application Backups**
   - Configuration files
   - Uploaded documents
   - Logs

### 3. Scaling Guidelines

1. **Horizontal Scaling**
   - Load balancer configuration
   - Session management
   - Cache synchronization

2. **Vertical Scaling**
   - Resource monitoring
   - Performance tuning
   - Database optimization

## Troubleshooting

### Common Issues

1. **Database Connections**
   - Check connection pool settings
   - Verify credentials
   - Check network connectivity

2. **Cache Issues**
   - Clear Redis cache
   - Check cache hit rates
   - Verify cache invalidation

3. **Performance Issues**
   - Check slow query logs
   - Monitor resource usage
   - Review application logs

### Support Contacts

- Technical Support: tech@pension-system.com
- Emergency Contact: emergency@pension-system.com
- On-Call Schedule: [Internal Link]
