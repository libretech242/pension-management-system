require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { User, Role, Permission, Employee, PensionContribution } = require('../models');

async function dropAllTables() {
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.dropAllTables();
  console.log('All tables dropped successfully');
}

async function dropAllTypes() {
  try {
    await sequelize.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT typname 
          FROM pg_type 
          INNER JOIN pg_namespace ON pg_type.typnamespace = pg_namespace.oid 
          WHERE nspname = 'public' AND typtype = 'e'
        ) 
        LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    console.log('All custom types dropped successfully');
  } catch (error) {
    console.log('Error dropping types:', error.message);
  }
}

async function initializeDatabase() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Drop all existing tables and types
    await dropAllTables();
    await dropAllTypes();

    // Force sync all models
    await sequelize.sync({ force: true });
    console.log('Database schema created successfully.');

    // Create default roles
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator role with full access'
    });

    const managerRole = await Role.create({
      name: 'manager',
      description: 'Manager role with department-level access'
    });

    const employeeRole = await Role.create({
      name: 'employee',
      description: 'Basic employee access'
    });

    console.log('Roles created successfully');

    // Create default permissions
    const permissions = [
      { 
        name: 'manage_users', 
        description: 'Permission to manage users',
        resource: 'users',
        action: 'MANAGE'
      },
      { 
        name: 'manage_employees', 
        description: 'Permission to manage employees',
        resource: 'employees',
        action: 'MANAGE'
      },
      { 
        name: 'manage_contributions', 
        description: 'Permission to manage pension contributions',
        resource: 'contributions',
        action: 'MANAGE'
      },
      { 
        name: 'view_reports', 
        description: 'Permission to view reports',
        resource: 'reports',
        action: 'VIEW'
      }
    ];

    const createdPermissions = await Permission.bulkCreate(permissions);
    console.log('Permissions created successfully');

    // Associate all permissions with admin role
    await adminRole.addPermissions(createdPermissions);
    console.log('Admin role permissions assigned successfully');

    // Associate view_reports permission with manager role
    const viewReportsPermission = createdPermissions.find(p => p.name === 'view_reports');
    await managerRole.addPermission(viewReportsPermission);
    console.log('Manager role permissions assigned successfully');

    // Create default admin user
    const adminUser = await User.create({
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('Admin@123', 10),
      first_name: 'System',
      last_name: 'Administrator',
      role_id: adminRole.id,
      is_active: true
    });

    console.log('Admin user created successfully');

  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the initialization
initializeDatabase();
