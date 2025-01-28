const ngrok = require('ngrok');
const logger = require('../utils/logger');

(async function () {
  try {
    await ngrok.authtoken('2sEwKAQJJa8LDRtlSvHp97gW92B_5PcLisAZ47GSFAbtcs7b5');

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
