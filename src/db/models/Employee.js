const BaseModel = require('./BaseModel');
const { db } = require('../index');

class Employee extends BaseModel {
  constructor() {
    super('employees');
  }

  // Custom methods for employee-specific operations
  async findWithContributions(id) {
    const employee = await this.db(this.tableName)
      .where({ 'employees.id': id })
      .first();

    if (!employee) return null;

    const contributions = await this.db('contributions')
      .where({ employee_id: id })
      .orderBy('contribution_date', 'desc');

    return { ...employee, contributions };
  }

  async calculateVestingStatus(id) {
    const employee = await this.findById(id);
    if (!employee) return null;

    const yearsOfService = await this.calculateYearsOfService(employee.date_of_joining);
    const vestingRule = await this.db('vesting_rules')
      .where('years_of_service', '<=', yearsOfService)
      .orderBy('years_of_service', 'desc')
      .first();

    return {
      yearsOfService,
      vestingPercentage: vestingRule ? vestingRule.vesting_percentage : 0,
      isFullyVested: vestingRule ? vestingRule.vesting_percentage === 100 : false,
      projectedFullVestingDate: this.calculateFullVestingDate(employee.date_of_joining)
    };
  }

  async getTotalContributions(id, options = {}) {
    const query = this.db('contributions')
      .where({ employee_id: id })
      .sum('amount as total');

    if (options.type) {
      query.where({ type: options.type });
    }

    if (options.startDate) {
      query.where('contribution_date', '>=', options.startDate);
    }

    if (options.endDate) {
      query.where('contribution_date', '<=', options.endDate);
    }

    const [result] = await query;
    return parseFloat(result.total) || 0;
  }

  async batchCreate(employees) {
    const results = {
      successful: [],
      failed: [],
      summary: { total: employees.length, successful: 0, failed: 0 }
    };

    await this.transaction(async (trx) => {
      for (const employee of employees) {
        try {
          const [result] = await this.db(this.tableName)
            .insert(employee)
            .returning('*')
            .transacting(trx);

          results.successful.push(result);
          results.summary.successful++;
        } catch (error) {
          results.failed.push({
            data: employee,
            error: error.message
          });
          results.summary.failed++;
        }
      }
    });

    return results;
  }

  // Helper methods
  calculateYearsOfService(dateOfJoining) {
    const joinDate = new Date(dateOfJoining);
    const today = new Date();
    return Math.floor((today - joinDate) / (365.25 * 24 * 60 * 60 * 1000));
  }

  calculateFullVestingDate(dateOfJoining) {
    const joinDate = new Date(dateOfJoining);
    joinDate.setFullYear(joinDate.getFullYear() + 6); // Assuming 6 years for full vesting
    return joinDate;
  }
}

module.exports = new Employee();
