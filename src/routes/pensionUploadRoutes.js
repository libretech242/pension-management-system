const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Payroll, Employee, PensionContribution } = require('../models');
const upload = require('../middleware/fileUpload');
const { processPayrollFile } = require('../utils/fileProcessor');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

// Ensure uploads directory exists
const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// GET /api/pension-uploads - Get all uploads
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const uploads = await Payroll.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        },
        {
          model: PensionContribution,
          as: 'pensionContributions'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(ApiResponse.success(uploads));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/pension-uploads/upload:
 *   post:
 *     summary: Upload and process pension file
 *     tags: [Pension Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File processed successfully
 */
router.post('/upload', authenticateToken, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    logger.info('Processing pension file upload', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

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
          payroll: {
            id: payroll.id,
            grossSalary: payroll.grossSalary,
            contributionAmount: payroll.contributionAmount
          }
        };
      })
    );

    // Clean up uploaded file
    await fs.promises.unlink(req.file.path);

    logger.info('Pension file processed successfully', {
      recordsProcessed: results.length
    });

    res.json(ApiResponse.success({
      message: 'Pension file processed successfully',
      results
    }));

  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting uploaded file:', unlinkError);
      }
    }
    next(error);
  }
});

// GET /api/pension-uploads/:id - Get specific upload
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const upload = await Payroll.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        },
        {
          model: PensionContribution,
          as: 'pensionContributions'
        }
      ]
    });

    if (!upload) {
      return res.status(404).json(ApiResponse.error('Upload not found', 404));
    }

    res.json(ApiResponse.success(upload));
  } catch (error) {
    next(error);
  }
});

// GET /api/pension-uploads/pension - Get pension records
router.get('/pension', authenticateToken, async (req, res, next) => {
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

    res.json(ApiResponse.success(pensionRecords));
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  logger.error('Pension upload error:', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json(ApiResponse.error(
    process.env.NODE_ENV === 'development' ? err.message : 'An error occurred processing the pension upload'
  ));
});

module.exports = router;
