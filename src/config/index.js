const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  allowedOrigins:
    process.env.NODE_ENV === 'development'
      ? ['http://locahost:3000']
      : process.env.ALLOWED_ORIGINS,
  jwt: {
    invitationSecret: process.env.INVITATION_SECRET,
    secret: process.env.JWT_SECRET,
  },
};

module.exports = config;
