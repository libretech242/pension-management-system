const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Role, Permission, AuditLog } = require('../models');
const { logAuthEvent, sendResetPasswordEmail } = require('../utils/auditLogger');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Login user and generate JWT token
   */
  static async login(req, res) {
    try {
      logger.info('Login attempt:', { email: req.body.email });
      const { email, password } = req.body;

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
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        logger.warn('Login failed: Invalid password', { email });
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Log successful login
      await logAuthEvent('login', user.id, true, 'Login successful');

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred during login'
      });
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
        return res.status(400).json({
          error: 'Registration Error',
          message: 'Email already registered'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        roleId
      });

      // Log registration
      await logAuthEvent('register', user.id, true, 'Registration successful');

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred during registration'
      });
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
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({
          error: 'Authentication Error',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await user.update({ password: hashedPassword });

      // Log password change
      await logAuthEvent('changePassword', user.id, true, 'Password changed successfully');

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while changing password'
      });
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
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching profile'
      });
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
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token
      await user.update({
        resetToken,
        resetTokenExpiry
      });

      // Send reset email
      await sendResetPasswordEmail(user.email, resetToken);

      // Log password reset request
      await logAuthEvent('forgotPassword', user.id, true, 'Password reset requested');

      res.json({
        message: 'Password reset instructions sent to email'
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while processing password reset'
      });
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
        return res.status(400).json({
          error: 'Invalid Token',
          message: 'Password reset token is invalid or has expired'
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password and clear reset token
      await user.update({
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      });

      // Log password reset
      await logAuthEvent('resetPassword', user.id, true, 'Password reset successful');

      res.json({
        message: 'Password has been reset successfully'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while resetting password'
      });
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
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Update profile
      await user.update({
        firstName,
        lastName
      });

      // Log profile update
      await logAuthEvent('updateProfile', user.id, true, 'Profile updated successfully');

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while updating profile'
      });
    }
  }

  /**
   * Logout handler
   */
  static async logout(req, res) {
    try {
      const userId = req.user.id;

      // Log logout
      await logAuthEvent('logout', userId, true, 'Logout successful');

      res.json({
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred during logout'
      });
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
        attributes: { exclude: ['password'] }
      });

      res.json({
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role.name,
          permissions: user.role.Permissions.map(p => p.name)
        }))
      });

    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching users'
      });
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
          attributes: ['email', 'firstName', 'lastName']
        }],
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      res.json({ logs });

    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        error: 'Server Error',
        message: 'An error occurred while fetching audit logs'
      });
    }
  }
}

module.exports = AuthController;
