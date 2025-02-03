const DOMAIN_CONFIG = require('../config/domains');
const logger = require('./logger');

function getDomainFromAdmin(adminDomain) {
  try {
    const url = new URL(adminDomain);

    const currentPort = url.port;
    let newPort;

    if (currentPort === DOMAIN_CONFIG.LOCAL.ACADEMY_PORT) {
      newPort = DOMAIN_CONFIG.LOCAL.HOST;
    } else if (currentPort === DOMAIN_CONFIG.LOCAL.PORT) {
      newPort = DOMAIN_CONFIG.LOCAL.ACADEMY_PORT;
    } else {
      logger.error(
        `Unexpected port "${currentPort}" in admin domain "${adminDomain}". No port change applied.`
      );
      return null;
    }

    const newUrl = new URL(url.toString());
    newUrl.port = newPort;

    return newUrl.origin;
  } catch (error) {
    logger.error(
      `Invalid admin domain URL: "${adminDomain}" - ${error.message}`
    );
    return null;
  }
}

module.exports = {
  getDomainFromAdmin,
};
