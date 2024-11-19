const { Sequelize } = require('sequelize');
require('dotenv').config();

const config = {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  schema: 'test' // Use a separate schema for tests
};

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  ...config,
  hooks: {
    beforeConnect: async (config) => {
      try {
        const tempSequelize = new Sequelize(process.env.DATABASE_URL, config);
        await tempSequelize.query('CREATE SCHEMA IF NOT EXISTS test;');
        await tempSequelize.close();
      } catch (error) {
        console.error('Error creating test schema:', error);
      }
    }
  }
});

module.exports = sequelize;
