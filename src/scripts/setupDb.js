require('dotenv').config({ path: '.env.development' });
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: msg => logger.debug(msg)
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Run migrations
    const { exec } = require('child_process');
    exec('npx sequelize-cli db:migrate', (error, stdout, stderr) => {
      if (error) {
        logger.error(`Migration error: ${error.message}`);
        return;
      }
      if (stderr) {
        logger.error(`Migration stderr: ${stderr}`);
        return;
      }
      logger.info(`Migration stdout: ${stdout}`);
    });
    
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();
