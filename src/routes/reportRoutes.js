const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { PensionContribution, Employee, Payroll } = require('../models');
const fastcsv = require('fast-csv');
const { format, subYears, startOfYear, endOfYear } = require('date-fns');

// GET /api/reports/kpis - Get key performance indicators
router.get('/kpis', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const lastYear = currentYear - 1;

    const [
      totalContributions,
      averageContribution,
      totalEmployees,
      currentYearTotal,
      lastYearTotal
    ] = await Promise.all([
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
    ]);

    // Calculate YoY growth
    const yoyGrowth = lastYearTotal 
      ? ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(2)
      : 0;

    res.json({
      totalContributions: totalContributions || 0,
      averageContribution: averageContribution?.getDataValue('average') || 0,
      totalEmployees: totalEmployees || 0,
      yoyGrowth: parseFloat(yoyGrowth)
    });

  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: 'Error fetching KPIs' });
  }
});

// GET /api/reports/contribution-trends - Get contribution trends over time
router.get('/contribution-trends', async (req, res) => {
  try {
    const trends = await PensionContribution.findAll({
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
    });

    res.json(trends.map(trend => ({
      date: trend.getDataValue('date'),
      amount: parseFloat(trend.getDataValue('amount'))
    })));

  } catch (error) {
    console.error('Error fetching contribution trends:', error);
    res.status(500).json({ error: 'Error fetching contribution trends' });
  }
});

// GET /api/reports/employee-distribution - Get employee distribution by type
router.get('/employee-distribution', async (req, res) => {
  try {
    const distribution = await Employee.findAll({
      attributes: [
        'employeeType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: { status: 'active' },
      group: ['employeeType']
    });

    res.json(distribution.map(group => ({
      name: group.employeeType,
      value: parseInt(group.getDataValue('count'))
    })));

  } catch (error) {
    console.error('Error fetching employee distribution:', error);
    res.status(500).json({ error: 'Error fetching employee distribution' });
  }
});

// GET /api/reports/top-contributors - Get top contributing employees
router.get('/top-contributors', async (req, res) => {
  try {
    const topContributors = await PensionContribution.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['firstName', 'lastName']
      }],
      where: {
        contributionDate: {
          [Op.gte]: subYears(new Date(), 1)
        }
      },
      group: ['employeeId', 'employee.id', 'employee.firstName', 'employee.lastName'],
      order: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'DESC']],
      limit: 10
    });

    res.json(topContributors.map(contributor => ({
      name: `${contributor.employee.firstName} ${contributor.employee.lastName}`,
      amount: parseFloat(contributor.getDataValue('totalAmount'))
    })));

  } catch (error) {
    console.error('Error fetching top contributors:', error);
    res.status(500).json({ error: 'Error fetching top contributors' });
  }
});

// GET /api/reports/export - Export filtered data as CSV
router.get('/export', async (req, res) => {
  try {
    const { startDate, endDate, company, employeeType } = req.query;
    const where = {};
    const employeeWhere = {};

    if (startDate) where.contributionDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.contributionDate = { ...where.contributionDate, [Op.lte]: new Date(endDate) };
    if (company) employeeWhere.company = company;
    if (employeeType) employeeWhere.employeeType = employeeType;

    const contributions = await PensionContribution.findAll({
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
    });

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

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Error generating report' });
  }
});

// GET /api/reports/summary - Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, company, employeeType } = req.query;
    const where = {};
    const employeeWhere = {};

    if (startDate) where.contributionDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.contributionDate = { ...where.contributionDate, [Op.lte]: new Date(endDate) };
    if (company) employeeWhere.company = company;
    if (employeeType) employeeWhere.employeeType = employeeType;

    const [totalContributions, averageContribution, contributionCount] = await Promise.all([
      // Total contributions
      PensionContribution.sum('amount', {
        where,
        include: [{
          model: Employee,
          as: 'employee',
          where: employeeWhere
        }]
      }),
      // Average contribution
      PensionContribution.findOne({
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('amount')), 'averageAmount']
        ],
        where,
        include: [{
          model: Employee,
          as: 'employee',
          where: employeeWhere
        }]
      }),
      // Count of contributions
      PensionContribution.count({
        where,
        include: [{
          model: Employee,
          as: 'employee',
          where: employeeWhere
        }]
      })
    ]);

    res.json({
      totalContributions: totalContributions || 0,
      averageContribution: averageContribution?.getDataValue('averageAmount') || 0,
      contributionCount: contributionCount || 0,
      dateRange: {
        from: startDate || 'All time',
        to: endDate || 'Present'
      }
    });

  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Error getting summary statistics' });
  }
});

module.exports = router;