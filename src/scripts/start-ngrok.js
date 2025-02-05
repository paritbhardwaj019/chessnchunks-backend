const ngrok = require('ngrok');
const config = require('../config');
const logger = require('../utils/logger');

(async function () {
  try {
    await ngrok.authtoken(config.ngrokAuthToken);

    const url = await ngrok.connect({
      proto: 'http',
      addr: 5000,
    });

    logger.info('Ngrok tunnels started successfully!');
    logger.info(`Ngrok URL: ${url}`);
  } catch (error) {
    logger.error('Error starting ngrok tunnels:', error);
  }
})();
