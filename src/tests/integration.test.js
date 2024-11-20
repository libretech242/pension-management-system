const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');
const { Employee } = require('../models');
const { generateToken } = require('../utils/auth');

let server;
let token;
let testEmployee;

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Start server
    server = app.listen(0);
    
    // Create test employee
    testEmployee = await Employee.create({
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration.test@example.com',
      dateOfBirth: '1990-01-01',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'Developer',
      salary: 75000,
      hireDate: '2020-01-01'
    });

    // Generate test token
    token = generateToken({
      id: testEmployee.id,
      email: testEmployee.email,
      role: 'admin'
    });
  });

  afterAll(async () => {
    // Cleanup
    await Employee.destroy({ where: {}, force: true });
    await server.close();
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/employees');
      
      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Employee Operations', () => {
    it('should create new employee', async () => {
      const newEmployee = {
        firstName: 'New',
        lastName: 'Employee',
        email: 'new.employee@example.com',
        dateOfBirth: '1992-01-01',
        employeeId: 'EMP002',
        department: 'HR',
        position: 'Manager',
        salary: 85000,
        hireDate: '2021-01-01'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(newEmployee);

      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe(newEmployee.email);
    });

    it('should get employee by id', async () => {
      const response = await request(app)
        .get(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe(testEmployee.email);
    });

    it('should update employee', async () => {
      const update = { position: 'Senior Developer' };

      const response = await request(app)
        .put(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(update);

      expect(response.status).toBe(200);
      expect(response.body.data.position).toBe(update.position);
    });

    it('should delete employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${testEmployee.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const deleted = await Employee.findByPk(testEmployee.id);
      expect(deleted).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid employee data', async () => {
      const invalidEmployee = {
        firstName: '',
        lastName: '',
        email: 'invalid-email',
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidEmployee);

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle duplicate email', async () => {
      const duplicateEmployee = {
        firstName: 'Duplicate',
        lastName: 'Employee',
        email: 'integration.test@example.com',
        dateOfBirth: '1990-01-01',
        employeeId: 'EMP003',
        department: 'IT',
        position: 'Developer',
        salary: 75000,
        hireDate: '2020-01-01'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateEmployee);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should handle not found employee', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .get(`/api/employees/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });
});
