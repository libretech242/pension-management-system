require('dotenv').config({ path: '.env.test' });

// Set test environment variables if not set
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_session_secret';

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set in .env.test or CI environment');
}

// Add SSL configuration for Neon
process.env.DB_SSL = 'true';
