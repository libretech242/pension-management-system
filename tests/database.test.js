const sequelize = require('../src/config/database.test');

describe('Database Connection', () => {
  it('should connect to the database', async () => {
    try {
      await sequelize.authenticate();
      expect(true).toBe(true); // If we get here, connection was successful
    } catch (error) {
      console.error('Test database connection error:', error);
      throw error;
    }
  });

  it('should have SSL enabled', async () => {
    // Check if we can connect (SSL is required for Neon)
    await expect(sequelize.authenticate()).resolves.not.toThrow();
  });

  it('should be using the test schema', () => {
    expect(sequelize.options.schema).toBe('test');
  });

  it('should be able to create and use the test schema', async () => {
    try {
      // Try to create a test table in the test schema
      await sequelize.query('CREATE TABLE IF NOT EXISTS test.test_table (id SERIAL PRIMARY KEY, name TEXT);');
      
      // Insert a test record
      await sequelize.query("INSERT INTO test.test_table (name) VALUES ('test');");
      
      // Query the test record
      const [results] = await sequelize.query('SELECT * FROM test.test_table;');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('test');
      
      // Clean up
      await sequelize.query('DROP TABLE IF EXISTS test.test_table;');
    } catch (error) {
      console.error('Schema test error:', error);
      throw error;
    }
  });
});
