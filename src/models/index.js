const sequelize = require('../config/database');

// Import model definitions
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const Employee = require('./employee');
const PensionContribution = require('./pensionContribution');
const Payroll = require('./payroll');
const AuditLog = require('./auditLog');

// Initialize models
const models = {
  Role,
  Permission,
  User,
  Employee,
  PensionContribution,
  Payroll,
  AuditLog
};

// Set up associations
Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'role_id',
  otherKey: 'permission_id'
});

Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permission_id',
  otherKey: 'role_id'
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});

User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

// Audit Log associations
User.hasMany(AuditLog, {
  foreignKey: 'userId',
  as: 'auditLogs'
});

AuditLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Employee associations
Employee.hasMany(PensionContribution, {
  foreignKey: 'employee_id',
  as: 'pensionContributions'
});

Employee.hasMany(Payroll, {
  foreignKey: 'employee_id',
  as: 'payrollRecords'
});

// PensionContribution associations
PensionContribution.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

PensionContribution.belongsTo(Payroll, {
  foreignKey: 'payroll_id',
  as: 'payroll'
});

// Payroll associations
Payroll.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

Payroll.hasMany(PensionContribution, {
  foreignKey: 'payroll_id',
  as: 'payrollContributions'
});

// Export the db object
module.exports = {
  sequelize,
  ...models
};
