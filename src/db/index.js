const knex = require('knex');
const config = require('../../knexfile');

// Determine which configuration to use based on environment
const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

// Create the database instance
const db = knex(connectionConfig);

// Helper function to check database connection
const checkConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

module.exports = {
  db,
  checkConnection
};
