require('dotenv').config({ path: '.env.development' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function dropTables() {
  try {
    // Drop tables in order of dependencies
    const tables = [
      'audit_logs',
      'pension_contributions',
      'employees',
      'payrolls',
      'role_permissions',
      'permissions',
      'users',
      'roles',
      'SequelizeMeta'
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`Dropped table: ${table}`);
      } catch (error) {
        console.error(`Error dropping table ${table}:`, error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

dropTables();
