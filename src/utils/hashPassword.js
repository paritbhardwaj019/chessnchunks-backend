const bcrypt = require('bcryptjs');

async function hashPassword(password, salt) {
  return bcrypt.hash(password, salt);
}

module.exports = hashPassword;
