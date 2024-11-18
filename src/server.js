require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const winston = require('winston');
const path = require('path');

// Initialize Express app
const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Database configuration
const sequelize = new Sequelize(process.env.DB_NAME || 'pension_db', 
                              process.env.DB_USER || 'postgres',
                              process.env.DB_PASSWORD || 'postgres', {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg)
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../client/build')));

// Routes
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/pension', require('./routes/payrollRoutes'));
app.use('/api/pensions', require('./routes/pensionRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const PORT = process.env.PORT || 3000;

// Database connection and server startup
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    
    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized.');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
