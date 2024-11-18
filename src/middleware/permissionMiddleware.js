const { User, Role, Permission } = require('../models');
const { logAuthEvent } = require('../utils/auditLogger');

/**
 * Check if user has required permission
 * @param {string} requiredPermission - Permission name required for the action
 */
const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          include: [Permission]
        }]
      });

      if (!user) {
        await logAuthEvent({
          userId: req.user.id,
          action: 'PERMISSION_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { reason: 'User not found', requiredPermission }
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      const userPermissions = user.Role.Permissions.map(p => p.name);
      
      if (!userPermissions.includes(requiredPermission)) {
        await logAuthEvent({
          userId: user.id,
          action: 'PERMISSION_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { 
            reason: 'Missing required permission',
            requiredPermission,
            userPermissions
          }
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Error checking permissions' });
    }
  };
};

/**
 * Check if user has required role
 * @param {string|string[]} requiredRoles - Role(s) required for the action
 */
const hasRole = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [Role]
      });

      if (!user) {
        await logAuthEvent({
          userId: req.user.id,
          action: 'ROLE_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { reason: 'User not found', requiredRoles }
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!roles.includes(user.Role.name)) {
        await logAuthEvent({
          userId: user.id,
          action: 'ROLE_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { 
            reason: 'Invalid role',
            requiredRoles,
            userRole: user.Role.name
          }
        });
        return res.status(403).json({ error: 'Insufficient role' });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ error: 'Error checking role' });
    }
  };
};

/**
 * Check if user owns the resource or has admin role
 * @param {Function} getResourceUserId - Function to extract resource owner ID from request
 */
const isResourceOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [Role]
      });

      if (!user) {
        await logAuthEvent({
          userId: req.user.id,
          action: 'OWNERSHIP_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { reason: 'User not found' }
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      // Admin role bypass
      if (user.Role.name === 'admin') {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);
      
      if (user.id !== resourceUserId) {
        await logAuthEvent({
          userId: user.id,
          action: 'OWNERSHIP_CHECK_FAILED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          details: { 
            reason: 'Not resource owner',
            resourceUserId,
            requestingUserId: user.id
          }
        });
        return res.status(403).json({ error: 'Access denied' });
      }

      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({ error: 'Error checking resource ownership' });
    }
  };
};

module.exports = {
  hasPermission,
  hasRole,
  isResourceOwnerOrAdmin
};
