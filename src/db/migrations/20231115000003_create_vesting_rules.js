exports.up = function(knex) {
  return knex.schema.createTable('vesting_rules', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.integer('years_of_service').notNullable();
    table.decimal('vesting_percentage', 5, 2).notNullable();
    table.date('effective_from').notNullable();
    table.date('effective_to').nullable();
    table.boolean('is_active').defaultTo(true);
    table.text('description').nullable();
    table.timestamps(true, true);

    // Ensure no overlapping rules for the same time period
    table.unique(['years_of_service', 'effective_from']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vesting_rules');
};
