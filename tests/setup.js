const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const sequelize = require('../src/config/database.test');

beforeAll(async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Sync database and create tables
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Global test timeout
jest.setTimeout(30000);
