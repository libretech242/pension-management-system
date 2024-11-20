require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetAdminPassword() {
  try {
    // New password for admin
    const newPassword = 'Admin@123';
    
    // Generate password hash
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update admin user password
    const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1
      WHERE email = 'admin@example.com' 
      RETURNING id, email;
    `, [passwordHash]);

    if (result.rows.length > 0) {
      console.log('Password reset successful for user:', result.rows[0].email);
      console.log('New password is:', newPassword);
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
