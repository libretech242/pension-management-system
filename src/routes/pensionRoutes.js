const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { PensionContribution, Employee, Payroll } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const queryParser = require('../middleware/queryParser');
const ApiResponse = require('../utils/apiResponse');
const { validatePensionContribution } = require('../middleware/validation');

// Configure query parser for pension contributions
const pensionQueryParser = queryParser({
  allowedFields: [
    'contributionDate',
    'amount',
    'contributionType',
    'employeeId',
    'payrollId',
    'status',
    'createdAt'
  ],
  searchFields: ['contributionType', 'status'],
  defaultSort: 'contributionDate:desc'
});

/**
 * @swagger
 * /api/pension:
 *   get:
 *     summary: Get pension contributions with filtering, sorting, and pagination
 *     tags: [Pension]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., contributionDate:desc)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by contribution status
 *     responses:
 *       200:
 *         description: List of pension contributions
 */
router.get('/', authenticateToken, pensionQueryParser, async (req, res) => {
  try {
    const { page, limit, offset, sort, filter } = req.queryOptions;

    const { count, rows } = await PensionContribution.findAndCountAll({
      where: filter,
      order: Object.entries(sort),
      limit,
      offset,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber', 'company', 'employeeType']
        },
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd', 'grossSalary']
        }
      ]
    });

    // Calculate summary statistics
    const totalAmount = rows.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    const avgAmount = totalAmount / rows.length;

    const response = ApiResponse.paginated(rows, page, limit, count);
    response.summary = {
      totalAmount: Number(totalAmount.toFixed(2)),
      averageAmount: Number(avgAmount.toFixed(2)),
      contributionCount: rows.length
    };

    res.json(response);
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/pension/employee/{employeeId}:
 *   get:
 *     summary: Get pension contributions for a specific employee
 *     tags: [Pension]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Employee's pension contributions
 */
router.get('/employee/:employeeId', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      employeeId: req.params.employeeId
    };

    if (startDate && endDate) {
      where.contributionDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const contributions = await PensionContribution.findAll({
      where,
      order: [['contributionDate', 'DESC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber', 'company', 'employeeType']
        },
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd', 'grossSalary']
        }
      ]
    });

    // Calculate summary for employee
    const totalAmount = contributions.reduce((sum, contrib) => sum + Number(contrib.amount), 0);
    
    const response = ApiResponse.success(contributions);
    response.summary = {
      totalContributions: contributions.length,
      totalAmount: Number(totalAmount.toFixed(2)),
      averageAmount: Number((totalAmount / contributions.length).toFixed(2))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/pension:
 *   post:
 *     summary: Create a new pension contribution
 *     tags: [Pension]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - amount
 *               - contributionDate
 *             properties:
 *               employeeId:
 *                 type: string
 *               amount:
 *                 type: number
 *               contributionDate:
 *                 type: string
 *                 format: date
 *               contributionType:
 *                 type: string
 *               payrollId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pension contribution created successfully
 */
router.post('/', authenticateToken, validatePensionContribution, async (req, res) => {
  try {
    // Validate employee exists
    const employee = await Employee.findByPk(req.body.employeeId);
    if (!employee) {
      return res.status(404).json(ApiResponse.error('Employee not found', 404));
    }

    const contribution = await PensionContribution.create(req.body);
    
    // Fetch the created contribution with related data
    const createdContribution = await PensionContribution.findByPk(contribution.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        },
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd']
        }
      ]
    });

    res.status(201).json(
      ApiResponse.success(
        createdContribution,
        'Pension contribution created successfully',
        201
      )
    );
  } catch (error) {
    res.status(400).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/pension/{id}:
 *   put:
 *     summary: Update a pension contribution
 *     tags: [Pension]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PensionContribution'
 *     responses:
 *       200:
 *         description: Pension contribution updated successfully
 */
router.put('/:id', authenticateToken, validatePensionContribution, async (req, res) => {
  try {
    const contribution = await PensionContribution.findByPk(req.params.id);
    if (!contribution) {
      return res.status(404).json(ApiResponse.error('Pension contribution not found', 404));
    }

    await contribution.update(req.body);

    // Fetch updated contribution with related data
    const updatedContribution = await PensionContribution.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'nibNumber']
        },
        {
          model: Payroll,
          as: 'payroll',
          attributes: ['payPeriodStart', 'payPeriodEnd']
        }
      ]
    });

    res.json(
      ApiResponse.success(
        updatedContribution,
        'Pension contribution updated successfully'
      )
    );
  } catch (error) {
    res.status(400).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/pension/{id}:
 *   delete:
 *     summary: Delete a pension contribution
 *     tags: [Pension]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pension contribution deleted successfully
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const contribution = await PensionContribution.findByPk(req.params.id);
    if (!contribution) {
      return res.status(404).json(ApiResponse.error('Pension contribution not found', 404));
    }

    await contribution.destroy();
    res.json(ApiResponse.success(null, 'Pension contribution deleted successfully'));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message));
  }
});

module.exports = router;
