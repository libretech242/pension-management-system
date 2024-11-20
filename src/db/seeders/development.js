const bcrypt = require('bcryptjs');
const { User, Role, Permission, Employee } = require('../../models');
const logger = require('../../utils/logger');

const seedDevelopmentData = async () => {
  try {
    // Create roles
    const roles = await Role.bulkCreate([
      {
        name: 'admin',
        description: 'Administrator role with full access'
      },
      {
        name: 'manager',
        description: 'Manager role with department access'
      },
      {
        name: 'user',
        description: 'Standard user role'
      }
    ], { ignoreDuplicates: true });

    // Create permissions
    const permissions = await Permission.bulkCreate([
      { name: 'create_user', description: 'Can create users' },
      { name: 'edit_user', description: 'Can edit users' },
      { name: 'view_reports', description: 'Can view reports' },
      { name: 'manage_pensions', description: 'Can manage pensions' }
    ], { ignoreDuplicates: true });

    // Assign permissions to roles
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    await adminRole.setPermissions(permissions);

    // Create test users
    const users = [
      {
        email: 'admin@test.com',
        password_hash: await bcrypt.hash('Admin123!', 5),
        first_name: 'Admin',
        last_name: 'User',
        role_id: adminRole.id,
        is_active: true
      },
      {
        email: 'manager@test.com',
        password_hash: await bcrypt.hash('Manager123!', 5),
        first_name: 'Manager',
        last_name: 'User',
        role_id: (await Role.findOne({ where: { name: 'manager' } })).id,
        is_active: true
      },
      {
        email: 'user@test.com',
        password_hash: await bcrypt.hash('User123!', 5),
        first_name: 'Standard',
        last_name: 'User',
        role_id: (await Role.findOne({ where: { name: 'user' } })).id,
        is_active: true
      }
    ];

    await User.bulkCreate(users, { ignoreDuplicates: true });

    // Create test employees
    const employees = [
      {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        department: 'IT',
        position: 'Developer',
        hire_date: new Date('2023-01-01'),
        salary: 75000
      },
      {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@test.com',
        department: 'HR',
        position: 'Manager',
        hire_date: new Date('2023-02-01'),
        salary: 85000
      }
    ];

    await Employee.bulkCreate(employees, { ignoreDuplicates: true });

    logger.info('Development data seeded successfully');
    logger.debug('Created test accounts:', {
      users: users.map(u => ({ email: u.email, password: u.email.split('@')[0] + '123!' }))
    });

  } catch (error) {
    logger.error('Error seeding development data:', error);
    throw error;
  }
};

module.exports = seedDevelopmentData;
