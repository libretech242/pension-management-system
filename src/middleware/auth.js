const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const { createAuditLog } = require('../utils/auditLogger');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set in environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'Authentication system is not properly configured'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.userId, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      if (!user) {
        return res.status(401).json({ 
          error: 'Invalid user',
          message: 'User not found'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({ 
          error: 'Inactive user',
          message: 'Your account is currently inactive'
        });
      }

      // Attach user and permissions to request object
      req.user = user;
      req.userPermissions = user.Role ? user.Role.Permissions.map(p => p.name) : [];

      // Update last activity
      await user.update({ last_activity: new Date() });

      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          message: 'Your session has expired. Please login again.'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          error: 'Invalid token',
          message: 'Your authentication token is invalid'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred while authenticating your request'
    });
  }
};

// Check permission middleware
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.userPermissions || !req.userPermissions.includes(requiredPermission)) {
        // Log unauthorized access attempt
        await createAuditLog({
          userId: req.user?.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          details: {
            requiredPermission,
            userPermissions: req.userPermissions
          }
        });

        return res.status(403).json({
          error: 'Permission denied',
          message: `You don't have the required permission: ${requiredPermission}`
        });
      }
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        error: 'Permission check error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.Role?.name;
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        await createAuditLog({
          userId: req.user?.id,
          action: 'UNAUTHORIZED_ROLE_ACCESS',
          details: {
            requiredRoles: allowedRoles,
            userRole
          }
        });

        return res.status(403).json({
          error: 'Role permission denied',
          message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
        });
      }
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        error: 'Role check error',
        message: 'An error occurred while checking role permissions'
      });
    }
  };
};

// Sensitive data access middleware
const checkSensitiveDataAccess = async (req, res, next) => {
  try {
    const hasAccess = req.userPermissions.includes('view_sensitive_data');
    
    if (!hasAccess) {
      // Remove sensitive fields from the response
      res.locals.hideSensitiveData = true;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateToken,
  checkPermission,
  requireRole,
  checkSensitiveDataAccess
};
