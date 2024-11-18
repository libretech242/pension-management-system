const { AuditLog } = require('../models');
const logger = require('./logger');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {number} params.userId - ID of the user performing the action
 * @param {string} params.action - Action being performed
 * @param {string} params.entityType - Type of entity being affected
 * @param {number} [params.entityId] - ID of the entity being affected
 * @param {Object} [params.changes] - Changes made to the entity
 * @param {string} [params.ipAddress] - IP address of the user
 * @param {string} [params.userAgent] - User agent string
 */
const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId = null,
  changes = null,
  ipAddress = null,
  userAgent = null
}) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent
    });
  } catch (error) {
    logger.error('Failed to create audit log:', {
      error: error.message,
      userId,
      action,
      entityType
    });
  }
};

/**
 * Create audit log for sensitive data access
 * @param {Object} params - Parameters
 */
const logSensitiveDataAccess = async ({
  userId,
  entityType,
  entityId,
  accessType,
  ipAddress,
  userAgent
}) => {
  await createAuditLog({
    userId,
    action: 'SENSITIVE_DATA_ACCESS',
    entityType,
    entityId,
    changes: { accessType },
    ipAddress,
    userAgent
  });
};

/**
 * Create audit log for authentication events
 * @param {Object} params - Parameters
 */
const logAuthEvent = async ({
  userId,
  action,
  success,
  ipAddress,
  userAgent,
  details = {}
}) => {
  await createAuditLog({
    userId,
    action: `AUTH_${action}`,
    entityType: 'authentication',
    changes: {
      success,
      ...details
    },
    ipAddress,
    userAgent
  });
};

/**
 * Create audit log for data modifications
 * @param {Object} params - Parameters
 */
const logDataModification = async ({
  userId,
  entityType,
  entityId,
  action,
  oldData,
  newData,
  ipAddress,
  userAgent
}) => {
  await createAuditLog({
    userId,
    action: `DATA_${action}`,
    entityType,
    entityId,
    changes: {
      old: oldData,
      new: newData
    },
    ipAddress,
    userAgent
  });
};

module.exports = {
  createAuditLog,
  logSensitiveDataAccess,
  logAuthEvent,
  logDataModification
};
