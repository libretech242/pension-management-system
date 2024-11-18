const express = require('express');
const router = express.Router();
const { Employee } = require('../models');
const { validateEmployee } = require('../middleware/validation');

// POST /api/employees - Add new employee
router.post('/', validateEmployee, async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/employees - Get all employees with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, company } = req.query;
    const where = {};
    
    if (type) where.employeeType = type;
    if (company) where.company = company;

    const employees = await Employee.findAll({
      where,
      attributes: { exclude: ['password'] }
    });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/employees/:id - Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
