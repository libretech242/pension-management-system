const BaseModel = require('./BaseModel');
const { db } = require('../index');

class Contribution extends BaseModel {
  constructor() {
    super('contributions');
  }

  // Custom methods for contribution-specific operations
  async getSummary(options = {}) {
    const query = this.db(this.tableName)
      .select(
        this.db.raw('SUM(amount) as total_contributions'),
        this.db.raw('COUNT(DISTINCT employee_id) as total_participants'),
        this.db.raw(`SUM(CASE WHEN type = 'employee' THEN amount ELSE 0 END) as employee_contributions`),
        this.db.raw(`SUM(CASE WHEN type = 'employer' THEN amount ELSE 0 END) as employer_contributions`)
      );

    if (options.startDate) {
      query.where('contribution_date', '>=', options.startDate);
    }

    if (options.endDate) {
      query.where('contribution_date', '<=', options.endDate);
    }

    const [summary] = await query;

    // Get active participants count
    const [{ active_participants }] = await this.db('employees')
      .where({ is_active: true })
      .count('* as active_participants');

    return {
      totalContributions: parseFloat(summary.total_contributions) || 0,
      employeeContributions: parseFloat(summary.employee_contributions) || 0,
      employerContributions: parseFloat(summary.employer_contributions) || 0,
      totalParticipants: parseInt(summary.total_participants) || 0,
      activeParticipants: parseInt(active_participants) || 0,
      averageContribution: summary.total_contributions && summary.total_participants
        ? parseFloat(summary.total_contributions) / parseInt(summary.total_participants)
        : 0
    };
  }

  async batchCreate(contributions) {
    const results = {
      successful: [],
      failed: [],
      summary: { total: contributions.length, successful: 0, failed: 0 }
    };

    await this.transaction(async (trx) => {
      for (const contribution of contributions) {
        try {
          // Generate reference number
          contribution.reference_number = await this.generateReferenceNumber();
          
          const [result] = await this.db(this.tableName)
            .insert(contribution)
            .returning('*')
            .transacting(trx);

          results.successful.push(result);
          results.summary.successful++;
        } catch (error) {
          results.failed.push({
            data: contribution,
            error: error.message
          });
          results.summary.failed++;
        }
      }
    });

    return results;
  }

  async getEmployeeContributions(employeeId, options = {}) {
    const query = this.db(this.tableName)
      .where({ employee_id: employeeId })
      .orderBy('contribution_date', 'desc');

    if (options.type) {
      query.where({ type: options.type });
    }

    if (options.startDate) {
      query.where('contribution_date', '>=', options.startDate);
    }

    if (options.endDate) {
      query.where('contribution_date', '<=', options.endDate);
    }

    if (options.limit) {
      query.limit(options.limit);
    }

    return await query;
  }

  // Helper methods
  async generateReferenceNumber() {
    const prefix = 'CONT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const reference = `${prefix}-${timestamp}-${random}`;
    
    // Ensure uniqueness
    const exists = await this.exists({ reference_number: reference });
    if (exists) {
      return this.generateReferenceNumber();
    }
    
    return reference;
  }
}

module.exports = new Contribution();
