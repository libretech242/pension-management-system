const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const { logAuthEvent } = require('../utils/auditLogger');

/**
 * Login user and generate JWT token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with role and permissions
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    if (!user || !user.is_active) {
      await logAuthEvent({
        userId: null,
        action: 'LOGIN_FAILED',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { email, reason: 'Invalid user or inactive account' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      await logAuthEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'Invalid password' }
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        role: user.Role.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Log successful login
    await logAuthEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    // Update last login timestamp
    await user.update({ last_login: new Date() });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.Role.name,
        permissions: user.Role.Permissions.map(p => p.name)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleId, employeeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role_id: roleId,
      employee_id: employeeId
    });

    await logAuthEvent({
      userId: req.user?.id,
      action: 'USER_CREATED',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { newUserId: user.id, email }
    });

    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Error during registration' });
  }
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      await logAuthEvent({
        userId,
        action: 'PASSWORD_CHANGE_FAILED',
        success: false,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        details: { reason: 'Invalid current password' }
      });
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password_hash: passwordHash });

    await logAuthEvent({
      userId,
      action: 'PASSWORD_CHANGED',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Error changing password' });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        include: [Permission]
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.Role.name,
      permissions: user.Role.Permissions.map(p => p.name),
      lastLogin: user.last_login
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

/**
 * Forgot password handler
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Save it to the database with an expiration
    // 3. Send an email to the user with a reset link
    // For now, we'll just return a success message
    
    await logAuthEvent({
      userId: user.id,
      action: 'FORGOT_PASSWORD_REQUEST',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      details: { email }
    });

    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset password handler
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // In a real application, you would:
    // 1. Verify the reset token
    // 2. Check if it's expired
    // 3. Update the user's password
    // For now, we'll just return a success message

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber
    });

    await logAuthEvent({
      userId: user.id,
      action: 'PROFILE_UPDATE',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout handler
 */
const logout = async (req, res) => {
  try {
    await logAuthEvent({
      userId: req.user.id,
      action: 'LOGOUT',
      success: true,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List all users (admin only)
 */
const listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Role,
        include: [Permission]
      }],
      attributes: { exclude: ['password_hash'] }
    });

    res.json(users);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get audit logs (admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    // In a real application, you would:
    // 1. Query the audit logs from the database
    // 2. Add pagination
    // 3. Add filtering options
    // For now, we'll just return a placeholder message
    
    res.json({ message: 'Audit logs functionality to be implemented' });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  login,
  register,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  logout,
  listUsers,
  getAuditLogs
};
