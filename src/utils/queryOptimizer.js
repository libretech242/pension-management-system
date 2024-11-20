const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('./logger');

class QueryOptimizer {
  static async explainQuery(query, params = {}) {
    try {
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const [results] = await sequelize.query(explainQuery, {
        type: QueryTypes.SELECT,
        replacements: params
      });

      return results;
    } catch (error) {
      logger.error('Error explaining query', { error, query });
      throw error;
    }
  }

  static async optimizeQuery(query, params = {}) {
    try {
      // Get query execution plan
      const executionPlan = await this.explainQuery(query, params);
      
      // Analyze execution plan
      const analysis = this.analyzeExecutionPlan(executionPlan);
      
      // Log optimization suggestions
      logger.info('Query optimization analysis', { analysis });
      
      return analysis;
    } catch (error) {
      logger.error('Error optimizing query', { error, query });
      throw error;
    }
  }

  static analyzeExecutionPlan(plan) {
    const analysis = {
      suggestions: [],
      warnings: [],
      indexRecommendations: []
    };

    this.analyzePlanNode(plan[0]['Plan'], analysis);
    return analysis;
  }

  static analyzePlanNode(node, analysis) {
    // Check for sequential scans on large tables
    if (node['Node Type'] === 'Seq Scan' && node['Actual Rows'] > 1000) {
      analysis.suggestions.push({
        type: 'INDEX_RECOMMENDATION',
        message: `Consider adding an index for table ${node['Relation Name']} to avoid sequential scan on large table`,
        details: node
      });
    }

    // Check for high-cost operations
    if (node['Total Cost'] > 1000) {
      analysis.warnings.push({
        type: 'HIGH_COST_OPERATION',
        message: `High-cost operation detected: ${node['Node Type']}`,
        details: node
      });
    }

    // Check for inefficient joins
    if (node['Node Type'].includes('Join') && node['Total Cost'] > 500) {
      analysis.suggestions.push({
        type: 'JOIN_OPTIMIZATION',
        message: `Consider optimizing join operation: ${node['Node Type']}`,
        details: node
      });
    }

    // Recursively analyze child nodes
    if (node['Plans']) {
      node['Plans'].forEach(childNode => {
        this.analyzePlanNode(childNode, analysis);
      });
    }
  }

  static generateOptimizedQuery(originalQuery, analysis) {
    let optimizedQuery = originalQuery;

    // Apply optimization suggestions
    analysis.suggestions.forEach(suggestion => {
      switch (suggestion.type) {
        case 'INDEX_RECOMMENDATION':
          // Log index recommendation
          logger.info('Index recommendation', { suggestion });
          break;
        case 'JOIN_OPTIMIZATION':
          // Log join optimization suggestion
          logger.info('Join optimization suggestion', { suggestion });
          break;
      }
    });

    return optimizedQuery;
  }

  static async monitorQueryPerformance(query, params = {}) {
    const startTime = process.hrtime();
    
    try {
      const results = await sequelize.query(query, {
        type: QueryTypes.SELECT,
        replacements: params
      });

      const endTime = process.hrtime(startTime);
      const executionTime = (endTime[0] * 1000) + (endTime[1] / 1000000); // Convert to milliseconds

      // Log query performance metrics
      logger.info('Query performance metrics', {
        executionTime,
        rowCount: results.length,
        query
      });

      return {
        results,
        metrics: {
          executionTime,
          rowCount: results.length
        }
      };
    } catch (error) {
      logger.error('Error executing query', { error, query });
      throw error;
    }
  }
}

module.exports = QueryOptimizer;
