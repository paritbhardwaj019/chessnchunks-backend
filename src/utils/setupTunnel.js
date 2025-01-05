const localtunnel = require('localtunnel');
const config = require('../config/index');
const logger = require('./logger');

const setupTunnel = async () => {
  try {
    const tunnel = await localtunnel({
      port: config.port,
      subdomain: 'chessinchunks',
    });

    logger.info(`Tunner URL - ${tunnel.url}`);

    tunnel.on('close', () => {
      logger.error('Tunnel Closed!');
    });

    tunnel.on('error', (err) => {
      logger.error(`Tunnel error - ${err}`);
    });
  } catch (error) {}
};

setupTunnel();

module.exports = { setupTunnel };
