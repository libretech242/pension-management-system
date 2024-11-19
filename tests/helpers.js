const { User, Role, Permission, Employee, PensionContribution } = require('../src/models');
const { generateToken } = require('../src/utils/auth');
const sequelize = require('../src/config/db');

const createTestUser = async () => {
  const role = await Role.create({
    name: 'admin',
    description: 'Administrator role'
  });

  const user = await User.create({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    roleId: role.id
  });

  return user;
};

const createTestEmployee = async () => {
  return await Employee.create({
    first_name: 'Test',
    last_name: 'Employee',
    email: 'employee@example.com',
    date_of_birth: new Date('1990-01-01'),
    date_of_joining: new Date('2020-01-01'),
    salary: 50000.00,
    salary_frequency: 'monthly',
    department: 'Engineering',
    position: 'Software Engineer',
    employee_id: 'EMP001',
    is_active: true
  });
};

const clearDatabase = async () => {
  try {
    // Disable triggers temporarily
    await sequelize.query('ALTER TABLE "employees" DISABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "pension_contributions" DISABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "users" DISABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "roles" DISABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "permissions" DISABLE TRIGGER ALL;');

    // Delete records in correct order
    await Promise.all([
      PensionContribution.destroy({ where: {}, force: true }),
      Employee.destroy({ where: {}, force: true }),
      User.destroy({ where: {}, force: true }),
      Role.destroy({ where: {}, force: true }),
      Permission.destroy({ where: {}, force: true })
    ]);
  } finally {
    // Re-enable triggers
    await sequelize.query('ALTER TABLE "employees" ENABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "pension_contributions" ENABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "users" ENABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "roles" ENABLE TRIGGER ALL;');
    await sequelize.query('ALTER TABLE "permissions" ENABLE TRIGGER ALL;');
  }
};

module.exports = {
  createTestUser,
  createTestEmployee,
  clearDatabase,
  generateTestToken: (user) => generateToken(user)
};
