const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DOMAIN_CONFIG = {
  LOCAL: {
    PORT: 3000,
    HOST: 'localhost',
    ACADEMY_PORT: 3001,
    DEFAULT_PROTOCOL: 'http://',
    ACADEMY_DOMAIN: (academyName) =>
      `${DOMAIN_CONFIG.LOCAL.DEFAULT_PROTOCOL}${academyName.toLowerCase().replace(/\s+/g, '')}.${DOMAIN_CONFIG.LOCAL.HOST}:${DOMAIN_CONFIG.LOCAL.ACADEMY_PORT}`,
  },
  PRODUCTION: {
    FRONTEND_URL: process.env.FRONTEND_URL,
    CHESSINCHUNKS_URL: process.env.CHESSINCHUNKS_URL,
    DEFAULT_PROTOCOL: 'https://',
    ACADEMY_DOMAIN: (academyName) =>
      `${DOMAIN_CONFIG.PRODUCTION.DEFAULT_PROTOCOL}${academyName.toLowerCase().replace(/\s+/g, '')}.${process.env.BASE_DOMAIN}`,
  },
  ALLOWED_PROTOCOLS: ['http://', 'https://'],
  getAcademyDomain: (academyName) => {
    const environment =
      process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'LOCAL';
    return DOMAIN_CONFIG[environment].ACADEMY_DOMAIN(academyName);
  },
};

module.exports = DOMAIN_CONFIG;
