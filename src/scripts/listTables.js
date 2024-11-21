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

async function listTables() {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      AND table_type='BASE TABLE';
    `;
    const [results] = await sequelize.query(query);
    console.log('Tables in database:');
    results.forEach(row => console.log(row.table_name));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

listTables();
