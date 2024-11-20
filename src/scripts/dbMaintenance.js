const cron = require('node-cron');
const DatabaseMonitor = require('../utils/dbMonitor');
const DatabaseBackup = require('../utils/dbBackup');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

class DatabaseMaintenance {
  constructor() {
    this.dbBackup = new DatabaseBackup();
  }

  async vacuum() {
    try {
      await sequelize.query('VACUUM ANALYZE;');
      logger.info('VACUUM ANALYZE completed successfully');
    } catch (error) {
      logger.error('Error during VACUUM ANALYZE', { error });
    }
  }

  async reindex() {
    try {
      await sequelize.query('REINDEX DATABASE current_database();');
      logger.info('Database reindexing completed successfully');
    } catch (error) {
      logger.error('Error during database reindexing', { error });
    }
  }

  async analyzeTables() {
    try {
      await sequelize.query('ANALYZE VERBOSE;');
      logger.info('Table analysis completed successfully');
    } catch (error) {
      logger.error('Error during table analysis', { error });
    }
  }

  async performMaintenance() {
    try {
      // Create backup before maintenance
      await this.dbBackup.createBackup();
      
      // Perform maintenance tasks
      await this.vacuum();
      await this.reindex();
      await this.analyzeTables();
      
      // Monitor database state after maintenance
      const monitoringResults = await DatabaseMonitor.monitorDatabase();
      logger.info('Maintenance completed successfully', { monitoringResults });
      
      // Clean up old backups
      await this.dbBackup.cleanOldBackups();
    } catch (error) {
      logger.error('Error during maintenance routine', { error });
      throw error;
    }
  }

  scheduleMaintenanceTasks() {
    // Daily backup at 1 AM
    cron.schedule('0 1 * * *', async () => {
      logger.info('Starting daily backup');
      try {
        await this.dbBackup.createBackup();
      } catch (error) {
        logger.error('Daily backup failed', { error });
      }
    });

    // Weekly maintenance on Sunday at 2 AM
    cron.schedule('0 2 * * 0', async () => {
      logger.info('Starting weekly maintenance');
      try {
        await this.performMaintenance();
      } catch (error) {
        logger.error('Weekly maintenance failed', { error });
      }
    });

    // Hourly monitoring
    cron.schedule('0 * * * *', async () => {
      logger.info('Starting hourly monitoring');
      try {
        const results = await DatabaseMonitor.monitorDatabase();
        logger.info('Hourly monitoring completed', { results });
      } catch (error) {
        logger.error('Hourly monitoring failed', { error });
      }
    });

    // Clean old backups daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
      logger.info('Starting backup cleanup');
      try {
        await this.dbBackup.cleanOldBackups();
      } catch (error) {
        logger.error('Backup cleanup failed', { error });
      }
    });
  }
}

// Export the class
module.exports = DatabaseMaintenance;

// If this file is run directly, start the maintenance scheduler
if (require.main === module) {
  const maintenance = new DatabaseMaintenance();
  maintenance.scheduleMaintenanceTasks();
  logger.info('Database maintenance tasks scheduled');
}
