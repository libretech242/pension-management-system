const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createTestUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await User.create({
    email,
    password: hashedPassword
  });
}

async function cleanupTestUser(email) {
  await User.destroy({
    where: { email }
  });
}

module.exports = {
  createTestUser,
  cleanupTestUser
};
