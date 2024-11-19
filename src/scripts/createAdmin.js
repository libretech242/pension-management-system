require('dotenv').config();
const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Create admin role if it doesn't exist
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        description: 'System Administrator',
        is_system_role: true
      }
    });

    // Admin user credentials
    const adminUser = {
      email: 'admin@pensionpro.com',
      first_name: 'System',
      last_name: 'Administrator',
      role_id: adminRole.id,
      is_active: true
    };

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('Admin@123', salt);

    // Create admin user if it doesn't exist
    const [user, created] = await User.findOrCreate({
      where: { email: adminUser.email },
      defaults: {
        ...adminUser,
        password_hash
      }
    });

    if (created) {
      console.log('Admin user created successfully!');
      console.log('Email:', adminUser.email);
      console.log('Password: Admin@123');
      console.log('Please change your password after first login');
    } else {
      console.log('Admin user already exists.');
      console.log('Email:', adminUser.email);
    }

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
