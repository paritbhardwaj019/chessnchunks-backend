const bcrypt = require('bcryptjs');

async function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

module.exports = comparePassword;
