const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DOMAIN_CONFIG = {
  LOCAL: {
    PORT: 3000,
    HOST: 'localhost',
    ACADEMY_PORT: 3001,
    DEFAULT_PROTOCOL: 'http://',
  },
  PRODUCTION: {
    FRONTEND_URL: process.env.FRONTEND_URL,
    CHESSINCHUNKS_URL: process.env.CHESSINCHUNKS_URL,
  },
  ALLOWED_PROTOCOLS: ['http://', 'https://'],
};

module.exports = DOMAIN_CONFIG;
