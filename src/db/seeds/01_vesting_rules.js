exports.seed = async function(knex) {
  // Clean the vesting_rules table
  await knex('vesting_rules').del();
  
  // Insert default vesting rules
  await knex('vesting_rules').insert([
    {
      years_of_service: 2,
      vesting_percentage: 20.00,
      effective_from: '2023-01-01',
      description: '20% vested after 2 years of service'
    },
    {
      years_of_service: 3,
      vesting_percentage: 40.00,
      effective_from: '2023-01-01',
      description: '40% vested after 3 years of service'
    },
    {
      years_of_service: 4,
      vesting_percentage: 60.00,
      effective_from: '2023-01-01',
      description: '60% vested after 4 years of service'
    },
    {
      years_of_service: 5,
      vesting_percentage: 80.00,
      effective_from: '2023-01-01',
      description: '80% vested after 5 years of service'
    },
    {
      years_of_service: 6,
      vesting_percentage: 100.00,
      effective_from: '2023-01-01',
      description: 'Fully vested after 6 years of service'
    }
  ]);
};
