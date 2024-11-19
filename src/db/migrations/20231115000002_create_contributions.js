exports.up = function(knex) {
  return knex.schema.createTable('contributions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('employee_id').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.enum('type', ['employee', 'employer']).notNullable();
    table.date('contribution_date').notNullable();
    table.string('reference_number').unique().notNullable();
    table.enum('status', ['pending', 'processed', 'failed']).defaultTo('pending');
    table.jsonb('metadata').nullable();
    table.timestamps(true, true);

    table.foreign('employee_id')
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');

    // Indexes
    table.index(['employee_id', 'contribution_date']);
    table.index('type');
    table.index('status');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contributions');
};
