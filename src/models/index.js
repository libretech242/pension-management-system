const sequelize = require('../config/database');

// Import model definitions
const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const Employee = require('./employee');
const PensionContribution = require('./pensionContribution');
const Payroll = require('./payroll');

// Role-Permission Many-to-Many relationship
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

// User-Role One-to-Many relationship
Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

// Employee-PensionContribution One-to-Many relationship
Employee.hasMany(PensionContribution, {
  foreignKey: 'employee_id',
  as: 'contributions'
});
PensionContribution.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Employee-Payroll One-to-Many relationship
Employee.hasMany(Payroll, {
  foreignKey: 'employee_id',
  as: 'payrolls'
});
Payroll.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

module.exports = {
  sequelize,
  User,
  Role,
  Permission,
  Employee,
  PensionContribution,
  Payroll
};
