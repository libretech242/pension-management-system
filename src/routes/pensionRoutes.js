const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { PensionContribution, Employee, Payroll } = require('../models');

// GET /api/pensions - Get pension contributions with filters
router.get('/', async (req, res) => {
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
          attributes: ['firstName', 'lastName', 'nibNumber', 'company', 'employeeType']
        },
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd', 'grossSalary']
        }
      ]
    });

    // Calculate totals
    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    
    res.json({
      contributions,
      summary: {
        totalContributions,
        count: contributions.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/pensions/employee/:employeeId - Get contributions for specific employee
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      employeeId: req.params.employeeId
    };

    if (startDate) where.contributionDate = { [Op.gte]: new Date(startDate) };
    if (endDate) where.contributionDate = { ...where.contributionDate, [Op.lte]: new Date(endDate) };

    const contributions = await PensionContribution.findAll({
      where,
      include: [
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd', 'grossSalary']
        }
      ],
      order: [['contributionDate', 'DESC']]
    });

    const totalContributions = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);

    res.json({
      contributions,
      summary: {
        totalContributions,
        count: contributions.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
