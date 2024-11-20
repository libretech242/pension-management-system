const express = require('express');
const router = express.Router();
const { Payroll, Employee, PensionContribution, Op } = require('../models');
const upload = require('../middleware/fileUpload');
const { processPayrollFile } = require('../utils/fileProcessor');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

// POST /api/payroll - Process payroll file
router.post('/', authenticateToken, upload.single('payrollFile'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json(ApiResponse.error('No file uploaded'));
  }

  // Process the uploaded file
  processPayrollFile(req.file.path)
    .then(async (payrollData) => {
      // Process each row and create payroll records
      const results = await Promise.all(
        payrollData.map(async (row) => {
          // Find employee by NIB number
          const employee = await Employee.findOne({
            where: { nibNumber: row.nibNumber }
          });

          if (!employee) {
            throw new Error(`Employee with NIB ${row.nibNumber} not found`);
          }

          // Calculate contribution
          const contributionAmount = (row.grossSalary * employee.contributionPercentage) / 100;

          // Create payroll record
          const payroll = await Payroll.create({
            employeeId: employee.id,
            payPeriodStart: row.payPeriodStart,
            payPeriodEnd: row.payPeriodEnd,
            grossSalary: row.grossSalary,
            netSalary: row.grossSalary - contributionAmount,
            contributionAmount
          });

          // Create pension contribution record
          await PensionContribution.create({
            employeeId: employee.id,
            payrollId: payroll.id,
            contributionDate: new Date(),
            amount: contributionAmount
          });

          return {
            employee: employee.nibNumber,
            payrollId: payroll.id,
            contributionAmount
          };
        })
      );

      res.status(201).json(ApiResponse.success({
        message: 'Payroll file processed successfully',
        results
      }));
    })
    .catch(next);
});

// GET /api/payroll - Get payroll records
router.get('/', authenticateToken, (req, res, next) => {
  const { employeeId, startDate, endDate } = req.query;
  const where = {};
  
  if (employeeId) where.employeeId = employeeId;
  if (startDate) where.payPeriodStart = { [Op.gte]: new Date(startDate) };
  if (endDate) where.payPeriodEnd = { [Op.lte]: new Date(endDate) };

  Payroll.findAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'nibNumber']
      }
    ]
  })
    .then(payrolls => res.json(ApiResponse.success(payrolls)))
    .catch(next);
});

module.exports = router;
