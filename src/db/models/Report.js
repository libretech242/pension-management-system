const BaseModel = require('./BaseModel');
const { db } = require('../index');
const path = require('path');
const fs = require('fs').promises;

class Report extends BaseModel {
  constructor() {
    super('reports');
  }

  // Custom methods for report-specific operations
  async generateReport(type, parameters = {}) {
    try {
      // Create report record
      const [report] = await this.db(this.tableName)
        .insert({
          name: `${type}_report_${Date.now()}`,
          type,
          status: 'processing',
          parameters
        })
        .returning('*');

      // Generate report based on type
      let data;
      switch (type) {
        case 'contribution':
          data = await this.generateContributionReport(parameters);
          break;
        case 'vesting':
          data = await this.generateVestingReport(parameters);
          break;
        case 'employee':
          data = await this.generateEmployeeReport(parameters);
          break;
        case 'summary':
          data = await this.generateSummaryReport(parameters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Save report data to file
      const fileName = `${report.name}.json`;
      const filePath = path.join(__dirname, '../../../uploads/reports', fileName);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

      // Update report record
      const [updatedReport] = await this.db(this.tableName)
        .where({ id: report.id })
        .update({
          status: 'completed',
          file_path: fileName,
          generated_at: new Date()
        })
        .returning('*');

      return updatedReport;
    } catch (error) {
      // Update report record with error
      const [failedReport] = await this.db(this.tableName)
        .where({ id: report.id })
        .update({
          status: 'failed',
          error_message: error.message
        })
        .returning('*');

      throw error;
    }
  }

  // Report generation methods
  async generateContributionReport(parameters) {
    const query = this.db('contributions')
      .join('employees', 'contributions.employee_id', 'employees.id')
      .select(
        'contributions.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_id as employee_number'
      )
      .orderBy('contribution_date', 'desc');

    if (parameters.startDate) {
      query.where('contribution_date', '>=', parameters.startDate);
    }

    if (parameters.endDate) {
      query.where('contribution_date', '<=', parameters.endDate);
    }

    if (parameters.employeeId) {
      query.where('employee_id', parameters.employeeId);
    }

    return await query;
  }

  async generateVestingReport(parameters) {
    const employees = await this.db('employees')
      .where(parameters.activeOnly ? { is_active: true } : {});

    const vestingData = await Promise.all(
      employees.map(async (employee) => {
        const vestingStatus = await this.calculateVestingStatus(employee);
        return {
          ...employee,
          vesting_status: vestingStatus
        };
      })
    );

    return vestingData;
  }

  async generateEmployeeReport(parameters) {
    const query = this.db('employees')
      .select('*')
      .orderBy('last_name', 'asc');

    if (parameters.department) {
      query.where('department', parameters.department);
    }

    if (parameters.activeOnly) {
      query.where('is_active', true);
    }

    return await query;
  }

  async generateSummaryReport(parameters) {
    const [contributionSummary] = await this.db('contributions')
      .select(
        this.db.raw('SUM(amount) as total_contributions'),
        this.db.raw(`SUM(CASE WHEN type = 'employee' THEN amount ELSE 0 END) as employee_contributions`),
        this.db.raw(`SUM(CASE WHEN type = 'employer' THEN amount ELSE 0 END) as employer_contributions`)
      );

    const [employeeCounts] = await this.db('employees')
      .select(
        this.db.raw('COUNT(*) as total_employees'),
        this.db.raw("COUNT(CASE WHEN is_active = true THEN 1 END) as active_employees")
      );

    return {
      period: {
        start: parameters.startDate || 'All time',
        end: parameters.endDate || 'Present'
      },
      contributions: contributionSummary,
      employees: employeeCounts
    };
  }

  // Helper method
  async calculateVestingStatus(employee) {
    const yearsOfService = this.calculateYearsOfService(employee.date_of_joining);
    const vestingRule = await this.db('vesting_rules')
      .where('years_of_service', '<=', yearsOfService)
      .orderBy('years_of_service', 'desc')
      .first();

    return {
      years_of_service: yearsOfService,
      vesting_percentage: vestingRule ? vestingRule.vesting_percentage : 0,
      fully_vested: vestingRule ? vestingRule.vesting_percentage === 100 : false
    };
  }

  calculateYearsOfService(dateOfJoining) {
    const joinDate = new Date(dateOfJoining);
    const today = new Date();
    return Math.floor((today - joinDate) / (365.25 * 24 * 60 * 60 * 1000));
  }
}

module.exports = new Report();
