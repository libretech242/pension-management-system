const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Role, Permission, AuditLog } = require('../models');
const { logAuthEvent, sendResetPasswordEmail } = require('../utils/auditLogger');
const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

class AuthController {
  /**
   * Login user and generate JWT token
   */
  static async login(req, res) {
    try {
      logger.info('Login attempt received:', { 
        email: req.body.email,
        headers: req.headers,
        origin: req.get('origin'),
        method: req.method
      });

      const { email, password } = req.body;

      if (!email || !password) {
        logger.warn('Login failed: Missing credentials');
        return res.status(400).json(ApiResponse.error('Email and password are required'));
      }

      // Find user with role and permissions
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [{
          model: Role,
          as: 'role',
          include: [{
            model: Permission,
            through: { attributes: [] }
          }]
        }]
      });

      if (!user) {
        logger.warn('Login failed: User not found', { email });
        return res.status(401).json(ApiResponse.error('Invalid email or password'));
      }

      logger.info('User found, verifying password');

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        logger.warn('Login failed: Invalid password', { email });
        return res.status(401).json(ApiResponse.error('Invalid email or password'));
      }

      logger.info('Password verified, generating token');

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '24h' }
      );

      // Log successful login
      await logAuthEvent('login', user.id, true, 'Login successful');

      logger.info('Login successful, sending response');

      return res.json(ApiResponse.success({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }
      }));

    } catch (error) {
      logger.error('Login error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      return res.status(500).json(ApiResponse.error('An error occurred during login'));
    }
  }

  /**
   * Register new user
   */
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, roleId } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json(ApiResponse.error('Email already registered'));
      }

      logger.info('User does not exist, creating new user');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        roleId
      });

      logger.info('User created, logging registration');

      // Log registration
      await logAuthEvent('register', user.id, true, 'Registration successful');

      res.status(201).json(ApiResponse.success({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }));

    } catch (error) {
      logger.error('Registration error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred during registration'));
    }
  }

  /**
   * Change user password
   */
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found'));
      }

      logger.info('User found, verifying current password');

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json(ApiResponse.error('Current password is incorrect'));
      }

      logger.info('Current password verified, hashing new password');

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await user.update({ password_hash: hashedPassword });

      logger.info('Password updated, logging password change');

      // Log password change
      await logAuthEvent('changePassword', user.id, true, 'Password changed successfully');

      res.json(ApiResponse.success({
        message: 'Password changed successfully'
      }));

    } catch (error) {
      logger.error('Change password error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while changing password'));
    }
  }

  /**
   * Get user profile details
   */
  static async getProfileDetails(req, res) {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          include: [{
            model: Permission,
            through: { attributes: [] }
          }]
        }],
        attributes: { exclude: ['password_hash'] }
      });

      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found'));
      }

      logger.info('User found, sending profile details');

      res.json(ApiResponse.success({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }
      }));

    } catch (error) {
      logger.error('Get profile error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while fetching profile'));
    }
  }

  /**
   * Forgot password handler
   */
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found'));
      }

      logger.info('User found, generating reset token');

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token
      await user.update({
        resetToken,
        resetTokenExpiry
      });

      logger.info('Reset token saved, sending reset email');

      // Send reset email
      await sendResetPasswordEmail(user.email, resetToken);

      // Log password reset request
      await logAuthEvent('forgotPassword', user.id, true, 'Password reset requested');

      res.json(ApiResponse.success({
        message: 'Password reset instructions sent to email'
      }));

    } catch (error) {
      logger.error('Forgot password error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while processing password reset'));
    }
  }

  /**
   * Reset password handler
   */
  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        where: {
          resetToken: token,
          resetTokenExpiry: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!user) {
        return res.status(400).json(ApiResponse.error('Password reset token is invalid or has expired'));
      }

      logger.info('User found, hashing new password');

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await user.update({
        password_hash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      logger.info('Password updated, logging password reset');

      // Log password reset
      await logAuthEvent('resetPassword', user.id, true, 'Password reset successful');

      res.json(ApiResponse.success({
        message: 'Password has been reset successfully'
      }));

    } catch (error) {
      logger.error('Reset password error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while resetting password'));
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json(ApiResponse.error('User not found'));
      }

      logger.info('User found, updating profile');

      // Update profile
      await user.update({
        first_name: firstName,
        last_name: lastName
      });

      logger.info('Profile updated, logging profile update');

      // Log profile update
      await logAuthEvent('updateProfile', user.id, true, 'Profile updated successfully');

      res.json(ApiResponse.success({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      }));

    } catch (error) {
      logger.error('Update profile error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while updating profile'));
    }
  }

  /**
   * Logout handler
   */
  static async logout(req, res) {
    try {
      const userId = req.user.id;

      logger.info('Logging out user');

      // Log logout
      await logAuthEvent('logout', userId, true, 'Logout successful');

      res.json(ApiResponse.success({
        message: 'Logged out successfully'
      }));

    } catch (error) {
      logger.error('Logout error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred during logout'));
    }
  }

  /**
   * List all users (admin only)
   */
  static async listUsers(req, res) {
    try {
      const users = await User.findAll({
        include: [{
          model: Role,
          include: [Permission]
        }],
        attributes: { exclude: ['password_hash'] }
      });

      logger.info('Users fetched, sending response');

      res.json(ApiResponse.success({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }))
      }));

    } catch (error) {
      logger.error('List users error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while fetching users'));
    }
  }

  /**
   * Get audit logs (admin only)
   */
  static async getAuditLogs(req, res) {
    try {
      const logs = await AuditLog.findAll({
        include: [{
          model: User,
          attributes: ['email', 'first_name', 'last_name']
        }],
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      logger.info('Audit logs fetched, sending response');

      res.json(ApiResponse.success({ logs }));

    } catch (error) {
      logger.error('Get audit logs error:', {
        error: error.message,
        stack: error.stack,
        body: req.body,
        headers: req.headers
      });
      res.status(500).json(ApiResponse.error('An error occurred while fetching audit logs'));
    }
  }
}

module.exports = AuthController;
