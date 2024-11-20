const express = require('express');
const router = express.Router();
const { Employee } = require('../models');
const { validateEmployee } = require('../middleware/validation');
const queryParser = require('../middleware/queryParser');
const ApiResponse = require('../utils/apiResponse');
const { authenticateToken } = require('../middleware/auth');

// Configure query parser for employees
const employeeQueryParser = queryParser({
  allowedFields: ['firstName', 'lastName', 'company', 'employeeType', 'nibNumber', 'createdAt'],
  searchFields: ['firstName', 'lastName', 'nibNumber'],
  defaultSort: 'lastName:asc'
});

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees with filtering, sorting, and pagination
 *     tags: [Employees]
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
 *         description: Sort field and order (e.g., lastName:asc,firstName:desc)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in firstName, lastName, and nibNumber
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get('/', authenticateToken, employeeQueryParser, async (req, res) => {
  try {
    const { page, limit, offset, sort, filter } = req.queryOptions;

    const { count, rows } = await Employee.findAndCountAll({
      where: filter,
      order: Object.entries(sort),
      limit,
      offset,
      attributes: { exclude: ['password'] }
    });

    res.json(ApiResponse.paginated(rows, page, limit, count));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post('/', authenticateToken, validateEmployee, async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(ApiResponse.success(employee, 'Employee created successfully', 201));
  } catch (error) {
    res.status(400).json(ApiResponse.error(error.message));
  }
});

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
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
 *         description: Employee details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!employee) {
      return res.status(404).json(ApiResponse.error('Employee not found', 404));
    }
    
    res.json(ApiResponse.success(employee));
  } catch (error) {
    res.status(500).json(ApiResponse.error(error.message));
  }
});

module.exports = router;
