exports.up = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.timestamp('last_activity').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('users', function(table) {
    table.dropColumn('last_activity');
  });
};
