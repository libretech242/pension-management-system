exports.up = function(knex) {
  return knex.schema.createTable('reports', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.enum('type', ['contribution', 'vesting', 'employee', 'summary']).notNullable();
    table.enum('status', ['pending', 'processing', 'completed', 'failed']).defaultTo('pending');
    table.jsonb('parameters').nullable();
    table.string('file_path').nullable();
    table.timestamp('generated_at').nullable();
    table.text('error_message').nullable();
    table.timestamps(true, true);

    // Indexes
    table.index('type');
    table.index('status');
    table.index('generated_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('reports');
};
