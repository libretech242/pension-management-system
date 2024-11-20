const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('./logger');

class DatabaseMonitor {
  static async getTableSizes() {
    try {
      const query = `
        SELECT 
          schemaname || '.' || tablename AS table_name,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
          pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
          pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS index_size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
      `;
      
      const results = await sequelize.query(query, { type: QueryTypes.SELECT });
      logger.info('Table size analysis completed', { results });
      return results;
    } catch (error) {
      logger.error('Error getting table sizes', { error });
      throw error;
    }
  }

  static async getSlowQueries() {
    try {
      const query = `
        SELECT 
          calls,
          total_time / calls as avg_time,
          query
        FROM pg_stat_statements
        WHERE total_time / calls > 100  -- queries taking more than 100ms on average
        ORDER BY avg_time DESC
        LIMIT 10;
      `;
      
      const results = await sequelize.query(query, { type: QueryTypes.SELECT });
      logger.info('Slow query analysis completed', { results });
      return results;
    } catch (error) {
      logger.error('Error getting slow queries', { error });
      throw error;
    }
  }

  static async getIndexUsage() {
    try {
      const query = `
        SELECT 
          schemaname || '.' || relname as table_name,
          indexrelname as index_name,
          idx_scan as number_of_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        ORDER BY idx_scan DESC;
      `;
      
      const results = await sequelize.query(query, { type: QueryTypes.SELECT });
      logger.info('Index usage analysis completed', { results });
      return results;
    } catch (error) {
      logger.error('Error getting index usage', { error });
      throw error;
    }
  }

  static async getConnectionStats() {
    try {
      const query = `
        SELECT 
          datname as database,
          numbackends as active_connections,
          xact_commit as transactions_committed,
          xact_rollback as transactions_rolled_back,
          blks_read as blocks_read,
          blks_hit as blocks_hit,
          tup_returned as rows_returned,
          tup_fetched as rows_fetched,
          tup_inserted as rows_inserted,
          tup_updated as rows_updated,
          tup_deleted as rows_deleted
        FROM pg_stat_database
        WHERE datname = current_database();
      `;
      
      const results = await sequelize.query(query, { type: QueryTypes.SELECT });
      logger.info('Connection statistics collected', { results });
      return results;
    } catch (error) {
      logger.error('Error getting connection stats', { error });
      throw error;
    }
  }

  static async monitorDatabase() {
    try {
      const tableSizes = await this.getTableSizes();
      const slowQueries = await this.getSlowQueries();
      const indexUsage = await this.getIndexUsage();
      const connectionStats = await this.getConnectionStats();

      return {
        timestamp: new Date(),
        tableSizes,
        slowQueries,
        indexUsage,
        connectionStats
      };
    } catch (error) {
      logger.error('Error monitoring database', { error });
      throw error;
    }
  }
}

module.exports = DatabaseMonitor;
