const ngrok = require('ngrok');
const logger = require('../utils/logger');

(async function () {
  try {
    await ngrok.authtoken('1flMMQ0papBHkuf50NTRyKIsgbm_7uiFMT2VcT6nMDpU4oVw');

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
