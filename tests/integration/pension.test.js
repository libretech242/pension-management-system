const request = require('supertest');
const app = require('../../src/app');
const { PensionContribution, Employee, Payroll } = require('../../src/models');
const { generateToken } = require('../../src/utils/auth');

describe('Pension Management API', () => {
  let authToken;
  let testEmployee;
  let testContribution;

  beforeAll(async () => {
    // Create test user and generate auth token
    authToken = generateToken({ 
      userId: 1,
      role: 'admin'
    });

    // Create test employee with all required fields
    testEmployee = await Employee.create({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      date_of_birth: new Date('1990-01-01'),
      date_of_joining: new Date('2020-01-01'),
      salary: 50000.00,
      salary_frequency: 'monthly',
      department: 'Engineering',
      position: 'Software Engineer',
      employee_id: 'EMP001',
      is_active: true
    });

    // Create test contribution
    testContribution = await PensionContribution.create({
      employeeId: testEmployee.id,
      amount: 1000,
      contributionDate: new Date(),
      type: 'Employee'
    });
  });

  afterAll(async () => {
    // Cleanup test data with proper syntax
    await PensionContribution.destroy({ where: {}, force: true });
    await Employee.destroy({ where: {}, force: true });
    await Payroll.destroy({ where: {}, force: true });
  });

  describe('GET /api/contributions', () => {
    it('should return all contributions', async () => {
      const res = await request(app)
        .get('/api/contributions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('amount');
      expect(res.body[0]).toHaveProperty('employeeId');
    });

    it('should filter contributions by date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const res = await request(app)
        .get('/api/contributions')
        .query({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/contributions', () => {
    it('should create a new contribution', async () => {
      const newContribution = {
        employeeId: testEmployee.id,
        amount: 500,
        type: 'Employer',
        contributionDate: new Date()
      };

      const res = await request(app)
        .post('/api/contributions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newContribution);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.amount).toBe(newContribution.amount);
      expect(res.body.employeeId).toBe(newContribution.employeeId);
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/contributions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/contributions/:id', () => {
    it('should update an existing contribution', async () => {
      const updates = {
        amount: 750
      };

      const res = await request(app)
        .put(`/api/contributions/${testContribution.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe(updates.amount);
    });

    it('should return 404 for non-existent contribution', async () => {
      const res = await request(app)
        .put('/api/contributions/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/contributions/:id', () => {
    it('should delete an existing contribution', async () => {
      const res = await request(app)
        .delete(`/api/contributions/${testContribution.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify deletion
      const deleted = await PensionContribution.findByPk(testContribution.id);
      expect(deleted).toBeNull();
    });
  });

  describe('GET /api/statistics', () => {
    it('should return pension statistics', async () => {
      const res = await request(app)
        .get('/api/statistics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalEmployees');
      expect(res.body).toHaveProperty('activeContributors');
      expect(res.body).toHaveProperty('totalContributions');
      expect(res.body).toHaveProperty('averageContribution');
    });
  });

  describe('GET /api/reports/generate', () => {
    it('should generate contribution report', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const res = await request(app)
        .get('/api/reports/generate')
        .query({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('employeeName');
      expect(res.body[0]).toHaveProperty('amount');
      expect(res.body[0]).toHaveProperty('contributionDate');
    });

    it('should handle invalid date range', async () => {
      const res = await request(app)
        .get('/api/reports/generate')
        .query({ 
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
