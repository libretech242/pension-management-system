const request = require('supertest');
const app = require('../../app');
const { User } = require('../../models');
const { createTestUser, cleanupTestUser } = require('../testUtils');

describe('Password Reset Integration Tests', () => {
  let testUser;
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  const newPassword = 'NewPassword456@';

  beforeAll(async () => {
    testUser = await createTestUser(testEmail, testPassword);
  }, 30000);

  afterAll(async () => {
    await cleanupTestUser(testEmail);
  }, 30000);

  describe('POST /auth/forgot-password', () => {
    it('should send reset token for valid email', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset email sent');
    }, 10000);

    it('should return success even for non-existent email (prevent enumeration)', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset email sent');
    }, 10000);

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    }, 10000);
  });

  describe('POST /auth/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      // Request password reset to get token
      await request(app)
        .post('/auth/forgot-password')
        .send({ email: testEmail });

      // Get token from database
      const user = await User.findOne({ where: { email: testEmail } });
      resetToken = user.resetPasswordToken;
    }, 10000);

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password reset successful');

      // Verify login with new password
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: testEmail,
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body).toHaveProperty('token');
    }, 10000);

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: newPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    }, 10000);

    it('should fail with expired token', async () => {
      // Update token to be expired
      await User.update(
        {
          resetPasswordExpires: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          where: { email: testEmail }
        }
      );

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: newPassword
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    }, 10000);

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          token: resetToken,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    }, 10000);
  });
});
