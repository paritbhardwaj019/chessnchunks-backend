const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  allowedOrigins:
    process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000']
      : process.env.ALLOWED_ORIGINS,
  jwt: {
    invitationSecret: process.env.INVITATION_SECRET,
    secret: process.env.JWT_SECRET,
    resetPasswordSecret: process.env.RESET_PASSWORD_SECRET,
  },
  hostgator: {
    host: process.env.HOSTGATOR_SMTP_HOST,
    port: Number(process.env.HOSTGATOR_SMTP_PORT),
    username: process.env.HOSTGATOR_SMTP_USERNAME,
    password: process.env.HOSTGATOR_SMTP_PASSWORD,
    fromName: process.env.HOSTGATOR_SMTP_FROM_NAME,
    fromEmail: process.env.HOSTGATOR_SMTP_FROM_EMAIL,
  },
};

module.exports = config;
