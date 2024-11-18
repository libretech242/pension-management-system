const request = require('supertest');
const app = require('../../src/app');
const { User, Role, Permission } = require('../../src/models');
const { createTestUser, clearDatabase } = require('../helpers');

describe('Authentication API', () => {
  let testUser;
  let adminRole;

  beforeAll(async () => {
    await clearDatabase();
    
    // Create test role and permissions
    adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator role'
    });

    const permissions = await Permission.bulkCreate([
      { name: 'view_employees', description: 'View employees' },
      { name: 'manage_employees', description: 'Manage employees' }
    ]);

    await adminRole.addPermissions(permissions);
  });

  beforeEach(async () => {
    testUser = await createTestUser({
      email: 'test@example.com',
      password: 'Password123!',
      roleId: adminRole.id
    });
  });

  afterEach(async () => {
    await User.destroy({ where: { email: 'test@example.com' } });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
      expect(res.body.user).toHaveProperty('role', 'admin');
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should handle rate limiting', async () => {
      // Attempt multiple logins
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(429);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          roleId: adminRole.id
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully');
      expect(res.body).toHaveProperty('userId');

      // Cleanup
      await User.destroy({ where: { email: 'newuser@example.com' } });
    });

    it('should prevent duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'John',
          lastName: 'Doe',
          roleId: adminRole.id
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email already registered');
    });
  });

  describe('POST /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      authToken = loginRes.body.token;
    });

    it('should change password with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Password changed successfully');

      // Verify new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'NewPassword123!'
        });

      expect(loginRes.status).toBe(200);
    });

    it('should fail with invalid current password', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Current password is incorrect');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      authToken = loginRes.body.token;
    });

    it('should get user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).toHaveProperty('role', 'admin');
      expect(res.body).toHaveProperty('permissions');
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});
