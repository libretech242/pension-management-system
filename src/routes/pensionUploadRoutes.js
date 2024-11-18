const express = require('express');
const router = express.Router();
const { Payroll, Employee, PensionContribution } = require('../models');
const upload = require('../middleware/fileUpload');
const { processPayrollFile } = require('../utils/fileProcessor');

// POST /api/pension/upload - Process pension file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Process the uploaded file
    const payrollData = await processPayrollFile(req.file.path);

    // Process each row and create pension records
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

    res.status(201).json({
      message: 'Pension file processed successfully',
      results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/pension - Get pension records
router.get('/', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const where = {};
    
    if (employeeId) where.employeeId = employeeId;
    if (startDate) where.payPeriodStart = { [Op.gte]: new Date(startDate) };
    if (endDate) where.payPeriodEnd = { [Op.lte]: new Date(endDate) };

    const pensionRecords = await Payroll.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        }
      ]
    });

    res.json(pensionRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
