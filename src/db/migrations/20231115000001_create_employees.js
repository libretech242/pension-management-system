exports.up = function(knex) {
  return knex.schema.createTable('employees', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('email').unique().notNullable();
    table.date('date_of_birth').notNullable();
    table.date('date_of_joining').notNullable();
    table.decimal('salary', 15, 2).notNullable();
    table.enum('salary_frequency', ['weekly', 'monthly', 'yearly']).notNullable();
    table.string('department').nullable();
    table.string('position').nullable();
    table.string('employee_id').unique().notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('employees');
};
