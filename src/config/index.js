const path = require('path');
const logger = require('./logger');

const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  allowedOrigins:
    process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : [
          'https://chessinchunks-admin.vercel.app',
          'https://chessnchunks-frontend-888h.vercel.app',
        ],
  jwt: {
    invitationSecret: process.env.INVITATION_SECRET,
    secret: process.env.JWT_SECRET,
    resetPasswordSecret: process.env.RESET_PASSWORD_SECRET,
  },
  frontendUrl: process.env.FRONTEND_URL,
  chessinChunksUrl: process.env.CHESSINCHUNKS_URL,
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  databaseUrl: process.env.DATABASE_URL,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

const requiredVariables = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'INVITATION_SECRET',
  'JWT_SECRET',
  'RESET_PASSWORD_SECRET',
  'FRONTEND_URL',
  'CHESSINCHUNKS_URL',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const missingVariables = requiredVariables.filter((key) => !process.env[key]);

if (missingVariables.length > 0) {
  logger.error(
    `Missing required environment variables: ${missingVariables.join(', ')}`
  );
  process.exit(1);
}

module.exports = config;
