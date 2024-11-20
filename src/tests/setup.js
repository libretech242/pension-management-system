// Load test environment variables
require('./setEnvVars');

const { sequelize, testConnection } = require('../config/database');

// Global setup
beforeAll(async () => {
  // Connect to database
  await testConnection();
  
  // Sync database before tests with test schema
  await sequelize.createSchema('test', { force: true });
  await sequelize.sync({ force: true, schema: 'test' });
}, 30000);

// Global teardown
afterAll(async () => {
  // Drop test schema and close connection
  await sequelize.dropSchema('test', { force: true });
  await sequelize.close();
}, 30000);
