const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Load test environment variables
require('dotenv').config({ path: '.env.test' });

const { sequelize } = require('../src/models');

beforeAll(async () => {
  // Sync database and create tables
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Global test timeout
jest.setTimeout(30000);
