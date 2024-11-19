const { User, Role, Permission, Employee, PensionContribution } = require('../src/models');
const { generateToken } = require('../src/utils/auth');

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
    firstName: 'Test',
    lastName: 'Employee',
    nibNumber: 'TEST123',
    email: 'employee@example.com',
    employeeType: 'Full-time',
    company: 'Test Corp',
    contributionPercentage: 5,
    status: 'Active',
    startDate: new Date()
  });
};

const clearDatabase = async () => {
  await PensionContribution.destroy({ where: {}, force: true });
  await Employee.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  await Role.destroy({ where: {}, force: true });
  await Permission.destroy({ where: {}, force: true });
};

module.exports = {
  createTestUser,
  createTestEmployee,
  clearDatabase,
  generateTestToken: (user) => generateToken(user)
};
