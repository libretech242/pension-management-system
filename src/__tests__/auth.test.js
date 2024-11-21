const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');

describe('Authentication', () => {
  beforeAll(async () => {
    // Ensure database is synced
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });
  });
});
