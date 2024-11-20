exports.up = function(knex) {
  return knex.schema
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .alterTable('roles', function(table) {
      table.uuid('new_id').defaultTo(knex.raw('uuid_generate_v4()'));
    })
    .alterTable('users', function(table) {
      table.uuid('new_role_id');
    })
    .alterTable('permissions', function(table) {
      table.uuid('new_id').defaultTo(knex.raw('uuid_generate_v4()'));
    })
    .alterTable('role_permissions', function(table) {
      table.uuid('new_role_id');
      table.uuid('new_permission_id');
    })
    .then(function() {
      return knex.raw(`
        UPDATE roles SET new_id = uuid_generate_v4();
        UPDATE users SET new_role_id = (SELECT new_id FROM roles WHERE roles.id = users.role_id);
        UPDATE permissions SET new_id = uuid_generate_v4();
        UPDATE role_permissions 
        SET 
          new_role_id = (SELECT new_id FROM roles WHERE roles.id = role_permissions.role_id),
          new_permission_id = (SELECT new_id FROM permissions WHERE permissions.id = role_permissions.permission_id);
      `);
    })
    .then(function() {
      return knex.schema
        .alterTable('users', function(table) {
          table.dropColumn('role_id');
          table.renameColumn('new_role_id', 'role_id');
          table.foreign('role_id').references('roles.new_id');
        })
        .alterTable('role_permissions', function(table) {
          table.dropColumn('role_id');
          table.dropColumn('permission_id');
          table.renameColumn('new_role_id', 'role_id');
          table.renameColumn('new_permission_id', 'permission_id');
          table.foreign('role_id').references('roles.new_id');
          table.foreign('permission_id').references('permissions.new_id');
        })
        .alterTable('roles', function(table) {
          table.dropColumn('id');
          table.renameColumn('new_id', 'id');
          table.primary('id');
        })
        .alterTable('permissions', function(table) {
          table.dropColumn('id');
          table.renameColumn('new_id', 'id');
          table.primary('id');
        });
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('users', function(table) {
      table.integer('new_role_id');
    })
    .alterTable('role_permissions', function(table) {
      table.integer('new_role_id');
      table.integer('new_permission_id');
    })
    .alterTable('roles', function(table) {
      table.increments('new_id').primary();
    })
    .alterTable('permissions', function(table) {
      table.increments('new_id').primary();
    })
    .then(function() {
      return knex.raw(`
        UPDATE roles SET new_id = id::integer;
        UPDATE users SET new_role_id = (SELECT new_id FROM roles WHERE roles.id = users.role_id::text);
        UPDATE permissions SET new_id = id::integer;
        UPDATE role_permissions 
        SET 
          new_role_id = (SELECT new_id FROM roles WHERE roles.id = role_permissions.role_id::text),
          new_permission_id = (SELECT new_id FROM permissions WHERE permissions.id = role_permissions.permission_id::text);
      `);
    })
    .then(function() {
      return knex.schema
        .alterTable('users', function(table) {
          table.dropColumn('role_id');
          table.renameColumn('new_role_id', 'role_id');
          table.foreign('role_id').references('roles.new_id');
        })
        .alterTable('role_permissions', function(table) {
          table.dropColumn('role_id');
          table.dropColumn('permission_id');
          table.renameColumn('new_role_id', 'role_id');
          table.renameColumn('new_permission_id', 'permission_id');
          table.foreign('role_id').references('roles.new_id');
          table.foreign('permission_id').references('permissions.new_id');
        })
        .alterTable('roles', function(table) {
          table.dropColumn('id');
          table.renameColumn('new_id', 'id');
        })
        .alterTable('permissions', function(table) {
          table.dropColumn('id');
          table.renameColumn('new_id', 'id');
        });
    });
};
