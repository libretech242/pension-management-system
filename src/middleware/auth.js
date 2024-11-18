const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const { createAuditLog } = require('../utils/auditLogger');

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }

    // Attach user and permissions to request object
    req.user = user;
    req.userPermissions = user.Role.Permissions.map(p => p.name);

    // Update last login
    await user.update({ last_login: new Date() });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Check permission middleware
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.userPermissions.includes(requiredPermission)) {
        // Log unauthorized access attempt
        await createAuditLog({
          userId: req.user.id,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          entityType: 'permission',
          changes: { requiredPermission },
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        return res.status(403).json({ 
          error: 'Access denied. Insufficient permissions.' 
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.Role.name;
      
      if (!allowedRoles.includes(userRole)) {
        // Log unauthorized access attempt
        await createAuditLog({
          userId: req.user.id,
          action: 'UNAUTHORIZED_ROLE_ACCESS',
          entityType: 'role',
          changes: { requiredRoles: allowedRoles, userRole },
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        return res.status(403).json({ 
          error: 'Access denied. Insufficient role privileges.' 
        });
      }
      next();
    } catch (error) {
      next(error);
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
