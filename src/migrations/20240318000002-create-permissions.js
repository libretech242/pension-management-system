'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create permissions table
    await queryInterface.createTable('permissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create role_permissions junction table
    await queryInterface.createTable('role_permissions', {
      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add composite primary key
    await queryInterface.addConstraint('role_permissions', {
      fields: ['role_id', 'permission_id'],
      type: 'primary key',
      name: 'role_permissions_pkey'
    });

    // Add default permissions
    const defaultPermissions = [
      { name: 'view_dashboard', description: 'Can view dashboard' },
      { name: 'manage_users', description: 'Can manage users' },
      { name: 'manage_roles', description: 'Can manage roles' },
      { name: 'view_reports', description: 'Can view reports' },
      { name: 'manage_pensions', description: 'Can manage pensions' }
    ];

    await queryInterface.bulkInsert('permissions', 
      defaultPermissions.map(perm => ({
        ...perm,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );

    // Get role and permission IDs
    const [roles, permissions] = await Promise.all([
      queryInterface.sequelize.query('SELECT id, name FROM roles'),
      queryInterface.sequelize.query('SELECT id, name FROM permissions')
    ]);

    const adminRole = roles[0].find(role => role.name === 'admin');
    const userRole = roles[0].find(role => role.name === 'user');

    // Assign all permissions to admin role
    const adminPermissions = permissions[0].map(perm => ({
      role_id: adminRole.id,
      permission_id: perm.id,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // Assign basic permissions to user role
    const userPermissions = permissions[0]
      .filter(perm => ['view_dashboard', 'view_reports'].includes(perm.name))
      .map(perm => ({
        role_id: userRole.id,
        permission_id: perm.id,
        created_at: new Date(),
        updated_at: new Date()
      }));

    await queryInterface.bulkInsert('role_permissions', [
      ...adminPermissions,
      ...userPermissions
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('role_permissions');
    await queryInterface.dropTable('permissions');
  }
};
