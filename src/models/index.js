const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');

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

module.exports = {
  User,
  Role,
  Permission
};
