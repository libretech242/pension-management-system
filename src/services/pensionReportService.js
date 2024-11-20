const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const queryOptimizer = require('../utils/queryOptimizer');
const queryCache = require('../utils/queryCache');
const logger = require('../utils/logger');
const { parse } = require('papaparse');
const ExcelJS = require('exceljs');
const { Employee, PensionContribution, Payroll } = require('../models');
const { parseISO, format } = require('date-fns');

class PensionReportService {
  static async getEmployeeContributions(employeeId, startDate, endDate) {
    const query = `
      SELECT 
        e.first_name,
        e.last_name,
        e.nib_number,
        pc.contribution_date,
        pc.amount,
        pc.type
      FROM employees e
      JOIN pension_contributions pc ON e.id = pc.employee_id
      WHERE e.id = :employeeId
        AND pc.contribution_date BETWEEN :startDate AND :endDate
      ORDER BY pc.contribution_date DESC;
    `;

    const params = { employeeId, startDate, endDate };

    try {
      // Try to get from cache first
      return await queryCache.wrap(
        query,
        params,
        async () => {
          // If not in cache, optimize and execute query
          const analysis = await queryOptimizer.optimizeQuery(query, params);
          
          // Log any optimization suggestions
          if (analysis.suggestions.length > 0) {
            logger.info('Query optimization suggestions available', { analysis });
          }

          // Execute query with performance monitoring
          const { results, metrics } = await queryOptimizer.monitorQueryPerformance(query, params);
          
          // Log performance metrics
          logger.info('Query performance metrics', { metrics });
          
          return results;
        },
        3600 // Cache for 1 hour
      );
    } catch (error) {
      logger.error('Error fetching employee contributions', { error, employeeId });
      throw error;
    }
  }

  static async getContributionsSummary(year, month) {
    const query = `
      WITH monthly_totals AS (
        SELECT 
          e.department,
          SUM(CASE WHEN pc.type = 'EMPLOYEE' THEN pc.amount ELSE 0 END) as employee_contributions,
          SUM(CASE WHEN pc.type = 'EMPLOYER' THEN pc.amount ELSE 0 END) as employer_contributions,
          COUNT(DISTINCT e.id) as total_employees
        FROM employees e
        JOIN pension_contributions pc ON e.id = pc.employee_id
        WHERE EXTRACT(YEAR FROM pc.contribution_date) = :year
          AND EXTRACT(MONTH FROM pc.contribution_date) = :month
        GROUP BY e.department
      )
      SELECT 
        department,
        employee_contributions,
        employer_contributions,
        (employee_contributions + employer_contributions) as total_contributions,
        total_employees,
        (employee_contributions + employer_contributions) / total_employees as average_per_employee
      FROM monthly_totals
      ORDER BY total_contributions DESC;
    `;

    const params = { year, month };

    try {
      // Use cache wrapper with custom TTL for monthly reports
      return await queryCache.wrap(
        query,
        params,
        async () => {
          // Optimize and execute query
          const analysis = await queryOptimizer.optimizeQuery(query, params);
          
          if (analysis.suggestions.length > 0) {
            logger.info('Query optimization suggestions for monthly report', { analysis });
          }

          const { results, metrics } = await queryOptimizer.monitorQueryPerformance(query, params);
          
          logger.info('Monthly report query performance', { metrics });
          
          return results;
        },
        86400 // Cache for 24 hours
      );
    } catch (error) {
      logger.error('Error generating contributions summary', { error, year, month });
      throw error;
    }
  }

  static async invalidateEmployeeCache(employeeId) {
    try {
      // Invalidate all cached queries related to this employee
      const pattern = employeeId;
      const invalidatedCount = await queryCache.invalidatePattern(pattern);
      logger.info('Employee cache invalidated', { employeeId, invalidatedCount });
      return invalidatedCount;
    } catch (error) {
      logger.error('Error invalidating employee cache', { error, employeeId });
      throw error;
    }
  }

  static async getCacheStats() {
    return queryCache.getStats();
  }

  static async getContributionsReport(startDate, endDate) {
    try {
      const contributions = await PensionContribution.findAll({
        include: [{
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        }],
        where: {
          contributionDate: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['contributionDate', 'DESC']]
      });

      return contributions.map(contribution => ({
        employeeId: contribution.employeeId,
        employeeName: `${contribution.employee.firstName} ${contribution.employee.lastName}`,
        nibNumber: contribution.employee.nibNumber,
        contributionDate: format(contribution.contributionDate, 'yyyy-MM-dd'),
        amount: contribution.amount,
        type: contribution.type
      }));
    } catch (error) {
      logger.error('Error generating contributions report', { error });
      throw error;
    }
  }

  static async getEmployeeSummary(employeeId, startDate, endDate) {
    try {
      const contributions = await PensionContribution.findAll({
        where: {
          employeeId,
          contributionDate: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['contributionDate', 'ASC']]
      });

      // Group by month
      const monthlyTotals = contributions.reduce((acc, contribution) => {
        const month = format(contribution.contributionDate, 'yyyy-MM');
        if (!acc[month]) {
          acc[month] = {
            period: month,
            totalContributions: 0,
            employeeContributions: 0,
            employerContributions: 0
          };
        }

        acc[month].totalContributions += parseFloat(contribution.amount);
        if (contribution.type === 'EMPLOYEE') {
          acc[month].employeeContributions += parseFloat(contribution.amount);
        } else {
          acc[month].employerContributions += parseFloat(contribution.amount);
        }

        return acc;
      }, {});

      return Object.values(monthlyTotals);
    } catch (error) {
      logger.error('Error generating employee summary', { error, employeeId });
      throw error;
    }
  }

  static async importContributions(fileBuffer, mimeType) {
    const transaction = await sequelize.transaction();
    try {
      let data;
      if (mimeType === 'text/csv') {
        const csvContent = fileBuffer.toString();
        const parsed = parse(csvContent, { header: true, skipEmptyLines: true });
        data = parsed.data;
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        data = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          data.push({
            employeeId: row.getCell(1).value,
            contributionDate: row.getCell(2).value,
            amount: row.getCell(3).value,
            type: row.getCell(4).value
          });
        });
      }

      const contributions = await PensionContribution.bulkCreate(data, {
        transaction,
        validate: true
      });

      await transaction.commit();
      return { imported: contributions.length };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error importing contributions', { error });
      throw error;
    }
  }

  static async importEmployees(fileBuffer, mimeType) {
    const transaction = await sequelize.transaction();
    try {
      let data;
      if (mimeType === 'text/csv') {
        const csvContent = fileBuffer.toString();
        const parsed = parse(csvContent, { header: true, skipEmptyLines: true });
        data = parsed.data;
      } else {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileBuffer);
        const worksheet = workbook.getWorksheet(1);
        data = [];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          data.push({
            nibNumber: row.getCell(1).value,
            firstName: row.getCell(2).value,
            lastName: row.getCell(3).value,
            email: row.getCell(4).value,
            position: row.getCell(5).value,
            department: row.getCell(6).value,
            employmentType: row.getCell(7).value
          });
        });
      }

      const employees = await Employee.bulkCreate(data, {
        transaction,
        validate: true,
        updateOnDuplicate: ['nibNumber']
      });

      await transaction.commit();
      return { imported: employees.length };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error importing employees', { error });
      throw error;
    }
  }

  static async exportContributions(startDate, endDate) {
    try {
      return await PensionContribution.findAll({
        include: [{
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        }],
        where: {
          contributionDate: {
            [sequelize.Op.between]: [startDate, endDate]
          }
        },
        order: [['contributionDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error exporting contributions', { error });
      throw error;
    }
  }

  static async exportEmployees() {
    try {
      return await Employee.findAll({
        attributes: [
          'id', 'nibNumber', 'firstName', 'lastName', 'email',
          'position', 'department', 'employmentType', 'status'
        ],
        order: [['lastName', 'ASC'], ['firstName', 'ASC']]
      });
    } catch (error) {
      logger.error('Error exporting employees', { error });
      throw error;
    }
  }
}

module.exports = PensionReportService;
