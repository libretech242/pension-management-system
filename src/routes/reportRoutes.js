const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { PensionContribution, Employee, Payroll } = require('../models');
const fastcsv = require('fast-csv');
const { format, subYears, startOfYear, endOfYear } = require('date-fns');
const { authenticateToken } = require('../middleware/auth');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/reports/kpis - Get key performance indicators
router.get('/kpis', (req, res, next) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const lastYear = currentYear - 1;

  Promise.all([
    // Total contributions
    PensionContribution.sum('amount'),
    
    // Average contribution per employee
    PensionContribution.findOne({
      attributes: [[Sequelize.fn('AVG', Sequelize.col('amount')), 'average']],
    }),
    
    // Total active employees
    Employee.count({ where: { status: 'active' } }),
    
    // Current year total
    PensionContribution.sum('amount', {
      where: {
        contributionDate: {
          [Op.between]: [
            startOfYear(new Date(currentYear, 0, 1)),
            endOfYear(new Date(currentYear, 0, 1))
          ]
        }
      }
    }),
    
    // Last year total
    PensionContribution.sum('amount', {
      where: {
        contributionDate: {
          [Op.between]: [
            startOfYear(new Date(lastYear, 0, 1)),
            endOfYear(new Date(lastYear, 0, 1))
          ]
        }
      }
    })
  ])
    .then(([totalContributions, averageContribution, totalEmployees, currentYearTotal, lastYearTotal]) => {
      // Calculate YoY growth
      const yoyGrowth = lastYearTotal 
        ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(2)
        : 0;

      res.json(ApiResponse.success({
        totalContributions: totalContributions || 0,
        averageContribution: averageContribution?.getDataValue('average') || 0,
        totalEmployees: totalEmployees || 0,
        yoyGrowth: parseFloat(yoyGrowth)
      }));
    })
    .catch(next);
});

// GET /api/reports/contribution-trends - Get contribution trends over time
router.get('/contribution-trends', (req, res, next) => {
  PensionContribution.findAll({
    attributes: [
      [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('contributionDate')), 'date'],
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'amount']
    ],
    where: {
      contributionDate: {
        [Op.gte]: subYears(new Date(), 1)
      }
    },
    group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('contributionDate'))],
    order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('contributionDate')), 'ASC']]
  })
    .then(trends => {
      res.json(ApiResponse.success(
        trends.map(trend => ({
          date: trend.getDataValue('date'),
          amount: parseFloat(trend.getDataValue('amount'))
        }))
      ));
    })
    .catch(next);
});

// GET /api/reports/employee-distribution - Get employee distribution by type
router.get('/employee-distribution', (req, res, next) => {
  Employee.findAll({
    attributes: [
      'employeeType',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
    ],
    where: { status: 'active' },
    group: ['employeeType']
  })
    .then(distribution => {
      res.json(ApiResponse.success(
        distribution.map(group => ({
          name: group.employeeType,
          value: parseInt(group.getDataValue('count'))
        }))
      ));
    })
    .catch(next);
});

// GET /api/reports/top-contributors - Get top contributing employees
router.get('/top-contributors', (req, res, next) => {
  PensionContribution.findAll({
    attributes: [
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
    ],
    include: [{
      model: Employee,
      as: 'employee',
      attributes: ['id', 'firstName', 'lastName', 'nibNumber', 'company']
    }],
    group: ['employee.id', 'employee.firstName', 'employee.lastName', 'employee.nibNumber', 'employee.company'],
    order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']],
    limit: 10
  })
    .then(contributors => {
      res.json(ApiResponse.success(
        contributors.map(contributor => ({
          employee: {
            id: contributor.employee.id,
            name: `${contributor.employee.firstName} ${contributor.employee.lastName}`,
            nibNumber: contributor.employee.nibNumber,
            company: contributor.employee.company
          },
          totalAmount: parseFloat(contributor.getDataValue('totalAmount'))
        }))
      ));
    })
    .catch(next);
});

// GET /api/reports/export - Export filtered data as CSV
router.get('/export', (req, res, next) => {
  const { startDate, endDate, company, employeeType } = req.query;
  const where = {};
  const employeeWhere = {};

  if (startDate) where.contributionDate = { [Op.gte]: new Date(startDate) };
  if (endDate) where.contributionDate = { ...where.contributionDate, [Op.lte]: new Date(endDate) };
  if (company) employeeWhere.company = company;
  if (employeeType) employeeWhere.employeeType = employeeType;

  PensionContribution.findAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        where: employeeWhere,
        attributes: ['firstName', 'lastName', 'nibNumber', 'company', 'employeeType', 'contributionPercentage']
      },
      {
        model: Payroll,
        as: 'payroll',
        attributes: ['payPeriodStart', 'payPeriodEnd', 'grossSalary', 'netSalary']
      }
    ],
    order: [['contributionDate', 'DESC']]
  })
    .then(contributions => {
      // Transform data for CSV
      const csvData = contributions.map(contribution => ({
        'NIB Number': contribution.employee.nibNumber,
        'Employee Name': `${contribution.employee.firstName} ${contribution.employee.lastName}`,
        'Company': contribution.employee.company,
        'Employee Type': contribution.employee.employeeType,
        'Contribution Percentage': `${contribution.employee.contributionPercentage}%`,
        'Pay Period': `${format(new Date(contribution.payroll.payPeriodStart), 'yyyy-MM-dd')} to ${format(new Date(contribution.payroll.payPeriodEnd), 'yyyy-MM-dd')}`,
        'Gross Salary': contribution.payroll.grossSalary.toFixed(2),
        'Net Salary': contribution.payroll.netSalary.toFixed(2),
        'Contribution Amount': contribution.amount.toFixed(2),
        'Contribution Date': format(new Date(contribution.contributionDate), 'yyyy-MM-dd')
      }));

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=pension-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      );

      // Stream the CSV data
      const csvStream = fastcsv.write(csvData, { headers: true });
      csvStream.pipe(res);
    })
    .catch(next);
});

// GET /api/reports/summary - Get contribution summary with filters
router.get('/summary', (req, res, next) => {
  const { startDate, endDate, company, employeeType } = req.query;
  const where = {};
  const employeeWhere = {};

  if (startDate && endDate) {
    where.contributionDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  if (company) {
    employeeWhere.company = company;
  }

  if (employeeType) {
    employeeWhere.employeeType = employeeType;
  }

  PensionContribution.findAll({
    attributes: [
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalContributions'],
      [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount'],
      [Sequelize.fn('AVG', Sequelize.col('amount')), 'averageAmount']
    ],
    where,
    include: [{
      model: Employee,
      as: 'employee',
      where: employeeWhere,
      attributes: []
    }]
  })
    .then(([summary]) => {
      res.json(ApiResponse.success({
        totalContributions: parseInt(summary.getDataValue('totalContributions')),
        totalAmount: parseFloat(summary.getDataValue('totalAmount') || 0),
        averageAmount: parseFloat(summary.getDataValue('averageAmount') || 0)
      }));
    })
    .catch(next);
});

module.exports = router;
