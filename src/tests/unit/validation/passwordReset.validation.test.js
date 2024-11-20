const { validateForgotPassword, validateResetPassword } = require('../../../middleware/validation/authValidation');

describe('Password Reset Validation', () => {
  describe('validateForgotPassword', () => {
    it('should pass with valid email', async () => {
      const req = {
        body: { email: 'test@example.com' }
      };
      const res = {};
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateForgotPassword.map(middleware => middleware(req, res, next)));

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    }, 10000);

    it('should fail with invalid email format', async () => {
      const req = {
        body: { email: 'invalid-email' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateForgotPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid email format'
          })
        ])
      }));
    }, 10000);

    it('should fail with missing email', async () => {
      const req = {
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateForgotPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Email is required'
          })
        ])
      }));
    }, 10000);
  });

  describe('validateResetPassword', () => {
    it('should pass with valid token and password', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'ValidP@ssw0rd'
        }
      };
      const res = {};
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    }, 10000);

    it('should fail with missing token', async () => {
      const req = {
        body: {
          password: 'ValidP@ssw0rd'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Reset token is required'
          })
        ])
      }));
    }, 10000);

    it('should fail with missing password', async () => {
      const req = {
        body: {
          token: 'valid-token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password is required'
          })
        ])
      }));
    }, 10000);

    it('should fail with short password', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'Short1!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must be at least 8 characters long'
          })
        ])
      }));
    }, 10000);

    it('should fail with password missing uppercase', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'password123!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one uppercase letter'
          })
        ])
      }));
    }, 10000);

    it('should fail with password missing lowercase', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'PASSWORD123!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one lowercase letter'
          })
        ])
      }));
    }, 10000);

    it('should fail with password missing number', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'Password!'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one number'
          })
        ])
      }));
    }, 10000);

    it('should fail with password missing special character', async () => {
      const req = {
        body: {
          token: 'valid-token',
          password: 'Password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Execute all middleware functions in the array
      await Promise.all(validateResetPassword.map(middleware => middleware(req, res, next)));

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({
            msg: 'Password must contain at least one special character'
          })
        ])
      }));
    }, 10000);
  });
});
