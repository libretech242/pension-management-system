require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addPermissions() {
  try {
    // Enable uuid-ossp extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('Enabled uuid-ossp extension');

    // Create role_permissions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id)
      );
    `);
    console.log('Created role_permissions table');

    // Link permissions to admin role
    const adminRoleId = '846955c0-f3ff-4b89-840a-ad6026973ad5';
    const permissions = await pool.query('SELECT id, name FROM permissions');
    
    const values = permissions.rows.map(p => `('${adminRoleId}', '${p.id}', NOW(), NOW())`).join(',');
    
    await pool.query(`
      INSERT INTO role_permissions (role_id, permission_id, "createdAt", "updatedAt")
      VALUES ${values};
    `);

    console.log('Linked permissions to admin role');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

addPermissions();
