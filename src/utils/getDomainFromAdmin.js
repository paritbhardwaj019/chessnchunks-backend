const logger = require('./logger');

/**
 * Switches the port of the given admin domain from 3001 to 3000.
 *
 * @param {string} adminDomain - The admin domain URL (e.g., 'http://chessinchunksreal.localhost:3001').
 * @returns {string|null} - The modified domain with port 3000 (e.g., 'http://chessinchunksreal.localhost:3000') or null if invalid input.
 */
function getDomainFromAdmin(adminDomain) {
  try {
    const url = new URL(adminDomain);

    const currentPort = url.port;
    let newPort;

    if (currentPort === '3001') {
      newPort = '3000';
    } else if (currentPort === '3000') {
      newPort = '3001';
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
