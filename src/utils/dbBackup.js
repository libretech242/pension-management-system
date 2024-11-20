const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filePath = path.join(this.backupDir, filename);

    const command = `pg_dump "${process.env.DATABASE_URL}" -F c -f "${filePath}"`;

    try {
      await this.executeCommand(command);
      logger.info('Database backup created successfully', { filename });
      return filePath;
    } catch (error) {
      logger.error('Error creating database backup', { error });
      throw error;
    }
  }

  async restoreBackup(backupPath) {
    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file does not exist');
    }

    const command = `pg_restore -d "${process.env.DATABASE_URL}" -c "${backupPath}"`;

    try {
      await this.executeCommand(command);
      logger.info('Database restored successfully', { backupPath });
    } catch (error) {
      logger.error('Error restoring database', { error });
      throw error;
    }
  }

  async listBackups() {
    try {
      const files = await fs.promises.readdir(this.backupDir);
      return files.filter(file => file.endsWith('.sql'));
    } catch (error) {
      logger.error('Error listing backups', { error });
      throw error;
    }
  }

  async cleanOldBackups(daysToKeep = 7) {
    try {
      const files = await this.listBackups();
      const now = new Date();

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.promises.stat(filePath);
        const daysOld = (now - stats.mtime) / (1000 * 60 * 60 * 24);

        if (daysOld > daysToKeep) {
          await fs.promises.unlink(filePath);
          logger.info('Deleted old backup', { file });
        }
      }
    } catch (error) {
      logger.error('Error cleaning old backups', { error });
      throw error;
    }
  }

  executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }
}

module.exports = DatabaseBackup;
