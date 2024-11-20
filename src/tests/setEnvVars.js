process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'noreply@test.com';
process.env.FRONTEND_URL = 'http://localhost:3000';

// Database configuration
process.env.DATABASE_URL = 'postgresql://pensionprodb_owner:Zs52EkQcaVgi@ep-lively-bonus-a8qahcur.eastus2.azure.neon.tech/pensionprodb?sslmode=require';
process.env.DB_HOST = 'ep-lively-bonus-a8qahcur.eastus2.azure.neon.tech';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'pensionprodb_owner';
process.env.DB_PASSWORD = 'Zs52EkQcaVgi';
process.env.DB_NAME = 'pensionprodb';
process.env.DB_SCHEMA = 'test';
process.env.DB_SSL = 'true';
